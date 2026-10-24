BEGIN;

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_reports ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON TABLE public.user_reports, public.copyright_reports TO authenticated;

DROP POLICY IF EXISTS reports_owner_insert ON public.user_reports;
CREATE POLICY reports_owner_insert
  ON public.user_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own copyright reports"
  ON public.copyright_reports;
CREATE POLICY "Users can insert their own copyright reports"
  ON public.copyright_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());

-- The owner email is explicitly allowlisted in the app. Keep its database
-- role assignment present as well; do not infer or promote test accounts.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'yourworld2029@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;
