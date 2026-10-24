-- Add the US-specific payout KYC fields without changing India or other
-- international payout schemas. Personal identifiers remain encrypted.
ALTER TABLE public.international_payout_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth_encrypted bytea,
  ADD COLUMN IF NOT EXISTS mobile_number_encrypted bytea,
  ADD COLUMN IF NOT EXISTS government_id_path text,
  ADD COLUMN IF NOT EXISTS bank_statement_path text;

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
    'dateOfBirth', CASE WHEN v_row.date_of_birth_encrypted IS NOT NULL
      THEN extensions.pgp_sym_decrypt(v_row.date_of_birth_encrypted, v_key) END,
    'mobileNumber', CASE WHEN v_row.mobile_number_encrypted IS NOT NULL
      THEN extensions.pgp_sym_decrypt(v_row.mobile_number_encrypted, v_key) END,
    'payoutMethod', v_row.payout_method,
    'routingAba', CASE WHEN v_is_us AND v_row.routing_aba_encrypted IS NOT NULL
      THEN extensions.pgp_sym_decrypt(v_row.routing_aba_encrypted, v_key) END,
    'accountNumber', CASE WHEN v_is_us AND v_row.account_number_encrypted IS NOT NULL
      THEN extensions.pgp_sym_decrypt(v_row.account_number_encrypted, v_key) END,
    'governmentIdPath', CASE WHEN v_is_us THEN v_row.government_id_path END,
    'bankStatementPath', CASE WHEN v_is_us THEN v_row.bank_statement_path END,
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

REVOKE ALL ON FUNCTION public.get_my_international_payout_profile()
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_international_payout_profile()
  TO authenticated;

