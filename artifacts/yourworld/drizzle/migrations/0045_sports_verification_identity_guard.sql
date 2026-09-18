-- Store the identity fields used for Sports Verification duplicate prevention.
-- Generated normalized values keep the matching rule in the database so the
-- server-side preflight and the unique indexes use the same representation.
ALTER TABLE public.sports_verification_details
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS father_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS passport_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS certificate_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS identity_details_confirmed boolean NOT NULL DEFAULT false;

ALTER TABLE public.sports_verification_details
  ADD COLUMN IF NOT EXISTS passport_number_normalized text
  GENERATED ALWAYS AS (
    nullif(lower(regexp_replace(btrim(coalesce(passport_number, '')), '\s+', '', 'g')), '')
  ) STORED,
  ADD COLUMN IF NOT EXISTS certificate_number_normalized text
  GENERATED ALWAYS AS (
    nullif(lower(regexp_replace(btrim(coalesce(certificate_number, '')), '\s+', '', 'g')), '')
  ) STORED,
  ADD COLUMN IF NOT EXISTS identity_key text
  GENERATED ALWAYS AS (
    CASE
      WHEN nullif(btrim(coalesce(full_name, '')), '') IS NULL
        OR nullif(btrim(coalesce(father_name, '')), '') IS NULL
        OR date_of_birth IS NULL
      THEN NULL
      ELSE lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g'))
        || '|'
        || lower(regexp_replace(btrim(father_name), '\s+', ' ', 'g'))
        || '|'
        || date_of_birth::text
    END
  ) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS sports_verification_active_passport_unique
  ON public.sports_verification_details (passport_number_normalized)
  WHERE passport_number_normalized IS NOT NULL
    AND review_status IN ('pending', 'approved');

CREATE UNIQUE INDEX IF NOT EXISTS sports_verification_active_certificate_unique
  ON public.sports_verification_details (certificate_number_normalized)
  WHERE certificate_number_normalized IS NOT NULL
    AND review_status IN ('pending', 'approved');

CREATE UNIQUE INDEX IF NOT EXISTS sports_verification_active_identity_unique
  ON public.sports_verification_details (identity_key)
  WHERE identity_key IS NOT NULL
    AND review_status IN ('pending', 'approved');