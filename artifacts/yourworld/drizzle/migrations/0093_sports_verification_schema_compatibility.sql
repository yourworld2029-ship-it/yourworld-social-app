-- Bring the live Sports Verification table in line with the private identity
-- form without replacing or deleting any existing records.
ALTER TABLE public.sports_verification_details
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS father_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS passport_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS certificate_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS identity_details_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS street_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS state_province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS postal_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS identity_key text;

ALTER TABLE public.sports_verification_details
  ADD COLUMN IF NOT EXISTS passport_number_normalized text
  GENERATED ALWAYS AS (
    nullif(lower(regexp_replace(btrim(coalesce(passport_number, '')), '\s+', '', 'g')), '')
  ) STORED,
  ADD COLUMN IF NOT EXISTS certificate_number_normalized text
  GENERATED ALWAYS AS (
    nullif(lower(regexp_replace(btrim(coalesce(certificate_number, '')), '\s+', '', 'g')), '')
  ) STORED;

CREATE OR REPLACE FUNCTION public.refresh_sports_verification_identity_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.identity_key := CASE
    WHEN nullif(btrim(coalesce(NEW.full_name, '')), '') IS NULL
      OR nullif(btrim(coalesce(NEW.father_name, '')), '') IS NULL
      OR NEW.date_of_birth IS NULL
    THEN NULL
    ELSE lower(regexp_replace(btrim(NEW.full_name), '\s+', ' ', 'g'))
      || '|'
      || lower(regexp_replace(btrim(NEW.father_name), '\s+', ' ', 'g'))
      || '|'
      || to_char(NEW.date_of_birth, 'YYYY-MM-DD')
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sports_verification_identity_key_refresh
  ON public.sports_verification_details;
CREATE TRIGGER sports_verification_identity_key_refresh
  BEFORE INSERT OR UPDATE OF full_name, father_name, date_of_birth
  ON public.sports_verification_details
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_sports_verification_identity_key();

UPDATE public.sports_verification_details
SET full_name = full_name
WHERE identity_key IS NULL
  AND nullif(btrim(coalesce(full_name, '')), '') IS NOT NULL
  AND nullif(btrim(coalesce(father_name, '')), '') IS NOT NULL
  AND date_of_birth IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sports_verification_active_passport_unique
  ON public.sports_verification_details (passport_number_normalized)
  WHERE passport_number_normalized IS NOT NULL
    AND review_status IN ('pending', 'approved');

CREATE UNIQUE INDEX IF NOT EXISTS sports_verification_active_certificate_unique
  ON public.sports_verification_details (certificate_number_normalized)
  WHERE certificate_number_normalized IS NOT NULL
    AND review_status IN ('pending', 'approved');

CREATE UNIQUE INDEX IF NOT EXISTS sports_verification_active_identity_unique
  ON public.sports_verification_details (identity_key)
  WHERE identity_key IS NOT NULL
    AND review_status IN ('pending', 'approved');

NOTIFY pgrst, 'reload schema';
