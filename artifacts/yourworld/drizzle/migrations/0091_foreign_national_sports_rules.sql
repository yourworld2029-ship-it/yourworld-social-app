ALTER TABLE public.sports_verification_details
  ALTER COLUMN country SET DEFAULT '',
  ADD COLUMN IF NOT EXISTS indian_identity_proof_path text,
  ADD COLUMN IF NOT EXISTS indian_identity_proof_type text;

ALTER TABLE public.sports_verification_details
  DROP CONSTRAINT IF EXISTS sports_verification_identity_proof_type_check,
  ADD CONSTRAINT sports_verification_identity_proof_type_check
    CHECK (
      indian_identity_proof_type IS NULL
      OR indian_identity_proof_type IN ('aadhaar', 'indian_passport', 'voter_id')
    ),
  DROP CONSTRAINT IF EXISTS sports_verification_identity_proof_owner_path_check,
  ADD CONSTRAINT sports_verification_identity_proof_owner_path_check
    CHECK (
      indian_identity_proof_path IS NULL
      OR indian_identity_proof_path LIKE user_id::text || '/sports-verification/indianIdentityProof/%'
    );

ALTER TABLE public.national_award_verifications
  ADD COLUMN IF NOT EXISTS indian_identity_proof_path text,
  ADD COLUMN IF NOT EXISTS indian_identity_proof_type text,
  ADD COLUMN IF NOT EXISTS indian_identity_proof_file_name text,
  ADD COLUMN IF NOT EXISTS indian_identity_proof_mime_type text,
  ADD COLUMN IF NOT EXISTS indian_identity_proof_size bigint;

ALTER TABLE public.national_award_verifications
  DROP CONSTRAINT IF EXISTS national_award_identity_proof_type_check,
  ADD CONSTRAINT national_award_identity_proof_type_check
    CHECK (
      indian_identity_proof_type IS NULL
      OR indian_identity_proof_type IN ('aadhaar', 'indian_passport', 'voter_id')
    ),
  DROP CONSTRAINT IF EXISTS national_award_identity_proof_owner_path_check,
  ADD CONSTRAINT national_award_identity_proof_owner_path_check
    CHECK (
      indian_identity_proof_path IS NULL
      OR indian_identity_proof_path LIKE user_id::text || '/identity/evidence'
    ),
  DROP CONSTRAINT IF EXISTS national_award_identity_proof_metadata_check,
  ADD CONSTRAINT national_award_identity_proof_metadata_check
    CHECK (
      (
        indian_identity_proof_path IS NULL
        AND indian_identity_proof_type IS NULL
        AND indian_identity_proof_file_name IS NULL
        AND indian_identity_proof_mime_type IS NULL
        AND indian_identity_proof_size IS NULL
      )
      OR (
        indian_identity_proof_path IS NOT NULL
        AND indian_identity_proof_type IS NOT NULL
        AND indian_identity_proof_file_name IS NOT NULL
        AND indian_identity_proof_mime_type IS NOT NULL
        AND indian_identity_proof_size IS NOT NULL
        AND indian_identity_proof_size > 0
      )
    );

DROP POLICY IF EXISTS national_award_evidence_owner_read ON storage.objects;
CREATE POLICY national_award_evidence_owner_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction', 'identity')
  );

DROP POLICY IF EXISTS national_award_evidence_owner_upload ON storage.objects;
CREATE POLICY national_award_evidence_owner_upload
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction', 'identity')
    AND NOT EXISTS (
      SELECT 1
      FROM public.national_award_verifications AS verification
      WHERE verification.user_id = auth.uid()
        AND verification.review_status IN ('pending_verification', 'pending', 'approved')
    )
  );

DROP POLICY IF EXISTS national_award_evidence_owner_delete ON storage.objects;
CREATE POLICY national_award_evidence_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction', 'identity')
    AND NOT EXISTS (
      SELECT 1
      FROM public.national_award_verifications AS verification
      WHERE verification.user_id = auth.uid()
        AND verification.review_status IN ('pending_verification', 'pending', 'approved')
    )
  );

DROP POLICY IF EXISTS national_award_evidence_owner_update ON storage.objects;
CREATE POLICY national_award_evidence_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction', 'identity')
    AND NOT EXISTS (
      SELECT 1
      FROM public.national_award_verifications AS verification
      WHERE verification.user_id = auth.uid()
        AND verification.review_status IN ('pending_verification', 'pending', 'approved')
    )
  )
  WITH CHECK (
    bucket_id = 'national-award-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IN ('certificate', 'introduction', 'identity')
    AND NOT EXISTS (
      SELECT 1
      FROM public.national_award_verifications AS verification
      WHERE verification.user_id = auth.uid()
        AND verification.review_status IN ('pending_verification', 'pending', 'approved')
    )
  );
