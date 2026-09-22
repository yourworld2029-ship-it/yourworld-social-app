-- Paid-video settlement correction:
-- keep the platform's 15% gross-price commission intact and deduct gateway,
-- processing, TDS/GST estimates only from the creator's credited amount.

ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS gateway_fee numeric(14,2) NOT NULL DEFAULT 0;

ALTER TABLE public.creator_earnings
  DROP CONSTRAINT IF EXISTS creator_earnings_source_check;

ALTER TABLE public.creator_earnings
  ADD CONSTRAINT creator_earnings_source_check
    CHECK (source IN ('ads', 'course', 'vip', 'video'));

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
      WHEN 'video' THEN 0.85
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
      WHEN 'video' THEN 0.15
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
  NEW.platform_share := public.platform_share_for_source(NEW.source, NEW.gross_amount);

  IF NEW.source = 'video' THEN
    NEW.gateway_fee := round(GREATEST(COALESCE(NEW.gateway_fee, 0), 0), 2);
    NEW.creator_amount := GREATEST(
      round(
        GREATEST(COALESCE(NEW.gross_amount, 0), 0)
          - NEW.platform_share
          - NEW.gateway_fee,
        2
      ),
      0
    );
    NEW.buyer_total := round(GREATEST(COALESCE(NEW.gross_amount, 0), 0), 2);
  ELSIF NEW.source IN ('course', 'vip') THEN
    NEW.gateway_fee := round(GREATEST(COALESCE(NEW.gross_amount, 0), 0) * 0.02, 2);
    NEW.creator_amount := public.creator_share_for_source(NEW.source, NEW.gross_amount);
    NEW.buyer_total := round(GREATEST(COALESCE(NEW.gross_amount, 0), 0) + NEW.gateway_fee, 2);
  ELSE
    NEW.gateway_fee := 0;
    NEW.creator_amount := public.creator_share_for_source(NEW.source, NEW.gross_amount);
    NEW.buyer_total := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS creator_earnings_split_trigger ON public.creator_earnings;
CREATE TRIGGER creator_earnings_split_trigger
  BEFORE INSERT OR UPDATE OF source, gross_amount, gateway_fee
  ON public.creator_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_creator_earning_split();

ALTER TABLE public.video_purchases
  ADD COLUMN IF NOT EXISTS gateway_charges_and_taxes numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid_by_user numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS app_net_commission numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creator_credited_amount numeric(14,2) NOT NULL DEFAULT 0;

UPDATE public.video_purchases
SET total_paid_by_user = total_amount,
    app_net_commission = platform_fee,
    creator_credited_amount = creator_share,
    gateway_charges_and_taxes = COALESCE(gateway_charges_and_taxes, 0)
WHERE total_paid_by_user = 0
   OR app_net_commission = 0
   OR creator_credited_amount = 0;

ALTER TABLE public.video_purchases
  DROP CONSTRAINT IF EXISTS video_purchases_split_balances_check,
  DROP CONSTRAINT IF EXISTS video_purchases_financial_aliases_check;

ALTER TABLE public.video_purchases
  ADD CONSTRAINT video_purchases_split_balances_check
    CHECK (
      platform_fee + gateway_charges_and_taxes + creator_share = total_amount
    ),
  ADD CONSTRAINT video_purchases_financial_aliases_check
    CHECK (
      total_paid_by_user = total_amount
      AND app_net_commission = platform_fee
      AND creator_credited_amount = creator_share
    );

CREATE TABLE IF NOT EXISTS public.platform_revenue_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_purchase_id uuid NOT NULL UNIQUE
    REFERENCES public.video_purchases(id) ON DELETE CASCADE,
  total_paid_by_user numeric(14,2) NOT NULL CHECK (total_paid_by_user > 0),
  app_net_commission numeric(14,2) NOT NULL CHECK (app_net_commission >= 0),
  gateway_charges_and_taxes numeric(14,2) NOT NULL DEFAULT 0
    CHECK (gateway_charges_and_taxes >= 0),
  creator_credited_amount numeric(14,2) NOT NULL CHECK (creator_credited_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_revenue_ledger_balances_check
    CHECK (
      app_net_commission + gateway_charges_and_taxes + creator_credited_amount
        = total_paid_by_user
    )
);

