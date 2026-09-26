CREATE TABLE IF NOT EXISTS public.national_award_verifications (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  father_name text NOT NULL,
  date_of_birth date NOT NULL,
  phone_number text NOT NULL,
  email text NOT NULL,
  village_town text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'India' CHECK (country = 'India'),
  identity_details_confirmed boolean NOT NULL DEFAULT false
    CHECK (identity_details_confirmed),
  award_code text NOT NULL CHECK (award_code IN (
    'bharat_ratna',
    'padma_award',
    'param_vir_ashoka_chakra',
    'shaurya_kirti_chakra',
    'sena_medal_gallantry',
    'presidents_police_medal_gallantry'
  )),
  award_year integer NOT NULL CHECK (award_year BETWEEN 1947 AND 2026),
  certificate_path text NOT NULL,
  certificate_file_name text NOT NULL,
  certificate_mime_type text NOT NULL,
  certificate_size bigint NOT NULL CHECK (certificate_size > 0),
  introduction_path text NOT NULL,
  introduction_file_name text NOT NULL,
  introduction_mime_type text NOT NULL,
  introduction_size bigint NOT NULL CHECK (introduction_size > 0),
  review_status text NOT NULL DEFAULT 'pending_verification'
    CHECK (review_status IN ('pending_verification', 'approved', 'rejected')),
  review_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT national_award_certificate_owner_path CHECK (
    certificate_path LIKE user_id::text || '/certificate/%'
  ),
  CONSTRAINT national_award_introduction_owner_path CHECK (
    introduction_path LIKE user_id::text || '/introduction/%'
  ),
  CONSTRAINT national_award_review_reason_length CHECK (
    review_reason IS NULL OR char_length(review_reason) <= 1000
  ),
  CONSTRAINT national_award_certificate_file_name_length CHECK (
    char_length(btrim(certificate_file_name)) BETWEEN 1 AND 255
  ),
  CONSTRAINT national_award_introduction_file_name_length CHECK (
    char_length(btrim(introduction_file_name)) BETWEEN 1 AND 255
  )
);

CREATE INDEX IF NOT EXISTS national_award_pending_submitted_idx
  ON public.national_award_verifications (submitted_at ASC)
  WHERE review_status = 'pending_verification';

ALTER TABLE public.national_award_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.national_award_verifications FROM anon, authenticated;
GRANT SELECT ON public.national_award_verifications TO authenticated;
GRANT ALL ON public.national_award_verifications TO service_role;

DROP POLICY IF EXISTS national_award_verifications_owner_read
  ON public.national_award_verifications;
CREATE POLICY national_award_verifications_owner_read
  ON public.national_award_verifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.national_award_public_badges (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  award_code text NOT NULL CHECK (award_code IN (
    'bharat_ratna',
    'padma_award',
    'param_vir_ashoka_chakra',
    'shaurya_kirti_chakra',
    'sena_medal_gallantry',
    'presidents_police_medal_gallantry'
  )),
  award_year integer NOT NULL CHECK (award_year BETWEEN 1947 AND 2026),
  verified_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.national_award_public_badges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.national_award_public_badges FROM anon, authenticated;
GRANT SELECT ON public.national_award_public_badges TO anon, authenticated;
GRANT ALL ON public.national_award_public_badges TO service_role;

DROP POLICY IF EXISTS national_award_public_badges_public_read
  ON public.national_award_public_badges;
CREATE POLICY national_award_public_badges_public_read
  ON public.national_award_public_badges
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS public.national_award_verification_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected')),
  reason text CHECK (reason IS NULL OR char_length(reason) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS national_award_audit_created_idx
  ON public.national_award_verification_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS national_award_audit_applicant_idx
  ON public.national_award_verification_audit (applicant_user_id, created_at DESC);

ALTER TABLE public.national_award_verification_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.national_award_verification_audit FROM anon, authenticated;
GRANT SELECT, INSERT ON public.national_award_verification_audit TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_national_award_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'National Award review audit records are immutable';
END;
$$;

DROP TRIGGER IF EXISTS national_award_audit_immutable
  ON public.national_award_verification_audit;
CREATE TRIGGER national_award_audit_immutable
  BEFORE UPDATE OR DELETE ON public.national_award_verification_audit
  FOR EACH ROW EXECUTE FUNCTION public.prevent_national_award_audit_mutation();

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'national-award-evidence',
  'national-award-evidence',
  false,
  104857600,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS national_award_evidence_owner_read ON storage.objects;
CREATE POLICY national_award_evidence_owner_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction')
  );

DROP POLICY IF EXISTS national_award_evidence_owner_upload ON storage.objects;
CREATE POLICY national_award_evidence_owner_upload
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction')
    AND NOT EXISTS (
      SELECT 1
      FROM public.national_award_verifications AS verification
      WHERE verification.user_id = auth.uid()
        AND verification.review_status IN ('pending_verification', 'approved')
    )
  );

DROP POLICY IF EXISTS national_award_evidence_owner_delete ON storage.objects;
CREATE POLICY national_award_evidence_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction')
    AND NOT EXISTS (
      SELECT 1
      FROM public.national_award_verifications AS verification
      WHERE verification.user_id = auth.uid()
        AND verification.review_status IN ('pending_verification', 'approved')
    )
  );

DROP POLICY IF EXISTS national_award_evidence_owner_update ON storage.objects;
CREATE POLICY national_award_evidence_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction')
    AND NOT EXISTS (
      SELECT 1
      FROM public.national_award_verifications AS verification
      WHERE verification.user_id = auth.uid()
        AND verification.review_status IN ('pending_verification', 'approved')
    )
  )
  WITH CHECK (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction')
    AND NOT EXISTS (
      SELECT 1
      FROM public.national_award_verifications AS verification
      WHERE verification.user_id = auth.uid()
        AND verification.review_status IN ('pending_verification', 'approved')
    )
  );

