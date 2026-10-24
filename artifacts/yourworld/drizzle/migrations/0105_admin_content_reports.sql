BEGIN;

ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS reported_content_id uuid,
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS description text;

UPDATE public.user_reports AS report
SET
  reported_content_id = COALESCE(report.reported_content_id, report.reported_post_id),
  content_type = COALESCE(
    report.content_type,
    NULLIF(post.media_type, ''),
    NULLIF(post.kind, ''),
    'post'
  )
FROM public.posts AS post
WHERE report.reported_post_id = post.id
  AND (report.reported_content_id IS NULL OR report.content_type IS NULL);

UPDATE public.user_reports
SET reported_content_id = reported_post_id
WHERE reported_content_id IS NULL
  AND reported_post_id IS NOT NULL;

ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_reporter_id_reported_user_id_surface_key;
DROP INDEX IF EXISTS public.user_reports_reporter_id_reported_user_id_surface_key;

CREATE UNIQUE INDEX IF NOT EXISTS user_reports_reporter_content_surface_uidx
  ON public.user_reports (reporter_id, reported_content_id, surface)
  WHERE reported_content_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_reports_reporter_profile_surface_uidx
  ON public.user_reports (reporter_id, reported_user_id, surface)
  WHERE reported_content_id IS NULL;
CREATE INDEX IF NOT EXISTS user_reports_status_created_at_idx
  ON public.user_reports (status, created_at DESC);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_owner ON public.user_reports;
DROP POLICY IF EXISTS reports_owner_read ON public.user_reports;
DROP POLICY IF EXISTS reports_owner_insert ON public.user_reports;
DROP POLICY IF EXISTS reports_admin_read ON public.user_reports;
DROP POLICY IF EXISTS reports_admin_update ON public.user_reports;

CREATE POLICY reports_owner_read
  ON public.user_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY reports_owner_insert
  ON public.user_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY reports_admin_read
  ON public.user_reports
  FOR SELECT TO authenticated
  USING (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin')
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  );

CREATE POLICY reports_admin_update
  ON public.user_reports
  FOR UPDATE TO authenticated
  USING (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin')
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  )
  WITH CHECK (
    (
      lower(COALESCE(auth.jwt() ->> 'email', '')) = 'yourworld2029@gmail.com'
      OR public.has_role(auth.uid(), 'admin')
    )
    AND auth.jwt() ->> 'aal' = 'aal2'
  );

GRANT SELECT, INSERT ON public.user_reports TO authenticated;
REVOKE UPDATE, DELETE ON public.user_reports FROM authenticated;
GRANT UPDATE (status, resolution_reason, reviewed_at, reviewed_by)
  ON public.user_reports TO authenticated;
GRANT ALL ON public.user_reports TO service_role;

COMMIT;
