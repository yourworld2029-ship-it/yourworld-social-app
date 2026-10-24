BEGIN;

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_admin_read ON public.user_reports;
CREATE POLICY reports_admin_read
  ON public.user_reports
  FOR SELECT TO authenticated
  USING (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  );

DROP POLICY IF EXISTS reports_admin_update ON public.user_reports;
CREATE POLICY reports_admin_update
  ON public.user_reports
  FOR UPDATE TO authenticated
  USING (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
  WITH CHECK (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  );

DROP POLICY IF EXISTS "Admins can view copyright reports" ON public.copyright_reports;
CREATE POLICY "Admins can view copyright reports"
  ON public.copyright_reports
  FOR SELECT TO authenticated
  USING (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  );

DROP POLICY IF EXISTS "Admins can update copyright reports" ON public.copyright_reports;
CREATE POLICY "Admins can update copyright reports"
  ON public.copyright_reports
  FOR UPDATE TO authenticated
  USING (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
  WITH CHECK (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  );

GRANT SELECT ON public.user_reports, public.copyright_reports TO authenticated;

COMMIT;