CREATE OR REPLACE FUNCTION public.save_international_payout_profile_us_kyc(
  p_legal_name text,
  p_tax_identifier text,
  p_payout_method text,
  p_routing_aba text,
  p_account_number text,
  p_iban text,
  p_swift_bic text,
  p_bank_name text,
  p_paypal_email text,
  p_us_tax_resident_declaration boolean,
  p_non_indian_resident_declaration boolean,
  p_terms_accepted boolean,
  p_us_date_of_birth text,
  p_us_mobile_number text,
  p_us_confirm_account_number text,
  p_us_government_id_path text,
  p_us_bank_statement_path text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_country text;
  v_is_us boolean;
  v_date_of_birth date;
  v_mobile_digits text;
  v_account_digits text;
  v_confirm_account_digits text;
  v_government_id_path text := trim(COALESCE(p_us_government_id_path, ''));
  v_bank_statement_path text := trim(COALESCE(p_us_bank_statement_path, ''));
  v_key text;
  v_previous public.international_payout_profiles%ROWTYPE;
  v_supplemental_changed boolean := false;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT country INTO v_country FROM public.profiles WHERE id = v_user_id;
  v_country := trim(COALESCE(v_country, ''));
  v_is_us := lower(v_country) IN (
    'united states', 'united states of america', 'usa', 'us', 'u.s.', 'u.s.a.'
  );

  IF NOT v_is_us THEN
    RETURN public.save_international_payout_profile(
      p_legal_name,
      p_tax_identifier,
      p_payout_method,
      p_routing_aba,
      p_account_number,
      p_iban,
      p_swift_bic,
      p_bank_name,
      p_paypal_email,
      p_us_tax_resident_declaration,
      p_non_indian_resident_declaration,
      p_terms_accepted
    );
  END IF;

  IF lower(trim(COALESCE(p_payout_method, ''))) <> 'bank' THEN
    RAISE EXCEPTION 'US payout details require Direct Bank Transfer';
  END IF;
  IF p_us_date_of_birth IS NULL OR trim(p_us_date_of_birth) = '' THEN
    RAISE EXCEPTION 'Enter your date of birth';
  END IF;
  BEGIN
    v_date_of_birth := trim(p_us_date_of_birth)::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Enter a valid date of birth';
  END;
  IF v_date_of_birth > current_date THEN
    RAISE EXCEPTION 'Date of birth cannot be in the future';
  END IF;

  v_mobile_digits := regexp_replace(COALESCE(p_us_mobile_number, ''), '[^0-9]', '', 'g');
  IF length(v_mobile_digits) = 11 AND left(v_mobile_digits, 1) = '1' THEN
    v_mobile_digits := right(v_mobile_digits, 10);
  END IF;
  IF v_mobile_digits !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Enter a valid 10-digit US mobile number';
  END IF;

  v_account_digits := regexp_replace(COALESCE(p_account_number, ''), '[^0-9]', '', 'g');
  v_confirm_account_digits := regexp_replace(
    COALESCE(p_us_confirm_account_number, ''), '[^0-9]', '', 'g'
  );
  IF v_account_digits !~ '^[0-9]{4,17}$'
     OR v_account_digits <> v_confirm_account_digits THEN
    RAISE EXCEPTION 'Bank account numbers must match and contain 4 to 17 digits';
  END IF;

  IF v_government_id_path !~ (
    '^' || v_user_id::text || '/payout/us-government-id-[a-z0-9-]+[.](pdf|jpg|jpeg|png)$'
  ) THEN
    RAISE EXCEPTION 'Upload a valid private government ID or tax proof';
  END IF;
  IF v_bank_statement_path !~ (
    '^' || v_user_id::text || '/payout/us-bank-proof-[a-z0-9-]+[.](pdf|jpg|jpeg|png)$'
  ) THEN
    RAISE EXCEPTION 'Upload a valid private bank statement or proof';
  END IF;
  IF p_us_tax_resident_declaration IS NOT TRUE THEN
    RAISE EXCEPTION 'Accept the US payout declaration before continuing';
  END IF;

  SELECT * INTO v_previous
  FROM public.international_payout_profiles
  WHERE user_id = v_user_id
    AND lower(trim(country)) = lower(v_country)
  FOR UPDATE;
  IF FOUND THEN
    v_key := public.international_payout_encryption_key();
    v_supplemental_changed :=
      COALESCE(
        extensions.pgp_sym_decrypt(v_previous.date_of_birth_encrypted, v_key),
        ''
      ) IS DISTINCT FROM to_char(v_date_of_birth, 'YYYY-MM-DD')
      OR COALESCE(
        extensions.pgp_sym_decrypt(v_previous.mobile_number_encrypted, v_key),
        ''
      ) IS DISTINCT FROM ('+1' || v_mobile_digits)
      OR COALESCE(v_previous.government_id_path, '') IS DISTINCT FROM v_government_id_path
      OR COALESCE(v_previous.bank_statement_path, '') IS DISTINCT FROM v_bank_statement_path;
  END IF;

  v_result := public.save_international_payout_profile(
    p_legal_name,
    p_tax_identifier,
    'bank',
    p_routing_aba,
    v_account_digits,
    NULL,
    NULL,
    NULL,
    NULL,
    p_us_tax_resident_declaration,
    false,
    p_terms_accepted
  );

  v_key := public.international_payout_encryption_key();
  UPDATE public.international_payout_profiles
  SET date_of_birth_encrypted = extensions.pgp_sym_encrypt(
        to_char(v_date_of_birth, 'YYYY-MM-DD'), v_key, 'cipher-algo=aes256'
      ),
      mobile_number_encrypted = extensions.pgp_sym_encrypt(
        '+1' || v_mobile_digits, v_key, 'cipher-algo=aes256'
      ),
      government_id_path = v_government_id_path,
      bank_statement_path = v_bank_statement_path,
      updated_at = now()
  WHERE user_id = v_user_id
    AND lower(trim(country)) = lower(v_country);

  IF v_supplemental_changed AND v_result->>'reviewStatus' = 'verified' THEN
    UPDATE public.international_payout_profiles
    SET review_status = 'pending',
        review_reason = NULL,
        reviewed_by = NULL,
        reviewed_at = NULL,
        submitted_at = now(),
        updated_at = now()
    WHERE user_id = v_user_id
      AND lower(trim(country)) = lower(v_country);
    v_result := jsonb_set(v_result, '{reviewStatus}', '"pending"'::jsonb, true);
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_international_payout_profile_us_kyc(
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, text, text, text, text, text
) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.save_international_payout_profile_us_kyc(
  text, text, text, text, text, text, text, text, text,
  boolean, boolean, boolean, text, text, text, text, text
) TO authenticated;
