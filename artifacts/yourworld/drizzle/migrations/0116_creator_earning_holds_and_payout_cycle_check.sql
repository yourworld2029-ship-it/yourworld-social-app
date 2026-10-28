BEGIN;

ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS moderation_hold_status text NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS moderation_hold_reason text,
  ADD COLUMN IF NOT EXISTS moderation_held_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_dispute_until timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_hold_report_id uuid,
  ADD COLUMN IF NOT EXISTS moderation_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_resolved_by uuid REFERENCES auth.users(id);

ALTER TABLE public.creator_earnings
  DROP CONSTRAINT IF EXISTS creator_earnings_moderation_hold_status_check;
ALTER TABLE public.creator_earnings
  ADD CONSTRAINT creator_earnings_moderation_hold_status_check
  CHECK (moderation_hold_status IN ('available', 'held', 'released'));

CREATE INDEX IF NOT EXISTS creator_earnings_active_moderation_holds_idx
  ON public.creator_earnings (user_id, currency, moderation_held_at DESC)
  WHERE moderation_hold_status = 'held' AND payout_id IS NULL;

ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS security_check_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_check_passed boolean,
  ADD COLUMN IF NOT EXISTS security_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS security_check_reason text;

CREATE INDEX IF NOT EXISTS payout_requests_security_cycle_idx
  ON public.payout_requests (payout_window_start, status)
  WHERE security_check_required = true;