CREATE OR REPLACE FUNCTION public.submit_national_award_verification(
  p_user_id uuid,
  p_full_name text,
  p_father_name text,
  p_date_of_birth date,
  p_phone_number text,
  p_email text,
  p_village_town text,
  p_district text,
  p_state text,
  p_award_code text,
  p_award_year integer,
  p_certificate_path text,
  p_certificate_file_name text,
  p_certificate_mime_type text,
  p_certificate_size bigint,
  p_introduction_path text,
  p_introduction_file_name text,
  p_introduction_mime_type text,
  p_introduction_size bigint
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  changed_rows integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.national_award_verifications (
    user_id,
    full_name,
    father_name,
    date_of_birth,
    phone_number,
    email,
    village_town,
    district,
    state,
    country,
    identity_details_confirmed,
    award_code,
    award_year,
    certificate_path,
    certificate_file_name,
    certificate_mime_type,
    certificate_size,
    introduction_path,
    introduction_file_name,
    introduction_mime_type,
    introduction_size,
    review_status,
    review_reason,
    submitted_at,
    reviewed_at,
    reviewed_by,
    updated_at
  )
  VALUES (
    p_user_id,
    btrim(p_full_name),
    btrim(p_father_name),
    p_date_of_birth,
    btrim(p_phone_number),
    lower(btrim(p_email)),
    btrim(p_village_town),
    btrim(p_district),
    btrim(p_state),
    'India',
    true,
    p_award_code,
    p_award_year,
    p_certificate_path,
    btrim(p_certificate_file_name),
    p_certificate_mime_type,
    p_certificate_size,
    p_introduction_path,
    btrim(p_introduction_file_name),
    p_introduction_mime_type,
    p_introduction_size,
    'pending_verification',
    NULL,
    now(),
    NULL,
    NULL,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    father_name = EXCLUDED.father_name,
    date_of_birth = EXCLUDED.date_of_birth,
    phone_number = EXCLUDED.phone_number,
    email = EXCLUDED.email,
    village_town = EXCLUDED.village_town,
    district = EXCLUDED.district,
    state = EXCLUDED.state,
    identity_details_confirmed = true,
    award_code = EXCLUDED.award_code,
    award_year = EXCLUDED.award_year,
    certificate_path = EXCLUDED.certificate_path,
    certificate_file_name = EXCLUDED.certificate_file_name,
    certificate_mime_type = EXCLUDED.certificate_mime_type,
    certificate_size = EXCLUDED.certificate_size,
    introduction_path = EXCLUDED.introduction_path,
    introduction_file_name = EXCLUDED.introduction_file_name,
    introduction_mime_type = EXCLUDED.introduction_mime_type,
    introduction_size = EXCLUDED.introduction_size,
    review_status = 'pending_verification',
    review_reason = NULL,
    submitted_at = now(),
    reviewed_at = NULL,
    reviewed_by = NULL,
    updated_at = now()
  WHERE public.national_award_verifications.review_status = 'rejected';

  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows = 0 THEN
    RAISE EXCEPTION 'This National Award Verification request is already submitted or unavailable';
  END IF;

  INSERT INTO public.national_award_verification_audit (
    applicant_user_id,
    action
  )
  VALUES (p_user_id, 'submitted');

  RETURN 'pending_verification';
END;
$$;

CREATE OR REPLACE FUNCTION public.review_national_award_verification(
  p_user_id uuid,
  p_admin_user_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  next_status text;
  normalized_reason text := nullif(btrim(p_reason), '');
  target_award_code text;
  target_award_year integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid review action';
  END IF;
  IF p_action = 'reject' AND normalized_reason IS NULL THEN
    RAISE EXCEPTION 'A reason is required for rejection';
  END IF;
  IF normalized_reason IS NOT NULL AND char_length(normalized_reason) > 1000 THEN
    RAISE EXCEPTION 'Review reason is too long';
  END IF;

  SELECT award_code, award_year
  INTO target_award_code, target_award_year
  FROM public.national_award_verifications
  WHERE user_id = p_user_id
    AND review_status = 'pending_verification'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This National Award Verification request is no longer pending';
  END IF;

  next_status := CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END;

  UPDATE public.national_award_verifications
  SET review_status = next_status,
      review_reason = normalized_reason,
      reviewed_at = now(),
      reviewed_by = p_admin_user_id,
      updated_at = now()
  WHERE user_id = p_user_id
    AND review_status = 'pending_verification';

  IF next_status = 'approved' THEN
    INSERT INTO public.national_award_public_badges (
      user_id,
      award_code,
      award_year,
      verified_at
    )
    VALUES (p_user_id, target_award_code, target_award_year, now())
    ON CONFLICT (user_id) DO UPDATE SET
      award_code = EXCLUDED.award_code,
      award_year = EXCLUDED.award_year,
      verified_at = EXCLUDED.verified_at;
  ELSE
    DELETE FROM public.national_award_public_badges
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.national_award_verification_audit (
    applicant_user_id,
    admin_user_id,
    action,
    reason
  )
  VALUES (p_user_id, p_admin_user_id, next_status, normalized_reason);

  RETURN next_status;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_national_award_verification(
  uuid, text, text, date, text, text, text, text, text, text, integer,
  text, text, text, bigint, text, text, text, bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_national_award_verification(
  uuid, text, text, date, text, text, text, text, text, text, integer,
  text, text, text, bigint, text, text, text, bigint
) TO service_role;

REVOKE ALL ON FUNCTION public.review_national_award_verification(
  uuid, uuid, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_national_award_verification(
  uuid, uuid, text, text
) TO service_role;