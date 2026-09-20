-- KYC state is controlled by the review system, not by client form payloads.

CREATE OR REPLACE FUNCTION public.enforce_payout_profile_kyc_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_status text;
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT kyc_status
    INTO v_existing_status
    FROM public.creator_payout_profiles
    WHERE user_id = OLD.user_id;

    NEW.kyc_status := CASE
      WHEN v_existing_status = 'verified' THEN 'verified'
      ELSE 'pending'
    END;
  ELSE
    NEW.kyc_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_payout_profile_kyc_state
  ON public.creator_payout_profiles;
CREATE TRIGGER enforce_payout_profile_kyc_state
  BEFORE INSERT OR UPDATE ON public.creator_payout_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payout_profile_kyc_state();

REVOKE ALL ON FUNCTION public.enforce_payout_profile_kyc_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_payout_profile_kyc_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_payout_profile_kyc_state() TO service_role;