ALTER TABLE public.national_award_verifications
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;

ALTER TABLE public.national_award_verifications
  ALTER COLUMN submitted_at DROP NOT NULL;

ALTER TABLE public.national_award_verifications
  DROP CONSTRAINT IF EXISTS national_award_verifications_review_status_check;

ALTER TABLE public.national_award_verifications
  ADD CONSTRAINT national_award_review_status_check
  CHECK (review_status IN (
    'draft',
    'pending',
    'pending_verification',
    'approved',
    'rejected'
  ));

ALTER TABLE public.national_award_verifications
  ADD CONSTRAINT national_award_terms_acceptance_consistent CHECK (
    (terms_accepted_at IS NULL AND terms_version IS NULL)
    OR (terms_accepted_at IS NOT NULL AND terms_version IS NOT NULL)
  );

ALTER TABLE public.national_award_verifications
  ADD CONSTRAINT national_award_terms_version_length CHECK (
    terms_version IS NULL OR char_length(terms_version) BETWEEN 1 AND 64
  );

DROP INDEX IF EXISTS public.national_award_pending_submitted_idx;
CREATE INDEX national_award_pending_submitted_idx
  ON public.national_award_verifications (submitted_at ASC)
  WHERE review_status IN ('pending', 'pending_verification');

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
        AND verification.review_status IN ('pending', 'pending_verification', 'approved')
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
        AND verification.review_status IN ('pending', 'pending_verification', 'approved')
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
        AND verification.review_status IN ('pending', 'pending_verification', 'approved')
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
        AND verification.review_status IN ('pending', 'pending_verification', 'approved')
    )
  );

CREATE OR REPLACE FUNCTION public.save_national_award_verification_draft(
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
    terms_accepted_at,
    terms_version,
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
    'draft',
    NULL,
    NULL,
    NULL,
    NULL,
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
    review_status = 'draft',
    review_reason = CASE
      WHEN public.national_award_verifications.review_status = 'rejected'
      THEN public.national_award_verifications.review_reason
      ELSE NULL
    END,
    submitted_at = NULL,
    reviewed_at = NULL,
    reviewed_by = NULL,
    terms_accepted_at = NULL,
    terms_version = NULL,
    updated_at = now()
  WHERE public.national_award_verifications.review_status IN ('draft', 'rejected');

  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows = 0 THEN
    RAISE EXCEPTION 'This National Award Verification request is already submitted or unavailable';
  END IF;

  RETURN 'draft';
END;
$$;

DROP FUNCTION IF EXISTS public.submit_national_award_verification(
  uuid, text, text, date, text, text, text, text, text, text, integer,
  text, text, text, bigint, text, text, text, bigint
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
  p_introduction_size bigint,
  p_terms_accepted boolean,
  p_terms_version text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  changed_rows integer;
  normalized_terms_version text := nullif(btrim(p_terms_version), '');
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_terms_accepted IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Terms and Conditions acceptance is required';
  END IF;
  IF normalized_terms_version IS NULL OR char_length(normalized_terms_version) > 64 THEN
    RAISE EXCEPTION 'Invalid Terms and Conditions version';
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
    terms_accepted_at,
    terms_version,
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
    'pending',
    NULL,
    now(),
    NULL,
    NULL,
    now(),
    normalized_terms_version,
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
    review_status = 'pending',
    review_reason = NULL,
    submitted_at = now(),
    reviewed_at = NULL,
    reviewed_by = NULL,
    terms_accepted_at = now(),
    terms_version = normalized_terms_version,
    updated_at = now()
  WHERE public.national_award_verifications.review_status IN ('draft', 'rejected');

  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows = 0 THEN
    RAISE EXCEPTION 'This National Award Verification request is already submitted or unavailable';
  END IF;

  INSERT INTO public.national_award_verification_audit (
    applicant_user_id,
    action
  )
  VALUES (p_user_id, 'submitted');

  RETURN 'pending';
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
    AND review_status IN ('pending', 'pending_verification')
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
    AND review_status IN ('pending', 'pending_verification');

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

REVOKE ALL ON FUNCTION public.save_national_award_verification_draft(
  uuid, text, text, date, text, text, text, text, text, text, integer,
  text, text, text, bigint, text, text, text, bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_national_award_verification_draft(
  uuid, text, text, date, text, text, text, text, text, text, integer,
  text, text, text, bigint, text, text, text, bigint
) TO service_role;

REVOKE ALL ON FUNCTION public.submit_national_award_verification(
  uuid, text, text, date, text, text, text, text, text, text, integer,
  text, text, text, bigint, text, text, text, bigint, boolean, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_national_award_verification(
  uuid, text, text, date, text, text, text, text, text, text, integer,
  text, text, text, bigint, text, text, text, bigint, boolean, text
) TO service_role;

REVOKE ALL ON FUNCTION public.review_national_award_verification(
  uuid, uuid, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_national_award_verification(
  uuid, uuid, text, text
) TO service_role;

NOTIFY pgrst, 'reload schema';