BEGIN;

-- Report data already has authenticated SELECT grants and admin-only
-- AAL2 policies. Keep those grants explicit for the Admin Console readers.
GRANT SELECT ON TABLE public.user_reports, public.copyright_reports TO authenticated;

-- Payout requests are owner-readable by default; allow only MFA-verified
-- admins to read the full review queue.
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.payout_requests TO authenticated;

DROP POLICY IF EXISTS "Admins read payout requests" ON public.payout_requests;
CREATE POLICY "Admins read payout requests"
  ON public.payout_requests
  FOR SELECT
  TO authenticated
  USING (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  );

-- International payout/KYC rows intentionally have no direct table grants.
-- These existing SECURITY DEFINER RPCs perform the same admin + AAL2 check.
GRANT EXECUTE ON FUNCTION public.admin_list_international_payout_kyc()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_international_payout_profiles(uuid[])
  TO authenticated;

COMMIT;
