-- Add review lifecycle metadata without duplicating the existing verification
-- state stored on profiles.
-- The connected live project does not have the older role migration applied,
-- so create only the role boundary required by this admin workflow.
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

ALTER TABLE public.sports_verification_details
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

ALTER TABLE public.sports_verification_details
  DROP CONSTRAINT IF EXISTS sports_verification_details_review_status_check;

ALTER TABLE public.sports_verification_details
  ADD CONSTRAINT sports_verification_details_review_status_check
  CHECK (
    review_status IN (
      'not_submitted',
      'pending',
      'approved',
      'rejected',
      'correction_requested'
    )
  );

UPDATE public.sports_verification_details d
SET
  review_status = CASE
    WHEN p.is_verified = true THEN 'approved'
    WHEN p.verification_requested = true THEN 'pending'
    ELSE 'not_submitted'
  END,
  submitted_at = CASE
    WHEN p.verification_requested = true THEN COALESCE(d.submitted_at, d.updated_at)
    ELSE d.submitted_at
  END
FROM public.profiles p
WHERE p.id = d.user_id;

CREATE TABLE IF NOT EXISTS public.sports_verification_review_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('approve', 'reject', 'request_correction')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sports_verification_review_audit ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.sports_verification_review_audit FROM anon, authenticated;
GRANT ALL ON public.sports_verification_review_audit TO service_role;

DROP POLICY IF EXISTS "Admins can read sports verification details"
  ON public.sports_verification_details;
CREATE POLICY "Admins can read sports verification details"
  ON public.sports_verification_details
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can read sports verification documents" ON storage.objects;
CREATE POLICY "Admins can read sports verification documents"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.has_role(auth.uid(), 'admin')
  );