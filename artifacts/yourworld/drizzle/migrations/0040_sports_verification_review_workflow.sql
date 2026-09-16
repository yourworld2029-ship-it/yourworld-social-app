-- Add review lifecycle metadata without duplicating the existing verification
-- state stored on profiles.
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