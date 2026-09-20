-- Keep payout-request amounts aligned with the wallet's existing post-TDS balance.

CREATE OR REPLACE FUNCTION public.submit_payout_request()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.creator_payout_profiles%ROWTYPE;
  v_earning record;
  v_request public.payout_requests%ROWTYPE;
  v_balance numeric(14,2) := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  SELECT *
  INTO v_profile
  FROM public.creator_payout_profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Save your payout details before requesting a payout';
  END IF;

  IF v_profile.kyc_status <> 'verified' THEN
    RAISE EXCEPTION 'KYC verification is required before requesting a payout';
  END IF;

  FOR v_earning IN
    SELECT source, gross_amount
    FROM public.creator_earnings
    WHERE user_id = v_user_id
      AND payout_id IS NULL
      AND payout_request_id IS NULL
    FOR UPDATE
  LOOP
    v_balance := v_balance + CASE v_earning.source
      WHEN 'ads' THEN v_earning.gross_amount * 0.70
      WHEN 'course' THEN v_earning.gross_amount * 0.85
      WHEN 'vip' THEN v_earning.gross_amount * 0.85
      ELSE 0
    END;
  END LOOP;

  v_balance := round(v_balance * 0.99, 2);

  IF v_balance < 5000 THEN
    RAISE EXCEPTION 'Minimum balance to withdraw instantly is ₹5,000';
  END IF;

  INSERT INTO public.payout_requests (
    user_id,
    amount,
    net_amount,
    tds_deducted,
    status,
    schedule_type
  )
  VALUES (
    v_user_id,
    v_balance,
    round(v_balance * 0.99, 2),
    round(v_balance * 0.01, 2),
    'processing',
    v_profile.payout_schedule
  )
  RETURNING * INTO v_request;

  UPDATE public.creator_earnings
  SET payout_request_id = v_request.id
  WHERE user_id = v_user_id
    AND payout_id IS NULL
    AND payout_request_id IS NULL;

  RETURN to_jsonb(v_request);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payout_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_payout_request() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_payout_request() TO service_role;