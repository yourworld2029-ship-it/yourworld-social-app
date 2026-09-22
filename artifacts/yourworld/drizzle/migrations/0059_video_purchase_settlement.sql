-- Paid video purchase ledger and atomic 85/15 settlement.
--
-- The payment provider/webhook must call
-- settle_video_purchase_on_payment_success() only after it has verified the
-- payment. The function is service-role-only and derives the amount from the
-- video row instead of trusting a client-provided price.

CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'INR',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS balance numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_id_key
  ON public.wallets (user_id);

GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads wallet" ON public.wallets;
CREATE POLICY "Owner reads wallet" ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.platform_wallets (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  balance numeric(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'INR',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_wallets (id, balance, currency)
VALUES (true, 0, 'INR')
ON CONFLICT (id) DO NOTHING;

GRANT ALL ON public.platform_wallets TO service_role;
ALTER TABLE public.platform_wallets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.video_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_reference text NOT NULL UNIQUE,
  total_amount numeric(14,2) NOT NULL CHECK (total_amount > 0),
  platform_fee numeric(14,2) NOT NULL CHECK (platform_fee >= 0),
  creator_share numeric(14,2) NOT NULL CHECK (creator_share >= 0),
  status text NOT NULL DEFAULT 'paid'
    CHECK (status IN ('paid', 'refunded', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT video_purchases_split_balances_check
    CHECK (platform_fee + creator_share = total_amount)
);

CREATE UNIQUE INDEX IF NOT EXISTS video_purchases_video_buyer_key
  ON public.video_purchases (video_id, buyer_id);
CREATE INDEX IF NOT EXISTS video_purchases_creator_idx
  ON public.video_purchases (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS video_purchases_buyer_idx
  ON public.video_purchases (buyer_id, created_at DESC);

GRANT SELECT ON public.video_purchases TO authenticated;
GRANT ALL ON public.video_purchases TO service_role;

ALTER TABLE public.video_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyer reads video purchases" ON public.video_purchases;
CREATE POLICY "Buyer reads video purchases" ON public.video_purchases
  FOR SELECT TO authenticated USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Creator reads video purchases" ON public.video_purchases;
CREATE POLICY "Creator reads video purchases" ON public.video_purchases
  FOR SELECT TO authenticated USING (creator_id = auth.uid());

CREATE UNIQUE INDEX IF NOT EXISTS video_access_grants_post_user_key
  ON public.video_access_grants (post_id, user_id);

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
DECLARE
  v_video record;
  v_existing public.video_purchases%ROWTYPE;
  v_purchase public.video_purchases%ROWTYPE;
  v_total numeric(14,2);
  v_platform_fee numeric(14,2);
  v_creator_share numeric(14,2);
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

  -- A provider retry must be harmless and must never credit either balance
  -- twice. Lock an existing purchase before returning it.
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
      'total_amount', v_existing.total_amount,
      'platform_fee', v_existing.platform_fee,
      'creator_share', v_existing.creator_share,
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
  -- Derive the creator amount as the remainder so the ledger always balances
  -- exactly to the charged amount after currency rounding.
  v_creator_share := round(v_total - v_platform_fee, 2);

  INSERT INTO public.video_purchases (
    video_id,
    creator_id,
    buyer_id,
    payment_reference,
    total_amount,
    platform_fee,
    creator_share,
    status
  )
  VALUES (
    p_video_id,
    v_video.user_id,
    p_buyer_id,
    trim(p_payment_reference),
    v_total,
    v_platform_fee,
    v_creator_share,
    'paid'
  )
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_purchase;

  -- Another payment retry may have won the unique insert between the
  -- idempotency read above and this insert. Return that committed purchase
  -- without applying either balance update a second time.
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
      'total_amount', v_existing.total_amount,
      'platform_fee', v_existing.platform_fee,
      'creator_share', v_existing.creator_share,
      'already_settled', true
    );
  END IF;

  -- Keep the existing creator earnings ledger and wallet UI in sync with the
  -- purchase-specific ledger. Its trigger independently enforces 85/15.
  INSERT INTO public.creator_earnings (
    user_id,
    source,
    gross_amount,
    description
  )
  VALUES (
    v_video.user_id,
    'course',
    v_total,
    'Paid video purchase ' || v_purchase.id::text
  );

  INSERT INTO public.wallets (user_id, balance, currency, updated_at)
  VALUES (v_video.user_id, v_creator_share, 'INR', now())
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
    'total_amount', v_purchase.total_amount,
    'platform_fee', v_purchase.platform_fee,
    'creator_share', v_purchase.creator_share,
    'already_settled', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.settle_video_purchase_on_payment_success(uuid, uuid, text, numeric)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_video_purchase_on_payment_success(uuid, uuid, text, numeric)
  TO service_role;