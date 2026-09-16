-- Owner-only moderation controls. This migration adds only review metadata and
-- admin-owned records; it does not alter existing user verification payloads.

CREATE TABLE IF NOT EXISTS public.admin_action_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  target_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  reason text NOT NULL,
  assurance_level text NOT NULL DEFAULT 'aal2',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_action_audit_created_idx
  ON public.admin_action_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_action_audit_target_idx
  ON public.admin_action_audit (target_user_id, created_at DESC);

ALTER TABLE public.admin_action_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_action_audit FROM anon, authenticated;
GRANT SELECT, INSERT ON public.admin_action_audit TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_admin_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Admin audit records are immutable';
END;
$$;

DROP TRIGGER IF EXISTS admin_action_audit_immutable
  ON public.admin_action_audit;
CREATE TRIGGER admin_action_audit_immutable
  BEFORE UPDATE OR DELETE ON public.admin_action_audit
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_audit_mutation();

CREATE TABLE IF NOT EXISTS public.admin_account_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type text NOT NULL CHECK (restriction_type IN ('suspended', 'blocked')),
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  lifted_at timestamptz,
  lifted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS admin_account_restrictions_user_idx
  ON public.admin_account_restrictions (user_id, created_at DESC);
ALTER TABLE public.admin_account_restrictions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_account_restrictions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_account_restrictions TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS admin_one_active_restriction_per_type
  ON public.admin_account_restrictions (user_id, restriction_type)
  WHERE lifted_at IS NULL;

CREATE OR REPLACE FUNCTION public.is_account_restricted(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_account_restrictions
    WHERE user_id = _user_id
      AND lifted_at IS NULL
      AND starts_at <= now()
      AND (ends_at IS NULL OR ends_at > now())
  );
$$;

CREATE TABLE IF NOT EXISTS public.admin_payout_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released')),
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  released_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS admin_payout_holds_user_idx
  ON public.admin_payout_holds (user_id, created_at DESC);
ALTER TABLE public.admin_payout_holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_payout_holds FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_payout_holds TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS admin_one_active_payout_hold
  ON public.admin_payout_holds (user_id)
  WHERE status = 'held';

ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS resolution_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_status_check;
ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_status_check
  CHECK (status IN ('pending', 'resolved', 'dismissed'));

-- The live project did not have the earlier copyright migration applied.
-- Create the existing report contract without touching user content.
CREATE TABLE IF NOT EXISTS public.copyright_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  reported_moment_id uuid REFERENCES public.moments(id) ON DELETE SET NULL,
  original_work_link text,
  infringing_content_link text,
  reason text,
  contact_email text,
  reporter_full_name text,
  reporter_flagged boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  resolution_reason text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copyright_reports
  ADD COLUMN IF NOT EXISTS reporter_full_name text,
  ADD COLUMN IF NOT EXISTS reporter_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS copyright_reports_status_idx
  ON public.copyright_reports (status, created_at DESC);
ALTER TABLE public.copyright_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.copyright_reports TO authenticated;
GRANT ALL ON public.copyright_reports TO service_role;

DROP POLICY IF EXISTS "Users can insert their own copyright reports"
  ON public.copyright_reports;
CREATE POLICY "Users can insert their own copyright reports"
  ON public.copyright_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

DROP POLICY IF EXISTS "Admins can view copyright reports"
  ON public.copyright_reports;
CREATE POLICY "Admins can view copyright reports"
  ON public.copyright_reports FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND auth.jwt()->>'aal' = 'aal2'
  );

DROP POLICY IF EXISTS "Reporters can view their own copyright reports"
  ON public.copyright_reports;
CREATE POLICY "Reporters can view their own copyright reports"
  ON public.copyright_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_user_id);

DROP POLICY IF EXISTS "Admins can update copyright reports"
  ON public.copyright_reports;
CREATE POLICY "Admins can update copyright reports"
  ON public.copyright_reports FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND auth.jwt()->>'aal' = 'aal2'
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND auth.jwt()->>'aal' = 'aal2'
  );

DROP POLICY IF EXISTS "Admins can delete posts" ON public.posts;
CREATE POLICY "Admins can delete posts"
  ON public.posts FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND auth.jwt()->>'aal' = 'aal2'
  );

DROP POLICY IF EXISTS "Admins can delete moments" ON public.moments;
CREATE POLICY "Admins can delete moments"
  ON public.moments FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND auth.jwt()->>'aal' = 'aal2'
  );

DROP POLICY IF EXISTS "Admins can read sports verification details"
  ON public.sports_verification_details;
CREATE POLICY "Admins can read sports verification details"
  ON public.sports_verification_details FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND auth.jwt()->>'aal' = 'aal2'
  );

DROP POLICY IF EXISTS "Admins can read sports verification documents"
  ON storage.objects;
CREATE POLICY "Admins can read sports verification documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.has_role(auth.uid(), 'admin')
    AND auth.jwt()->>'aal' = 'aal2'
  );