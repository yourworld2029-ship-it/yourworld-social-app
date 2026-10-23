-- Monetization thresholds, currency-aware manual payouts, and long-video-only ads.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_duration_seconds_nonnegative;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_duration_seconds_nonnegative
  CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

CREATE INDEX IF NOT EXISTS posts_video_duration_owner_idx
  ON public.posts (user_id, kind, duration_seconds)
  WHERE kind = 'video';

ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS source_post_id uuid;

ALTER TABLE public.creator_earnings
  DROP CONSTRAINT IF EXISTS creator_earnings_source_check,
  ADD CONSTRAINT creator_earnings_source_check
    CHECK (source IN ('ads', 'course', 'vip', 'video'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'creator_earnings_currency_check'
      AND conrelid = 'public.creator_earnings'::regclass
  ) THEN
    ALTER TABLE public.creator_earnings
      ADD CONSTRAINT creator_earnings_currency_check
      CHECK (currency IN ('INR', 'USD'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'creator_earnings_source_post_id_fkey'
      AND conrelid = 'public.creator_earnings'::regclass
  ) THEN
    ALTER TABLE public.creator_earnings
      ADD CONSTRAINT creator_earnings_source_post_id_fkey
      FOREIGN KEY (source_post_id)
      REFERENCES public.posts(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS creator_earnings_currency_wallet_idx
  ON public.creator_earnings (user_id, currency, created_at DESC)
  WHERE payout_id IS NULL AND payout_request_id IS NULL;

ALTER TABLE public.creator_payout_profiles
  ADD COLUMN IF NOT EXISTS payout_currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS swift_bic text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_country text NOT NULL DEFAULT '';

UPDATE public.creator_payout_profiles cpp
SET payout_currency = CASE
  WHEN lower(trim(COALESCE(p.country, ''))) IN ('india', 'in') THEN 'INR'
  WHEN NULLIF(trim(COALESCE(p.country, '')), '') IS NULL THEN 'INR'
  ELSE 'USD'
END,
bank_country = COALESCE(NULLIF(trim(cpp.bank_country), ''), COALESCE(p.country, ''))
FROM public.profiles p
WHERE p.id = cpp.user_id;

ALTER TABLE public.creator_payout_profiles
  DROP CONSTRAINT IF EXISTS creator_payout_profiles_schedule_check,
  DROP CONSTRAINT IF EXISTS creator_payout_profiles_currency_check;

UPDATE public.creator_payout_profiles
SET payout_schedule = 'monthly_1_5'
WHERE payout_schedule IS DISTINCT FROM 'monthly_1_5';

ALTER TABLE public.creator_payout_profiles
  ALTER COLUMN payout_schedule SET DEFAULT 'monthly_1_5',
  ADD CONSTRAINT creator_payout_profiles_schedule_check
    CHECK (payout_schedule = 'monthly_1_5'),
  ADD CONSTRAINT creator_payout_profiles_currency_check
    CHECK (payout_currency IN ('INR', 'USD'));

ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS payout_window_start date,
  ADD COLUMN IF NOT EXISTS admin_payment_reference text;

ALTER TABLE public.payout_requests
  DROP CONSTRAINT IF EXISTS payout_requests_schedule_check,
  DROP CONSTRAINT IF EXISTS payout_requests_currency_check;

ALTER TABLE public.payout_requests
  ADD CONSTRAINT payout_requests_schedule_check
    CHECK (schedule_type IN ('15_days', '30_days', 'monthly_1_5')),
  ADD CONSTRAINT payout_requests_currency_check
    CHECK (currency IN ('INR', 'USD'));

CREATE OR REPLACE FUNCTION public.derive_creator_payout_currency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_country text;
BEGIN
  SELECT country
  INTO v_country
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF lower(trim(COALESCE(v_country, ''))) IN ('india', 'in')
     OR NULLIF(trim(COALESCE(v_country, '')), '') IS NULL THEN
    NEW.payout_currency := 'INR';
  ELSE
    NEW.payout_currency := 'USD';
  END IF;

  IF NULLIF(trim(COALESCE(NEW.bank_country, '')), '') IS NULL THEN
    NEW.bank_country := COALESCE(v_country, '');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS derive_creator_payout_currency
  ON public.creator_payout_profiles;
CREATE TRIGGER derive_creator_payout_currency
  BEFORE INSERT OR UPDATE OF user_id, payout_currency, bank_country
  ON public.creator_payout_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.derive_creator_payout_currency();

CREATE OR REPLACE FUNCTION public.enforce_creator_monetization_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_followers bigint := 0;
  v_watch_hours numeric := 0;
  v_video_views bigint := 0;
  v_min_followers bigint := 15000;
  v_min_watch_hours numeric := 2500;
  v_min_video_views bigint := 150000;
  v_national_award boolean := false;
  v_verified_sports boolean := false;
BEGIN
  IF NEW.monetization_eligible IS NOT TRUE
     OR (TG_OP = 'UPDATE' AND OLD.monetization_eligible IS TRUE) THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A profile is required before monetization can be enabled';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.national_award_verifications award
    WHERE award.user_id = NEW.user_id
      AND award.review_status = 'approved'
  )
  INTO v_national_award;

  v_verified_sports :=
    v_profile.is_verified IS TRUE
    AND v_profile.verification_requested IS DISTINCT FROM TRUE
    AND (
      lower(COALESCE(v_profile.category, '')) LIKE '%player%'
      OR lower(COALESCE(v_profile.category, '')) LIKE '%athlete%'
      OR lower(COALESCE(v_profile.category, '')) LIKE '%coach%'
    );

  IF v_national_award THEN
    v_min_followers := 10000;
    v_min_watch_hours := 1500;
    v_min_video_views := 70000;
  ELSIF v_verified_sports
     AND COALESCE(v_profile.bio, '') ~*
       E'(^|[\\n\\r])[[:space:]]*(representation|represents|status)[[:space:]]*:[[:space:]]*international([[:space:]]+(player|coach))?([[:space:]\\n\\r]|$)' THEN
    v_min_followers := 10000;
    v_min_watch_hours := 1500;
    v_min_video_views := 70000;
  ELSIF v_verified_sports
     AND COALESCE(v_profile.bio, '') ~*
       E'(^|[\\n\\r])[[:space:]]*(representation|represents|status)[[:space:]]*:[[:space:]]*national([[:space:]]+(player|coach))?([[:space:]\\n\\r]|$)' THEN
    v_min_followers := 12000;
    v_min_watch_hours := 2000;
    v_min_video_views := 100000;
  END IF;

  SELECT count(*)
  INTO v_followers
  FROM public.follows
  WHERE following_id = NEW.user_id;

  SELECT COALESCE(sum(p.views_count), 0)
  INTO v_video_views
  FROM public.posts p
  WHERE p.user_id = NEW.user_id
    AND p.kind = 'video';

  SELECT COALESCE(sum(l.watched_duration_seconds), 0)::numeric / 3600
  INTO v_watch_hours
  FROM public.video_view_ledger l
  JOIN public.posts p ON p.id = l.video_id
  WHERE p.user_id = NEW.user_id
    AND p.kind IN ('video', 'reel')
    AND l.created_at >= 'epoch'::timestamptz;

  IF v_followers < v_min_followers
     OR v_watch_hours < v_min_watch_hours
     OR v_video_views < v_min_video_views THEN
    RAISE EXCEPTION
      'Monetization requires all three thresholds: % followers, % watch hours, and % video views',
      v_min_followers,
      v_min_watch_hours,
      v_min_video_views;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_creator_monetization_eligibility
  ON public.creator_payout_profiles;
CREATE TRIGGER enforce_creator_monetization_eligibility
  BEFORE INSERT OR UPDATE OF monetization_eligible
  ON public.creator_payout_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_creator_monetization_eligibility();

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
DECLARE
  v_post record;
BEGIN
  IF NEW.source = 'ads'
     AND NOT (
       TG_OP = 'UPDATE'
       AND OLD.source_post_id IS NOT NULL
       AND NEW.source_post_id IS NULL
     ) THEN
    IF NEW.source_post_id IS NULL THEN
      RAISE EXCEPTION 'Ad earnings must be linked to a qualifying long video';
    END IF;

    SELECT user_id, kind, duration_seconds
    INTO v_post
    FROM public.posts
    WHERE id = NEW.source_post_id
    FOR SHARE;

    IF NOT FOUND
       OR v_post.user_id IS DISTINCT FROM NEW.user_id
       OR v_post.kind IS DISTINCT FROM 'video'
       OR COALESCE(v_post.duration_seconds, 0) < 90 THEN
      RAISE EXCEPTION 'Ad earnings require the creator''s standard video of at least 90 seconds';
    END IF;
  END IF;

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
  BEFORE INSERT OR UPDATE OF source, gross_amount, gateway_fee, source_post_id, user_id
  ON public.creator_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_creator_earning_split();

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

  IF p_user_id IS NULL OR p_source NOT IN ('course', 'vip') THEN
    RAISE EXCEPTION 'Use the linked long-video settlement for ad earnings';
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

CREATE OR REPLACE FUNCTION public.record_creator_earning_in_currency(
  p_user_id uuid,
  p_source text,
  p_base_amount numeric,
  p_currency text,
  p_description text DEFAULT NULL
)
RETURNS public.creator_earnings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earning public.creator_earnings;
  v_country text;
  v_expected_currency text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Only the settlement service can record creator earnings';
  END IF;

  IF p_user_id IS NULL
     OR p_source NOT IN ('course', 'vip')
     OR p_currency NOT IN ('INR', 'USD') THEN
    RAISE EXCEPTION 'Invalid currency-aware creator settlement';
  END IF;

  IF p_base_amount IS NULL OR p_base_amount <= 0 THEN
    RAISE EXCEPTION 'Settlement amount must be greater than zero';
  END IF;

  SELECT country
  INTO v_country
  FROM public.profiles
  WHERE id = p_user_id;

  v_expected_currency := CASE
    WHEN lower(trim(COALESCE(v_country, ''))) IN ('india', 'in')
      OR NULLIF(trim(COALESCE(v_country, '')), '') IS NULL THEN 'INR'
    ELSE 'USD'
  END;

  IF p_currency IS DISTINCT FROM v_expected_currency THEN
    RAISE EXCEPTION 'Settlement currency must match the creator''s country';
  END IF;

  INSERT INTO public.creator_earnings (user_id, source, gross_amount, currency, description)
  VALUES (p_user_id, p_source, round(p_base_amount, 2), p_currency, p_description)
  RETURNING * INTO v_earning;

  RETURN v_earning;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_video_ad_earning(
  p_user_id uuid,
  p_post_id uuid,
  p_base_amount numeric,
  p_currency text,
  p_description text DEFAULT NULL
)
RETURNS public.creator_earnings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earning public.creator_earnings;
  v_expected_currency text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Only the settlement service can record ad earnings';
  END IF;

  IF p_user_id IS NULL
     OR p_post_id IS NULL
     OR p_currency NOT IN ('INR', 'USD')
     OR p_base_amount IS NULL
     OR p_base_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid video ad settlement';
  END IF;

  SELECT CASE
    WHEN lower(trim(COALESCE(country, ''))) IN ('india', 'in')
      OR NULLIF(trim(COALESCE(country, '')), '') IS NULL THEN 'INR'
    ELSE 'USD'
  END
  INTO v_expected_currency
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND OR p_currency IS DISTINCT FROM v_expected_currency THEN
    RAISE EXCEPTION 'Ad settlement currency must match the creator''s country';
  END IF;

  INSERT INTO public.creator_earnings (
    user_id,
    source,
    source_post_id,
    gross_amount,
    currency,
    description
  )
  VALUES (
    p_user_id,
    'ads',
    p_post_id,
    round(p_base_amount, 2),
    p_currency,
    p_description
  )
  RETURNING * INTO v_earning;

  RETURN v_earning;
END;
$$;

REVOKE ALL ON FUNCTION public.record_creator_earning(uuid, text, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_creator_earning_in_currency(uuid, text, numeric, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_video_ad_earning(uuid, uuid, numeric, text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_creator_earning(uuid, text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_creator_earning_in_currency(uuid, text, numeric, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.record_video_ad_earning(uuid, uuid, numeric, text, text)
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

  SELECT country
  INTO v_country
  FROM public.profiles
  WHERE id = v_user_id;

  v_currency := CASE
    WHEN lower(trim(COALESCE(v_country, ''))) IN ('india', 'in')
      OR NULLIF(trim(COALESCE(v_country, '')), '') IS NULL THEN 'INR'
    ELSE 'USD'
  END;
  v_threshold := CASE WHEN v_currency = 'INR' THEN 5000 ELSE 70 END;

  SELECT *
  INTO v_profile
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

  IF v_profile.kyc_status <> 'verified' THEN
    RAISE EXCEPTION 'KYC verification is required before requesting a payout';
  END IF;

  IF v_currency = 'INR'
     AND NULLIF(trim(COALESCE(v_profile.account_number, '')), '') IS NULL
     AND NULLIF(trim(COALESCE(v_profile.upi_id, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Add a bank account or UPI ID before requesting an INR payout';
  END IF;

  IF v_currency = 'USD'
     AND (
       NULLIF(trim(COALESCE(v_profile.account_number, '')), '') IS NULL
       OR NULLIF(trim(COALESCE(v_profile.swift_bic, '')), '') IS NULL
       OR NULLIF(trim(COALESCE(v_profile.bank_name, '')), '') IS NULL
     ) THEN
    RAISE EXCEPTION 'Add bank name, account/IBAN, and SWIFT/BIC for a USD payout';
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
    user_id,
    amount,
    net_amount,
    tds_deducted,
    status,
    schedule_type,
    currency,
    payout_window_start
  )
  VALUES (
    v_user_id,
    v_creator_balance,
    round(v_creator_balance - v_tds, 2),
    v_tds,
    'processing',
    'monthly_1_5',
    v_currency,
    v_window_start
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

  SELECT *
  INTO v_request
  FROM public.payout_requests
  WHERE id = p_request_id
    AND status IN ('processing', 'approved')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This payout request is no longer pending';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_payout_holds
    WHERE user_id = v_request.user_id
      AND status = 'held'
  ) THEN
    RAISE EXCEPTION 'This creator has an active payout hold';
  END IF;

  IF p_action = 'completed' THEN
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
    admin_user_id,
    target_user_id,
    action,
    reason,
    assurance_level,
    metadata
  )
  VALUES (
    v_admin_id,
    v_request.user_id,
    'payout_' || p_action,
    trim(p_reason),
    'aal2',
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

REVOKE ALL ON FUNCTION public.admin_resolve_payout_request(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_resolve_payout_request(uuid, text, text, text)
  TO authenticated, service_role;