CREATE OR REPLACE FUNCTION public.hold_creator_earnings_for_post(
  p_post_id uuid,
  p_report_id uuid,
  p_reason text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_post_id IS NULL OR NULLIF(trim(COALESCE(p_reason, '')), '') IS NULL THEN
    RAISE EXCEPTION 'A content ID and review reason are required';
  END IF;

  UPDATE public.creator_earnings
  SET moderation_hold_status = 'held',
      moderation_hold_reason = trim(p_reason),
      moderation_held_at = now(),
      moderation_dispute_until = now() + interval '7 days',
      moderation_hold_report_id = p_report_id,
      moderation_resolved_at = NULL,
      moderation_resolved_by = NULL
  WHERE source_post_id = p_post_id
    AND payout_id IS NULL
    AND moderation_hold_status <> 'held';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.hold_creator_earnings_for_post(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hold_creator_earnings_for_post(uuid, uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_creator_earning_hold(
  p_earning_id uuid,
  p_admin_user_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_earning_id IS NULL OR p_admin_user_id IS NULL
     OR NULLIF(trim(COALESCE(p_reason, '')), '') IS NULL THEN
    RAISE EXCEPTION 'An earning, admin, and review reason are required';
  END IF;

  UPDATE public.creator_earnings
  SET moderation_hold_status = 'released',
      moderation_resolved_at = now(),
      moderation_resolved_by = p_admin_user_id
  WHERE id = p_earning_id
    AND moderation_hold_status = 'held'
    AND payout_id IS NULL
  RETURNING user_id INTO v_user_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'This earning is no longer under review';
  END IF;

  INSERT INTO public.admin_action_audit (
    admin_user_id,
    target_user_id,
    action,
    reason,
    assurance_level,
    metadata
  )
  VALUES (
    p_admin_user_id,
    v_user_id,
    'creator_earning_hold_released',
    trim(p_reason),
    'aal2',
    jsonb_build_object('earning_id', p_earning_id)
  );

  RETURN jsonb_build_object('earning_id', p_earning_id, 'status', 'released');
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_creator_earning_hold(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_creator_earning_hold(uuid, uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.run_monthly_payout_security_check(p_force boolean DEFAULT false)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_cycle_start date;
  v_count integer;
BEGIN
  IF NOT p_force AND extract(day FROM v_today) <> 27 THEN
    RETURN 0;
  END IF;

  v_cycle_start := (date_trunc('month', v_today) + interval '1 month')::date;

  UPDATE public.payout_requests AS request
  SET security_check_required = true,
      security_checked_at = now(),
      security_check_passed = NOT EXISTS (
        SELECT 1
        FROM public.admin_payout_holds AS hold
        WHERE hold.user_id = request.user_id
          AND hold.status = 'held'
      ),
      security_check_reason = CASE
        WHEN EXISTS (
          SELECT 1
          FROM public.admin_payout_holds AS hold
          WHERE hold.user_id = request.user_id
            AND hold.status = 'held'
        ) THEN 'An active payout hold exists'
        ELSE 'No active payout hold was found'
      END
  WHERE request.payout_window_start = v_cycle_start
    AND request.status IN ('processing', 'approved');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.run_monthly_payout_security_check(boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_monthly_payout_security_check(boolean)
  TO service_role;

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

  IF EXISTS (
    SELECT 1 FROM public.admin_payout_holds
    WHERE user_id = v_user_id AND status = 'held'
  ) THEN
    RAISE EXCEPTION 'Your payout is on hold pending admin review';
  END IF;

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
      AND moderation_hold_status <> 'held'
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
    user_id, amount, net_amount, tds_deducted, status, schedule_type, currency,
    payout_window_start, security_check_required, security_check_passed,
    security_checked_at, security_check_reason
  )
  VALUES (
    v_user_id, v_creator_balance, round(v_creator_balance - v_tds, 2), v_tds,
    'processing', 'monthly_1_5', v_currency, v_window_start, true, true, now(),
    'No active payout hold was found at request submission'
  )
  RETURNING * INTO v_request;

  UPDATE public.creator_earnings
  SET payout_request_id = v_request.id
  WHERE user_id = v_user_id
    AND currency = v_currency
    AND payout_id IS NULL
    AND payout_request_id IS NULL
    AND moderation_hold_status <> 'held';

  RETURN to_jsonb(v_request);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payout_request() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_payout_request() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_resolve_payout_request(
  p_request_id uuid,
  p_action text,
  p_reason text,
  p_payment_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_request public.payout_requests%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;
  IF COALESCE(auth.jwt() ->> 'aal', '') <> 'aal2' THEN
    RAISE EXCEPTION 'Admin MFA is required to process payouts';
  END IF;
  IF v_email <> 'yourworld2029@gmail.com'
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = v_admin_id AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Forbidden: admin access is required';
  END IF;
  IF p_action NOT IN ('completed', 'failed')
     OR NULLIF(trim(COALESCE(p_reason, '')), '') IS NULL
     OR (p_action = 'completed'
         AND NULLIF(trim(COALESCE(p_payment_reference, '')), '') IS NULL) THEN
    RAISE EXCEPTION 'Provide a valid payout action, reason, and transfer reference';
  END IF;

  SELECT * INTO v_request
  FROM public.payout_requests
  WHERE id = p_request_id
    AND status IN ('processing', 'approved')
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This payout request is no longer pending';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.admin_payout_holds
    WHERE user_id = v_request.user_id AND status = 'held'
  ) THEN
    RAISE EXCEPTION 'This creator has an active payout hold';
  END IF;
  IF p_action = 'completed' THEN
    IF v_request.security_check_required
       AND v_request.security_check_passed IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'This payout has not passed the monthly payout-hold check';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.creator_earnings
      WHERE payout_request_id = v_request.id
        AND moderation_hold_status = 'held'
    ) THEN
      RAISE EXCEPTION 'This payout includes earnings held for admin review';
    END IF;
    IF v_request.payout_window_start IS NULL
       OR v_today < v_request.payout_window_start
       OR v_today > v_request.payout_window_start + 4 THEN
      RAISE EXCEPTION 'Payout completion is limited to the assigned monthly 1–5 processing window';
    END IF;

    UPDATE public.payout_requests
    SET status = 'completed',
        completed_at = now(),
        admin_payment_reference = trim(p_payment_reference),
        failure_reason = NULL
    WHERE id = p_request_id;
  ELSE
    UPDATE public.payout_requests
    SET status = 'failed',
        failure_reason = trim(p_reason),
        completed_at = NULL
    WHERE id = p_request_id;

    UPDATE public.creator_earnings
    SET payout_request_id = NULL
    WHERE payout_request_id = p_request_id;
  END IF;

  INSERT INTO public.admin_action_audit (
    admin_user_id, target_user_id, action, reason, assurance_level, metadata
  )
  VALUES (
    v_admin_id, v_request.user_id, 'payout_' || p_action, trim(p_reason), 'aal2',
    jsonb_build_object(
      'request_id', p_request_id,
      'currency', v_request.currency,
      'amount', v_request.amount,
      'payment_reference', CASE
        WHEN p_action = 'completed' THEN trim(p_payment_reference)
        ELSE NULL
      END
    )
  );

  RETURN jsonb_build_object('request_id', p_request_id, 'status', p_action);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_resolve_payout_request(uuid, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_payout_request(uuid, text, text, text)
  TO authenticated;

DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'creator-payout-security-check';

    PERFORM cron.schedule(
      'creator-payout-security-check',
      '0 0 27 * *',
      'SELECT public.run_monthly_payout_security_check();'
    );
  END IF;
END;
$$;

-- Initialize the next payout window once so installing after the 27th does not
-- leave already-submitted requests without a hold check.
SELECT public.run_monthly_payout_security_check(true);

COMMIT;
