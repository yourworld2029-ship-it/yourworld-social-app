-- KYC-backed payout profiles and atomic payout request lifecycle.

CREATE TABLE IF NOT EXISTS public.creator_payout_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  upi_id text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  ifsc text NOT NULL DEFAULT '',
  holder_name text NOT NULL DEFAULT '',
  pan_number text NOT NULL DEFAULT '',
  payout_schedule text NOT NULL DEFAULT '15_days',
  kyc_status text NOT NULL DEFAULT 'pending',
  monetization_eligible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_payout_profiles_schedule_check
    CHECK (payout_schedule IN ('15_days', '30_days')),
  CONSTRAINT creator_payout_profiles_kyc_status_check
    CHECK (kyc_status IN ('pending', 'verified', 'rejected'))
);

GRANT SELECT, INSERT, UPDATE ON public.creator_payout_profiles TO authenticated;
GRANT ALL ON public.creator_payout_profiles TO service_role;

ALTER TABLE public.creator_payout_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads payout profiles" ON public.creator_payout_profiles;
CREATE POLICY "Owner reads payout profiles" ON public.creator_payout_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Owner inserts payout profiles" ON public.creator_payout_profiles;
CREATE POLICY "Owner inserts payout profiles" ON public.creator_payout_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Owner updates payout profiles" ON public.creator_payout_profiles;
CREATE POLICY "Owner updates payout profiles" ON public.creator_payout_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  net_amount numeric(14,2) NOT NULL CHECK (net_amount >= 0),
  tds_deducted numeric(14,2) NOT NULL CHECK (tds_deducted >= 0),
  status text NOT NULL DEFAULT 'processing',
  schedule_type text NOT NULL,
  form_16a_url text,
  failure_reason text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payout_requests_status_check
    CHECK (status IN ('processing', 'completed', 'failed')),
  CONSTRAINT payout_requests_schedule_check
    CHECK (schedule_type IN ('15_days', '30_days'))
);

CREATE INDEX IF NOT EXISTS payout_requests_user_created_idx
  ON public.payout_requests (user_id, created_at DESC);

GRANT SELECT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads payout requests" ON public.payout_requests;
CREATE POLICY "Owner reads payout requests" ON public.payout_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('ads', 'course', 'vip')),
  gross_amount numeric(14,2) NOT NULL CHECK (gross_amount >= 0),
  description text,
  payout_id uuid,
  payout_request_id uuid REFERENCES public.payout_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS payout_request_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'creator_earnings_payout_request_id_fkey'
      AND conrelid = 'public.creator_earnings'::regclass
  ) THEN
    ALTER TABLE public.creator_earnings
      ADD CONSTRAINT creator_earnings_payout_request_id_fkey
      FOREIGN KEY (payout_request_id)
      REFERENCES public.payout_requests(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS creator_earnings_active_wallet_idx
  ON public.creator_earnings (user_id, created_at DESC)
  WHERE payout_id IS NULL AND payout_request_id IS NULL;

GRANT SELECT ON public.creator_earnings TO authenticated;
GRANT ALL ON public.creator_earnings TO service_role;

ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads earnings" ON public.creator_earnings;
CREATE POLICY "Owner reads earnings" ON public.creator_earnings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

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

  -- Match the wallet's existing withdrawable balance, which is after 1% TDS.
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'payout_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;
  END IF;
END $$;