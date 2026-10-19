ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS country_change_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS country_locked boolean NOT NULL DEFAULT false;

UPDATE public.profiles AS profile
SET country = verification.country
FROM public.sports_verification_details AS verification
WHERE profile.id = verification.user_id
  AND COALESCE(NULLIF(BTRIM(profile.country), ''), '') = ''
  AND COALESCE(NULLIF(BTRIM(verification.country), ''), '') <> '';

UPDATE public.profiles AS profile
SET country = ''
WHERE profile.country IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN country SET DEFAULT '',
  ALTER COLUMN country SET NOT NULL;

UPDATE public.profiles AS profile
SET country_locked = true
WHERE profile.verification_requested IS TRUE
   OR EXISTS (
     SELECT 1
     FROM public.sports_verification_details AS verification
     WHERE verification.user_id = profile.id
       AND (
         verification.submitted_at IS NOT NULL
         OR verification.review_status IN (
           'pending',
           'approved',
           'rejected',
           'correction_requested'
         )
       )
   )
   OR EXISTS (
     SELECT 1
     FROM public.national_award_verifications AS award
     WHERE award.user_id = profile.id
       AND award.review_status <> 'draft'
   );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_country_change_count_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_country_change_count_check
      CHECK (country_change_count BETWEEN 0 AND 1);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_country_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.country := COALESCE(BTRIM(NEW.country), '');

  IF TG_OP = 'INSERT' THEN
    NEW.country_change_count := 0;
    NEW.country_locked := false;
    RETURN NEW;
  END IF;

  NEW.country_change_count := OLD.country_change_count;
  NEW.country_locked := COALESCE(OLD.country_locked, false)
    OR COALESCE(NEW.country_locked, false);

  IF LOWER(BTRIM(NEW.country)) IS DISTINCT FROM LOWER(BTRIM(OLD.country)) THEN
    IF COALESCE(OLD.country_locked, false) THEN
      RAISE EXCEPTION 'Country is permanently locked after verification submission';
    END IF;

    IF COALESCE(NULLIF(BTRIM(OLD.country), ''), '') = '' THEN
      RETURN NEW;
    END IF;

    IF COALESCE(NULLIF(BTRIM(NEW.country), ''), '') = '' THEN
      RAISE EXCEPTION 'A saved country cannot be cleared';
    END IF;

    IF OLD.country_change_count >= 1 THEN
      RAISE EXCEPTION 'The one allowed country change has already been used';
    END IF;

    NEW.country_change_count := OLD.country_change_count + 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_country_change ON public.profiles;
CREATE TRIGGER profiles_guard_country_change
BEFORE INSERT OR UPDATE OF country, country_change_count, country_locked
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_country_change();

CREATE OR REPLACE FUNCTION public.lock_profile_country_after_sports_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.submitted_at IS NOT NULL
     OR NEW.review_status IN ('pending', 'approved', 'rejected', 'correction_requested') THEN
    UPDATE public.profiles
    SET country_locked = true
    WHERE id = NEW.user_id
      AND country_locked IS DISTINCT FROM true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sports_verification_lock_profile_country
  ON public.sports_verification_details;
CREATE TRIGGER sports_verification_lock_profile_country
AFTER INSERT OR UPDATE OF submitted_at, review_status
ON public.sports_verification_details
FOR EACH ROW
EXECUTE FUNCTION public.lock_profile_country_after_sports_submission();

CREATE OR REPLACE FUNCTION public.lock_profile_country_after_award_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(NEW.review_status, 'pending_verification') <> 'draft' THEN
    UPDATE public.profiles
    SET country_locked = true
    WHERE id = NEW.user_id
      AND country_locked IS DISTINCT FROM true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS national_award_lock_profile_country
  ON public.national_award_verifications;
CREATE TRIGGER national_award_lock_profile_country
AFTER INSERT OR UPDATE OF review_status
ON public.national_award_verifications
FOR EACH ROW
EXECUTE FUNCTION public.lock_profile_country_after_award_submission();
