-- Private, encrypted KYC and country-specific USD payout details.
-- Indian payout fields remain in creator_payout_profiles and are not changed here.

DO $$
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE EXCEPTION 'Supabase Vault is required to protect international payout identifiers';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'yourworld_international_payout_encryption_key'
  ) THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'yourworld_international_payout_encryption_key',
      'Encryption key for private international payout tax and bank identifiers'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.international_payout_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  country text NOT NULL,
  legal_name text NOT NULL,
  tax_identifier_encrypted bytea NOT NULL,
  tax_identifier_last4 text NOT NULL,
  payout_method text NOT NULL CHECK (payout_method IN ('bank', 'paypal')),
  routing_aba_encrypted bytea,
  account_number_encrypted bytea,
  iban_encrypted bytea,
  swift_bic text,
  bank_name text,
  paypal_email_encrypted bytea,
  paypal_email_hash bytea,
  us_tax_resident_declaration boolean NOT NULL DEFAULT false,
  non_indian_resident_declaration boolean NOT NULL DEFAULT false,
  declaration_accepted_at timestamptz NOT NULL DEFAULT now(),
  review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'verified', 'rejected')),
  review_reason text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT international_payout_profiles_country_check
    CHECK (lower(trim(country)) NOT IN ('india', 'in')),
  CONSTRAINT international_payout_profiles_last4_check
    CHECK (tax_identifier_last4 ~ '^[a-zA-Z0-9]{4}$'),
  CONSTRAINT international_payout_profiles_paypal_hash_check
    CHECK (
      (paypal_email_encrypted IS NULL AND paypal_email_hash IS NULL)
      OR (paypal_email_encrypted IS NOT NULL AND paypal_email_hash IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS international_payout_profiles_paypal_unique
  ON public.international_payout_profiles (paypal_email_hash)
  WHERE paypal_email_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS international_payout_profiles_review_idx
  ON public.international_payout_profiles (review_status, submitted_at);

ALTER TABLE public.international_payout_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.international_payout_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.international_payout_profiles FROM service_role;

CREATE OR REPLACE FUNCTION public.international_payout_encryption_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_key text;
BEGIN
  SELECT decrypted_secret
  INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'yourworld_international_payout_encryption_key'
  LIMIT 1;

  IF NULLIF(v_key, '') IS NULL THEN
    RAISE EXCEPTION 'International payout encryption is not configured';
  END IF;
  RETURN v_key;
END;
$$;
REVOKE ALL ON FUNCTION public.international_payout_encryption_key() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.international_payout_encryption_key() TO postgres;

CREATE OR REPLACE FUNCTION public.save_international_payout_profile(
  p_legal_name text,
  p_tax_identifier text,
  p_payout_method text,
  p_routing_aba text DEFAULT NULL,
  p_account_number text DEFAULT NULL,
  p_iban text DEFAULT NULL,
  p_swift_bic text DEFAULT NULL,
  p_bank_name text DEFAULT NULL,
  p_paypal_email text DEFAULT NULL,
  p_us_tax_resident_declaration boolean DEFAULT false,
  p_non_indian_resident_declaration boolean DEFAULT false,
  p_terms_accepted boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_country text;
  v_email text := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
  v_key text;
  v_is_us boolean;
  v_method text := lower(trim(COALESCE(p_payout_method, '')));
  v_legal_name text := trim(COALESCE(p_legal_name, ''));
  v_tax_identifier text := trim(COALESCE(p_tax_identifier, ''));
  v_paypal_email text := lower(trim(COALESCE(p_paypal_email, '')));
  v_routing_aba text := regexp_replace(COALESCE(p_routing_aba, ''), '[^0-9]', '', 'g');
  v_account_number text := trim(COALESCE(p_account_number, ''));
  v_iban text := upper(regexp_replace(COALESCE(p_iban, ''), '\s', '', 'g'));
  v_swift_bic text := upper(trim(COALESCE(p_swift_bic, '')));
  v_bank_name text := trim(COALESCE(p_bank_name, ''));
  v_hash bytea;
  v_last4 text;
  v_previous public.international_payout_profiles%ROWTYPE;
  v_unchanged boolean := false;
  v_review_status text := 'pending';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;
  IF p_terms_accepted IS NOT TRUE THEN
    RAISE EXCEPTION 'Accept the Creator Monetization Terms before saving payout details';
  END IF;
  IF length(v_legal_name) < 2 OR length(v_legal_name) > 160 THEN
    RAISE EXCEPTION 'Enter your full legal name';
  END IF;
  IF v_method NOT IN ('bank', 'paypal') THEN
    RAISE EXCEPTION 'Choose a payout method';
  END IF;

  SELECT country
  INTO v_country
  FROM public.profiles
  WHERE id = v_user_id;
  v_country := trim(COALESCE(v_country, ''));
  IF v_country = '' OR lower(v_country) IN ('india', 'in') THEN
    RAISE EXCEPTION 'International payout details are available only when your profile country is outside India';
  END IF;
  v_is_us := lower(v_country) IN (
    'united states', 'united states of america', 'usa', 'us', 'u.s.', 'u.s.a.'
  );

  IF v_is_us THEN
    v_tax_identifier := regexp_replace(v_tax_identifier, '[^0-9]', '', 'g');
    IF v_tax_identifier !~ '^[0-9]{9}$' THEN
      RAISE EXCEPTION 'Enter a valid 9-digit SSN or ITIN';
    END IF;
    IF p_us_tax_resident_declaration IS NOT TRUE THEN
      RAISE EXCEPTION 'Confirm the US tax-residency declaration before continuing';
    END IF;
    IF v_method = 'bank'
       AND (v_routing_aba !~ '^[0-9]{9}$'
         OR v_account_number !~ '^[0-9]{4,17}$') THEN
      RAISE EXCEPTION 'Enter a valid 9-digit Routing / ABA number and bank account number';
    END IF;
  ELSE
    IF length(v_tax_identifier) < 4 OR length(v_tax_identifier) > 100 THEN
      RAISE EXCEPTION 'Enter a valid Tax ID, National ID, or Passport number';
    END IF;
    IF p_non_indian_declaration IS NOT TRUE THEN
      RAISE EXCEPTION 'Confirm the non-Indian residency declaration before continuing';
    END IF;
    IF v_method = 'bank'
       AND (
         v_iban !~ '^[A-Z0-9]{15,34}$'
         OR v_swift_bic !~ '^[A-Z0-9]{8}([A-Z0-9]{3})?$'
         OR length(v_bank_name) < 2
         OR length(v_bank_name) > 160
       ) THEN
      RAISE EXCEPTION 'Enter a valid IBAN, SWIFT / BIC code, and bank name';
    END IF;
  END IF;

  IF v_method = 'paypal' AND (
    length(v_paypal_email) > 254
    OR v_paypal_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ) THEN
    RAISE EXCEPTION 'Enter a valid PayPal email address';
  END IF;

  v_key := public.international_payout_encryption_key();
  v_last4 := right(v_tax_identifier, 4);
  IF v_method = 'paypal' THEN
    v_hash := extensions.digest(convert_to(v_paypal_email, 'UTF8'), 'sha256');
  END IF;

  SELECT *
  INTO v_previous
  FROM public.international_payout_profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF FOUND THEN
    v_unchanged :=
      v_previous.country = v_country
      AND v_previous.legal_name = v_legal_name
      AND extensions.pgp_sym_decrypt(v_previous.tax_identifier_encrypted, v_key) = v_tax_identifier
      AND v_previous.payout_method = v_method
      AND COALESCE(extensions.pgp_sym_decrypt(v_previous.routing_aba_encrypted, v_key), '') =
        CASE WHEN v_is_us AND v_method = 'bank' THEN v_routing_aba ELSE '' END
      AND COALESCE(extensions.pgp_sym_decrypt(v_previous.account_number_encrypted, v_key), '') =
        CASE WHEN v_is_us AND v_method = 'bank' THEN v_account_number ELSE '' END
      AND COALESCE(extensions.pgp_sym_decrypt(v_previous.iban_encrypted, v_key), '') =
        CASE WHEN NOT v_is_us AND v_method = 'bank' THEN v_iban ELSE '' END
      AND COALESCE(v_previous.swift_bic, '') =
        CASE WHEN NOT v_is_us AND v_method = 'bank' THEN v_swift_bic ELSE '' END
      AND COALESCE(v_previous.bank_name, '') =
        CASE WHEN NOT v_is_us AND v_method = 'bank' THEN v_bank_name ELSE '' END
      AND COALESCE(extensions.pgp_sym_decrypt(v_previous.paypal_email_encrypted, v_key), '') =
        CASE WHEN v_method = 'paypal' THEN v_paypal_email ELSE '' END
      AND v_previous.us_tax_resident_declaration = (v_is_us AND p_us_tax_resident_declaration)
      AND v_previous.non_indian_resident_declaration =
        (NOT v_is_us AND p_non_indian_resident_declaration);

    IF v_unchanged AND v_previous.review_status <> 'rejected' THEN
      v_review_status := v_previous.review_status;
    END IF;
  END IF;

  INSERT INTO public.international_payout_profiles (
    user_id, country, legal_name, tax_identifier_encrypted, tax_identifier_last4,
    payout_method, routing_aba_encrypted, account_number_encrypted,
    iban_encrypted, swift_bic, bank_name, paypal_email_encrypted, paypal_email_hash,
    us_tax_resident_declaration, non_indian_resident_declaration,
    declaration_accepted_at, review_status, review_reason, reviewed_by, reviewed_at,
    submitted_at, updated_at
  )
  VALUES (
    v_user_id, v_country, v_legal_name,
    extensions.pgp_sym_encrypt(v_tax_identifier, v_key, 'cipher-algo=aes256'),
    v_last4,
    v_method,
    CASE WHEN v_is_us AND v_method = 'bank'
      THEN extensions.pgp_sym_encrypt(v_routing_aba, v_key, 'cipher-algo=aes256') END,
    CASE WHEN v_is_us AND v_method = 'bank'
      THEN extensions.pgp_sym_encrypt(v_account_number, v_key, 'cipher-algo=aes256') END,
    CASE WHEN NOT v_is_us AND v_method = 'bank'
      THEN extensions.pgp_sym_encrypt(v_iban, v_key, 'cipher-algo=aes256') END,
    CASE WHEN NOT v_is_us AND v_method = 'bank' THEN v_swift_bic END,
    CASE WHEN NOT v_is_us AND v_method = 'bank' THEN v_bank_name END,
    CASE WHEN v_method = 'paypal'
      THEN extensions.pgp_sym_encrypt(v_paypal_email, v_key, 'cipher-algo=aes256') END,
    v_hash,
    v_is_us AND p_us_tax_resident_declaration,
    NOT v_is_us AND p_non_indian_declaration,
    now(), v_review_status,
    CASE WHEN v_review_status = 'pending' THEN NULL ELSE v_previous.review_reason END,
    CASE WHEN v_review_status = 'pending' THEN NULL ELSE v_previous.reviewed_by END,
    CASE WHEN v_review_status = 'pending' THEN NULL ELSE v_previous.reviewed_at END,
    CASE WHEN v_review_status = 'pending' THEN now() ELSE v_previous.submitted_at END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    country = EXCLUDED.country,
    legal_name = EXCLUDED.legal_name,
    tax_identifier_encrypted = EXCLUDED.tax_identifier_encrypted,
    tax_identifier_last4 = EXCLUDED.tax_identifier_last4,
    payout_method = EXCLUDED.payout_method,
    routing_aba_encrypted = EXCLUDED.routing_aba_encrypted,
    account_number_encrypted = EXCLUDED.account_number_encrypted,
    iban_encrypted = EXCLUDED.iban_encrypted,
    swift_bic = EXCLUDED.swift_bic,
    bank_name = EXCLUDED.bank_name,
    paypal_email_encrypted = EXCLUDED.paypal_email_encrypted,
    paypal_email_hash = EXCLUDED.paypal_email_hash,
    us_tax_resident_declaration = EXCLUDED.us_tax_resident_declaration,
    non_indian_resident_declaration = EXCLUDED.non_indian_resident_declaration,
    declaration_accepted_at = now(),
    review_status = EXCLUDED.review_status,
    review_reason = EXCLUDED.review_reason,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = EXCLUDED.reviewed_at,
    submitted_at = EXCLUDED.submitted_at,
    updated_at = now();

  INSERT INTO public.creator_payout_profiles (
    user_id, email, payout_currency, bank_country, payout_schedule,
    terms_accepted_at, monetization_eligible
  )
  VALUES (
    v_user_id, v_email, 'USD', v_country, 'monthly_1_5', now(), false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = CASE WHEN v_email <> '' THEN EXCLUDED.email ELSE creator_payout_profiles.email END,
    payout_currency = 'USD',
    bank_country = v_country,
    payout_schedule = 'monthly_1_5',
    terms_accepted_at = now(),
    updated_at = now();

  RETURN jsonb_build_object('reviewStatus', v_review_status, 'country', v_country);
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'This PayPal email is already linked to another account';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_international_payout_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_country text;
  v_row public.international_payout_profiles%ROWTYPE;
  v_key text;
  v_is_us boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;
  SELECT country INTO v_country FROM public.profiles WHERE id = v_user_id;
  v_country := trim(COALESCE(v_country, ''));
  IF v_country = '' OR lower(v_country) IN ('india', 'in') THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_row
  FROM public.international_payout_profiles
  WHERE user_id = v_user_id
    AND lower(trim(country)) = lower(v_country);
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  v_key := public.international_payout_encryption_key();
  v_is_us := lower(v_country) IN (
    'united states', 'united states of america', 'usa', 'us', 'u.s.', 'u.s.a.'
  );
  RETURN jsonb_build_object(
    'country', v_row.country,
    'legalName', v_row.legal_name,
    'taxIdentifier', extensions.pgp_sym_decrypt(v_row.tax_identifier_encrypted, v_key),
    'payoutMethod', v_row.payout_method,
    'routingAba', CASE WHEN v_is_us AND v_row.routing_aba_encrypted IS NOT NULL
      THEN extensions.pgp_sym_decrypt(v_row.routing_aba_encrypted, v_key) END,
    'accountNumber', CASE WHEN v_is_us AND v_row.account_number_encrypted IS NOT NULL
      THEN extensions.pgp_sym_decrypt(v_row.account_number_encrypted, v_key) END,
    'iban', CASE WHEN v_row.iban_encrypted IS NOT NULL
      THEN extensions.pgp_sym_decrypt(v_row.iban_encrypted, v_key) END,
    'swiftBic', v_row.swift_bic,
    'bankName', v_row.bank_name,
    'paypalEmail', CASE WHEN v_row.paypal_email_encrypted IS NOT NULL
      THEN extensions.pgp_sym_decrypt(v_row.paypal_email_encrypted, v_key) END,
    'usTaxResidentDeclaration', v_row.us_tax_resident_declaration,
    'nonIndianResidentDeclaration', v_row.non_indian_resident_declaration,
    'reviewStatus', v_row.review_status,
    'reviewReason', v_row.review_reason,
    'submittedAt', v_row.submitted_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.require_international_payout_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
BEGIN
  IF v_user_id IS NULL OR COALESCE(auth.jwt() ->> 'aal', '') <> 'aal2' THEN
    RAISE EXCEPTION 'Admin MFA is required to review international payout details';
  END IF;
  IF v_email <> 'yourworld2029@gmail.com'
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = v_user_id AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Forbidden: admin access is required';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.require_international_payout_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.require_international_payout_admin() TO postgres;

CREATE OR REPLACE FUNCTION public.admin_list_international_payout_kyc()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_key text;
  v_result jsonb;
BEGIN
  PERFORM public.require_international_payout_admin();
  v_key := public.international_payout_encryption_key();
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'userId', i.user_id,
        'country', i.country,
        'legalName', i.legal_name,
        'taxIdentifier', extensions.pgp_sym_decrypt(i.tax_identifier_encrypted, v_key),
        'payoutMethod', i.payout_method,
        'routingAba', CASE WHEN i.routing_aba_encrypted IS NOT NULL
          THEN extensions.pgp_sym_decrypt(i.routing_aba_encrypted, v_key) END,
        'accountNumber', CASE WHEN i.account_number_encrypted IS NOT NULL
          THEN extensions.pgp_sym_decrypt(i.account_number_encrypted, v_key) END,
        'iban', CASE WHEN i.iban_encrypted IS NOT NULL
          THEN extensions.pgp_sym_decrypt(i.iban_encrypted, v_key) END,
        'swiftBic', i.swift_bic,
        'bankName', i.bank_name,
        'paypalEmail', CASE WHEN i.paypal_email_encrypted IS NOT NULL
          THEN extensions.pgp_sym_decrypt(i.paypal_email_encrypted, v_key) END,
        'usTaxResidentDeclaration', i.us_tax_resident_declaration,
        'nonIndianResidentDeclaration', i.non_indian_resident_declaration,
        'submittedAt', i.submitted_at
      )
      ORDER BY i.submitted_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.international_payout_profiles i
  WHERE i.review_status = 'pending';
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_international_payout_profiles(p_user_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_key text;
  v_result jsonb;
BEGIN
  PERFORM public.require_international_payout_admin();
  v_key := public.international_payout_encryption_key();
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'userId', i.user_id,
        'country', i.country,
        'legalName', i.legal_name,
        'taxIdentifier', extensions.pgp_sym_decrypt(i.tax_identifier_encrypted, v_key),
        'payoutMethod', i.payout_method,
        'routingAba', CASE WHEN i.routing_aba_encrypted IS NOT NULL
          THEN extensions.pgp_sym_decrypt(i.routing_aba_encrypted, v_key) END,
        'accountNumber', CASE WHEN i.account_number_encrypted IS NOT NULL
          THEN extensions.pgp_sym_decrypt(i.account_number_encrypted, v_key) END,
        'iban', CASE WHEN i.iban_encrypted IS NOT NULL
          THEN extensions.pgp_sym_decrypt(i.iban_encrypted, v_key) END,
        'swiftBic', i.swift_bic,
        'bankName', i.bank_name,
        'paypalEmail', CASE WHEN i.paypal_email_encrypted IS NOT NULL
          THEN extensions.pgp_sym_decrypt(i.paypal_email_encrypted, v_key) END
      )
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.international_payout_profiles i
  WHERE i.user_id = ANY(COALESCE(p_user_ids, ARRAY[]::uuid[]))
    AND i.review_status = 'verified';
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_international_payout_profile(
  p_user_id uuid,
  p_action text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_status text;
BEGIN
  PERFORM public.require_international_payout_admin();
  IF p_action NOT IN ('verified', 'rejected')
     OR length(trim(COALESCE(p_reason, ''))) < 3
     OR length(trim(p_reason)) > 2000 THEN
    RAISE EXCEPTION 'Choose approve or reject and enter an audit reason';
  END IF;

  UPDATE public.international_payout_profiles
  SET review_status = p_action,
      review_reason = CASE WHEN p_action = 'rejected' THEN trim(p_reason) ELSE NULL END,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id
    AND review_status = 'pending'
  RETURNING review_status INTO v_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This international payout review is no longer pending';
  END IF;
  RETURN jsonb_build_object('userId', p_user_id, 'reviewStatus', v_status);
END;
$$;

REVOKE ALL ON FUNCTION public.save_international_payout_profile(
  text, text, text, text, text, text, text, text, text, boolean, boolean, boolean
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_international_payout_profile() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_international_payout_kyc() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_international_payout_profiles(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_review_international_payout_profile(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.international_payout_encryption_key() FROM service_role;
REVOKE ALL ON FUNCTION public.require_international_payout_admin() FROM service_role;
REVOKE ALL ON FUNCTION public.save_international_payout_profile(
  text, text, text, text, text, text, text, text, text, boolean, boolean, boolean
) FROM service_role;
REVOKE ALL ON FUNCTION public.get_my_international_payout_profile() FROM service_role;
REVOKE ALL ON FUNCTION public.admin_list_international_payout_kyc() FROM service_role;
REVOKE ALL ON FUNCTION public.admin_get_international_payout_profiles(uuid[]) FROM service_role;
REVOKE ALL ON FUNCTION public.admin_review_international_payout_profile(uuid, text, text) FROM service_role;

GRANT EXECUTE ON FUNCTION public.save_international_payout_profile(
  text, text, text, text, text, text, text, text, text, boolean, boolean, boolean
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_international_payout_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_international_payout_kyc() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_international_payout_profiles(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_international_payout_profile(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_payout_request()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.creator_payout_profiles%ROWTYPE;
  v_intl_profile public.international_payout_profiles%ROWTYPE;
  v_earning record;
  v_request public.payout_requests%ROWTYPE;
  v_country text;
  v_currency text;
  v_creator_balance numeric(14,2) := 0;
  v_tds numeric(14,2) := 0;
  v_threshold numeric(14,2);
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_window_start date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  SELECT country INTO v_country FROM public.profiles WHERE id = v_user_id;
  v_currency := CASE
    WHEN lower(trim(COALESCE(v_country, ''))) IN ('india', 'in')
      OR NULLIF(trim(COALESCE(v_country, '')), '') IS NULL THEN 'INR'
    ELSE 'USD'
  END;
  v_threshold := CASE WHEN v_currency = 'INR' THEN 5000 ELSE 70 END;

  SELECT * INTO v_profile
  FROM public.creator_payout_profiles
  WHERE user_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Save your payout details before requesting a payout';
  END IF;
  IF v_profile.payout_currency IS DISTINCT FROM v_currency THEN
    RAISE EXCEPTION 'Payout currency does not match the country saved on your profile';
  END IF;
  IF v_profile.terms_accepted_at IS NULL THEN
    RAISE EXCEPTION 'Accept the Creator Monetization Terms before requesting a payout';
  END IF;

  IF v_currency = 'INR' THEN
    IF v_profile.kyc_status <> 'verified' THEN
      RAISE EXCEPTION 'KYC verification is required before requesting a payout';
    END IF;
    IF NULLIF(trim(COALESCE(v_profile.account_number, '')), '') IS NULL
       AND NULLIF(trim(COALESCE(v_profile.upi_id, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Add a bank account or UPI ID before requesting an INR payout';
    END IF;
  ELSE
    SELECT * INTO v_intl_profile
    FROM public.international_payout_profiles
    WHERE user_id = v_user_id
    FOR UPDATE;
    IF NOT FOUND
       OR v_intl_profile.review_status <> 'verified'
       OR lower(trim(v_intl_profile.country)) <> lower(trim(COALESCE(v_country, ''))) THEN
      RAISE EXCEPTION 'International payout details must be approved by an admin for your current profile country';
    END IF;
    IF v_intl_profile.payout_method = 'paypal'
       AND v_intl_profile.paypal_email_hash IS NULL THEN
      RAISE EXCEPTION 'Add a PayPal email before requesting a USD payout';
    ELSIF v_intl_profile.payout_method = 'bank'
       AND (
         (v_intl_profile.routing_aba_encrypted IS NULL AND v_intl_profile.iban_encrypted IS NULL)
         OR v_intl_profile.account_number_encrypted IS NULL
           AND v_intl_profile.routing_aba_encrypted IS NOT NULL
         OR v_intl_profile.swift_bic IS NULL
           AND v_intl_profile.iban_encrypted IS NOT NULL
         OR v_intl_profile.bank_name IS NULL
           AND v_intl_profile.iban_encrypted IS NOT NULL
       ) THEN
      RAISE EXCEPTION 'Complete the international bank details before requesting a USD payout';
    END IF;
  END IF;

  FOR v_earning IN
    SELECT source, gross_amount, creator_amount
    FROM public.creator_earnings
    WHERE user_id = v_user_id
      AND currency = v_currency
      AND payout_id IS NULL
      AND payout_request_id IS NULL
    FOR UPDATE
  LOOP
    v_creator_balance := v_creator_balance + COALESCE(
      v_earning.creator_amount,
      public.creator_share_for_source(v_earning.source, v_earning.gross_amount)
    );
  END LOOP;

  v_creator_balance := round(v_creator_balance, 2);
  v_tds := round(v_creator_balance * 0.01, 2);
  IF v_creator_balance < v_threshold THEN
    IF v_currency = 'INR' THEN
      RAISE EXCEPTION 'Minimum available balance to request an INR payout is ₹5,000';
    ELSE
      RAISE EXCEPTION 'Minimum available balance to request a USD payout is $70';
    END IF;
  END IF;

  v_window_start := date_trunc('month', v_today)::date;
  IF extract(day FROM v_today) > 5 THEN
    v_window_start := (v_window_start + interval '1 month')::date;
  END IF;

  INSERT INTO public.payout_requests (
    user_id, amount, net_amount, tds_deducted, status, schedule_type, currency, payout_window_start
  )
  VALUES (
    v_user_id, v_creator_balance, round(v_creator_balance - v_tds, 2), v_tds,
    'processing', 'monthly_1_5', v_currency, v_window_start
  )
  RETURNING * INTO v_request;

  UPDATE public.creator_earnings
  SET payout_request_id = v_request.id
  WHERE user_id = v_user_id
    AND currency = v_currency
    AND payout_id IS NULL
    AND payout_request_id IS NULL;

  RETURN to_jsonb(v_request);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payout_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_payout_request() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_payout_request() TO service_role;
