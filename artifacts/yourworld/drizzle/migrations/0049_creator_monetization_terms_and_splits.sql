-- Creator monetization agreement acceptance and server-authoritative revenue splits.

ALTER TABLE public.creator_payout_profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS buyer_total numeric(14,2),
  ADD COLUMN IF NOT EXISTS gateway_fee numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_share numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creator_amount numeric(14,2);

ALTER TABLE public.creator_earnings
  DROP CONSTRAINT IF EXISTS creator_earnings_buyer_total_check,
  DROP CONSTRAINT IF EXISTS creator_earnings_gateway_fee_check,
  DROP CONSTRAINT IF EXISTS creator_earnings_platform_share_check,
  DROP CONSTRAINT IF EXISTS creator_earnings_creator_amount_check;

ALTER TABLE public.creator_earnings
  ADD CONSTRAINT creator_earnings_buyer_total_check
    CHECK (buyer_total IS NULL OR buyer_total >= 0),
  ADD CONSTRAINT creator_earnings_gateway_fee_check
    CHECK (gateway_fee >= 0),
  ADD CONSTRAINT creator_earnings_platform_share_check
    CHECK (platform_share >= 0),
  ADD CONSTRAINT creator_earnings_creator_amount_check
    CHECK (creator_amount IS NULL OR creator_amount >= 0);

CREATE OR REPLACE FUNCTION public.creator_share_for_source(
  p_source text,
  p_base_amount numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT round(
    GREATEST(COALESCE(p_base_amount, 0), 0) *
    CASE p_source
      WHEN 'ads' THEN 0.70
      WHEN 'course' THEN 0.85
      WHEN 'vip' THEN 0.85
      ELSE 0
    END,
    2
  );
$$;

CREATE OR REPLACE FUNCTION public.platform_share_for_source(
  p_source text,
  p_base_amount numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT round(
    GREATEST(COALESCE(p_base_amount, 0), 0) *
    CASE p_source
      WHEN 'ads' THEN 0.30
      WHEN 'course' THEN 0.15
      WHEN 'vip' THEN 0.15
      ELSE 0
    END,
    2
  );
$$;

CREATE OR REPLACE FUNCTION public.apply_creator_earning_split()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.creator_amount := public.creator_share_for_source(NEW.source, NEW.gross_amount);
  NEW.platform_share := public.platform_share_for_source(NEW.source, NEW.gross_amount);

  IF NEW.source IN ('course', 'vip') THEN
    NEW.gateway_fee := round(GREATEST(COALESCE(NEW.gross_amount, 0), 0) * 0.02, 2);
    NEW.buyer_total := round(GREATEST(COALESCE(NEW.gross_amount, 0), 0) + NEW.gateway_fee, 2);
  ELSE
    NEW.gateway_fee := 0;
    NEW.buyer_total := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS creator_earnings_split_trigger ON public.creator_earnings;
CREATE TRIGGER creator_earnings_split_trigger
  BEFORE INSERT OR UPDATE OF source, gross_amount
  ON public.creator_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_creator_earning_split();

UPDATE public.creator_earnings
SET creator_amount = public.creator_share_for_source(source, gross_amount),
    platform_share = public.platform_share_for_source(source, gross_amount),
    gateway_fee = CASE
      WHEN source IN ('course', 'vip') THEN round(gross_amount * 0.02, 2)
      ELSE 0
    END,
    buyer_total = CASE
      WHEN source IN ('course', 'vip') THEN round(gross_amount * 1.02, 2)
      ELSE NULL
    END
WHERE creator_amount IS NULL
   OR platform_share = 0
   OR (source IN ('course', 'vip') AND (buyer_total IS NULL OR gateway_fee = 0));

CREATE OR REPLACE FUNCTION public.record_creator_earning(
  p_user_id uuid,
  p_source text,
  p_base_amount numeric,
  p_description text DEFAULT NULL
)
RETURNS public.creator_earnings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earning public.creator_earnings;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Only the settlement service can record creator earnings';
  END IF;

  IF p_user_id IS NULL OR p_source NOT IN ('ads', 'course', 'vip') THEN
    RAISE EXCEPTION 'Invalid creator earning settlement';
  END IF;

  IF p_base_amount IS NULL OR p_base_amount <= 0 THEN
    RAISE EXCEPTION 'Settlement amount must be greater than zero';
  END IF;

  INSERT INTO public.creator_earnings (user_id, source, gross_amount, description)
  VALUES (p_user_id, p_source, round(p_base_amount, 2), p_description)
  RETURNING * INTO v_earning;

  RETURN v_earning;
END;
$$;

REVOKE ALL ON FUNCTION public.record_creator_earning(uuid, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_creator_earning(uuid, text, numeric, text) TO service_role;

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
  v_creator_balance numeric(14,2) := 0;
  v_tds numeric(14,2) := 0;
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

  IF v_profile.terms_accepted_at IS NULL THEN
    RAISE EXCEPTION 'Accept the Creator Monetization Terms before requesting a payout';
  END IF;

  IF v_profile.kyc_status <> 'verified' THEN
    RAISE EXCEPTION 'KYC verification is required before requesting a payout';
  END IF;

  FOR v_earning IN
    SELECT source, gross_amount, creator_amount
    FROM public.creator_earnings
    WHERE user_id = v_user_id
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

  IF v_creator_balance < 5000 THEN
    RAISE EXCEPTION 'Minimum available balance to request a payout is ₹5,000';
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
    v_creator_balance,
    round(v_creator_balance - v_tds, 2),
    v_tds,
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