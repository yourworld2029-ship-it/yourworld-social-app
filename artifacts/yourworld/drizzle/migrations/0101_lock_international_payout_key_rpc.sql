-- The encryption key must only be callable internally by the security-definer RPCs.
REVOKE ALL ON FUNCTION public.international_payout_encryption_key()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.international_payout_encryption_key() TO postgres;

REVOKE ALL ON FUNCTION public.require_international_payout_admin()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.require_international_payout_admin() TO postgres;

REVOKE ALL ON FUNCTION public.save_international_payout_profile(
  text, text, text, text, text, text, text, text, text, boolean, boolean, boolean
) FROM service_role;
REVOKE ALL ON FUNCTION public.get_my_international_payout_profile() FROM service_role;
REVOKE ALL ON FUNCTION public.admin_list_international_payout_kyc() FROM service_role;
REVOKE ALL ON FUNCTION public.admin_get_international_payout_profiles(uuid[]) FROM service_role;
REVOKE ALL ON FUNCTION public.admin_review_international_payout_profile(uuid, text, text) FROM service_role;