GRANT ALL ON public.platform_revenue_ledger TO service_role;
ALTER TABLE public.platform_revenue_ledger ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.settle_video_purchase_on_payment_success(
  p_video_id uuid,
  p_buyer_id uuid,
  p_payment_reference text,
  p_total_amount numeric,
  p_gateway_fee numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_video record;
  v_existing public.video_purchases%ROWTYPE;
  v_purchase public.video_purchases%ROWTYPE;
  v_total numeric(14,2);
  v_platform_fee numeric(14,2);
  v_gateway_fee numeric(14,2);
  v_creator_payout numeric(14,2);
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Only the settlement service can record video purchases';
  END IF;

  IF p_video_id IS NULL
     OR p_buyer_id IS NULL
     OR NULLIF(trim(COALESCE(p_payment_reference, '')), '') IS NULL
     OR p_total_amount IS NULL
     OR p_total_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid paid video settlement';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.video_purchases
  WHERE payment_reference = trim(p_payment_reference)
     OR (video_id = p_video_id AND buyer_id = p_buyer_id)
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'purchase_id', v_existing.id,
      'video_id', v_existing.video_id,
      'buyer_id', v_existing.buyer_id,
      'creator_id', v_existing.creator_id,
      'total_amount', v_existing.total_paid_by_user,
      'platform_fee', v_existing.app_net_commission,
      'gateway_fee', v_existing.gateway_charges_and_taxes,
      'creator_share', v_existing.creator_credited_amount,
      'already_settled', true
    );
  END IF;

  SELECT id, user_id, video_access, price
  INTO v_video
  FROM public.posts
  WHERE id = p_video_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paid video not found';
  END IF;

  IF v_video.video_access <> 'paid' OR COALESCE(v_video.price, 0) <= 0 THEN
    RAISE EXCEPTION 'Video is not available for paid purchase';
  END IF;

  IF v_video.user_id = p_buyer_id THEN
    RAISE EXCEPTION 'Creators cannot purchase their own video';
  END IF;

  v_total := round(v_video.price::numeric, 2);
  IF round(p_total_amount::numeric, 2) <> v_total THEN
    RAISE EXCEPTION 'Payment amount does not match the video price';
  END IF;

  v_platform_fee := round(v_total * 0.15, 2);
  v_gateway_fee := CASE
    WHEN p_gateway_fee IS NULL THEN round(v_total * 0.0236, 2)
    ELSE round(p_gateway_fee::numeric, 2)
  END;

  IF v_gateway_fee < 0 OR v_gateway_fee > v_total - v_platform_fee THEN
    RAISE EXCEPTION 'Invalid gateway charge';
  END IF;

  v_creator_payout := round(v_total - v_platform_fee - v_gateway_fee, 2);

  INSERT INTO public.video_purchases (
    video_id,
    creator_id,
    buyer_id,
    payment_reference,
    total_amount,
    platform_fee,
    gateway_charges_and_taxes,
    creator_share,
    total_paid_by_user,
    app_net_commission,
    creator_credited_amount,
    status
  )
  VALUES (
    p_video_id,
    v_video.user_id,
    p_buyer_id,
    trim(p_payment_reference),
    v_total,
    v_platform_fee,
    v_gateway_fee,
    v_creator_payout,
    v_total,
    v_platform_fee,
    v_creator_payout,
    'paid'
  )
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_purchase;

  IF NOT FOUND THEN
    SELECT *
    INTO v_existing
    FROM public.video_purchases
    WHERE payment_reference = trim(p_payment_reference)
       OR (video_id = p_video_id AND buyer_id = p_buyer_id)
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Video purchase could not be settled';
    END IF;

    RETURN jsonb_build_object(
      'purchase_id', v_existing.id,
      'video_id', v_existing.video_id,
      'buyer_id', v_existing.buyer_id,
      'creator_id', v_existing.creator_id,
      'total_amount', v_existing.total_paid_by_user,
      'platform_fee', v_existing.app_net_commission,
      'gateway_fee', v_existing.gateway_charges_and_taxes,
      'creator_share', v_existing.creator_credited_amount,
      'already_settled', true
    );
  END IF;

  INSERT INTO public.platform_revenue_ledger (
    video_purchase_id,
    total_paid_by_user,
    app_net_commission,
    gateway_charges_and_taxes,
    creator_credited_amount
  )
  VALUES (
    v_purchase.id,
    v_total,
    v_platform_fee,
    v_gateway_fee,
    v_creator_payout
  );

  -- The existing payout workflow reads creator_earnings. The video source
  -- trigger preserves the exact gateway deduction before payout aggregation.
  INSERT INTO public.creator_earnings (
    user_id,
    source,
    gross_amount,
    gateway_fee,
    description
  )
  VALUES (
    v_video.user_id,
    'video',
    v_total,
    v_gateway_fee,
    'Paid video purchase ' || v_purchase.id::text
  );

  INSERT INTO public.wallets (user_id, balance, currency, updated_at)
  VALUES (v_video.user_id, v_creator_payout, 'INR', now())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.wallets.balance + EXCLUDED.balance,
      updated_at = now();

  UPDATE public.platform_wallets
  SET balance = balance + v_platform_fee,
      updated_at = now()
  WHERE id = true;

  INSERT INTO public.video_access_grants (
    post_id,
    user_id,
    access_type,
    amount_paid,
    granted_by
  )
  VALUES (
    p_video_id,
    p_buyer_id,
    'paid',
    v_total,
    NULL
  )
  ON CONFLICT (post_id, user_id) DO UPDATE
  SET access_type = 'paid',
      amount_paid = EXCLUDED.amount_paid;

  RETURN jsonb_build_object(
    'purchase_id', v_purchase.id,
    'video_id', v_purchase.video_id,
    'buyer_id', v_purchase.buyer_id,
    'creator_id', v_purchase.creator_id,
    'total_amount', v_total,
    'platform_fee', v_platform_fee,
    'gateway_fee', v_gateway_fee,
    'creator_share', v_creator_payout,
    'already_settled', false
  );
END;
$$;

-- Preserve the earlier four-argument webhook contract; it now uses the
-- standard 2.36% estimate when no actual charge is supplied.
CREATE OR REPLACE FUNCTION public.settle_video_purchase_on_payment_success(
  p_video_id uuid,
  p_buyer_id uuid,
  p_payment_reference text,
  p_total_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.settle_video_purchase_on_payment_success(
    p_video_id,
    p_buyer_id,
    p_payment_reference,
    p_total_amount,
    NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.settle_video_purchase_on_payment_success(uuid, uuid, text, numeric)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_video_purchase_on_payment_success(uuid, uuid, text, numeric, numeric)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_video_purchase_on_payment_success(uuid, uuid, text, numeric)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_video_purchase_on_payment_success(uuid, uuid, text, numeric, numeric)
  TO service_role;