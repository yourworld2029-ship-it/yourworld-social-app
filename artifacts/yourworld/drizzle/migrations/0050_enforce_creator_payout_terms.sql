-- Bank and payout-detail writes must carry an accepted monetization agreement.

CREATE OR REPLACE FUNCTION public.enforce_creator_payout_terms()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.terms_accepted_at IS NULL
     AND (
       (TG_OP = 'INSERT' AND (
         NEW.email IS NOT NULL
         OR NEW.upi_id IS NOT NULL
         OR NEW.account_number IS NOT NULL
         OR NEW.ifsc IS NOT NULL
         OR NEW.holder_name IS NOT NULL
         OR NEW.pan_number IS NOT NULL
       ))
       OR (TG_OP = 'UPDATE' AND (
         NEW.email IS DISTINCT FROM OLD.email
         OR NEW.upi_id IS DISTINCT FROM OLD.upi_id
         OR NEW.account_number IS DISTINCT FROM OLD.account_number
         OR NEW.ifsc IS DISTINCT FROM OLD.ifsc
         OR NEW.holder_name IS DISTINCT FROM OLD.holder_name
         OR NEW.pan_number IS DISTINCT FROM OLD.pan_number
       ))
     )
  THEN
    RAISE EXCEPTION 'Accept the Creator Monetization Terms before saving payout details';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS creator_payout_terms_guard ON public.creator_payout_profiles;
CREATE TRIGGER creator_payout_terms_guard
  BEFORE INSERT OR UPDATE OF email, upi_id, account_number, ifsc, holder_name, pan_number
  ON public.creator_payout_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_creator_payout_terms();