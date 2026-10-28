-- Monetization watch time and video ad settlements require validated,
-- authenticated audience activity.

CREATE OR REPLACE FUNCTION public.creator_public_video_watch_hours(
  _channel_id uuid,
  _period_start timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(l.watched_duration_seconds), 0)::numeric / 3600
  FROM public.video_view_ledger l
  JOIN public.posts p ON p.id = l.video_id
  WHERE p.user_id = _channel_id
    AND lower(COALESCE(p.kind, '')) IN ('video', 'long_video')
    AND l.user_id IS NOT NULL
    AND l.watched_duration_seconds > 0
    AND l.created_at >= _period_start
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'is_deleted')), ''), 'false') = 'false'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'visibility')), ''), 'public') = 'public'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'video_access')), ''), 'public') = 'public';
$$;

CREATE OR REPLACE FUNCTION public.creator_saved_public_live_watch_hours(
  _channel_id uuid,
  _period_start timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(e.watched_seconds), 0)::numeric / 3600
  FROM public.live_watch_events e
  JOIN public.live_streams s ON s.id = e.stream_id
  JOIN public.live_replays r
    ON r.stream_id = s.id
   AND r.broadcaster_id = _channel_id
   AND r.post_id IS NOT NULL
  JOIN public.posts p
    ON p.id = r.post_id
   AND p.user_id = _channel_id
  WHERE s.status = 'ended'
    AND (r.expires_at IS NULL OR r.expires_at > now())
    AND e.viewer_id IS NOT NULL
    AND e.watched_seconds > 0
    AND e.minute_bucket >= _period_start
    AND lower(COALESCE(p.kind, '')) IN ('video', 'long_video')
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'is_deleted')), ''), 'false') = 'false'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'visibility')), ''), 'public') = 'public'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'video_access')), ''), 'public') = 'public';
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_earning public.creator_earnings;
  v_expected_currency text;
  v_post public.posts%ROWTYPE;
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

  SELECT *
  INTO v_post
  FROM public.posts
  WHERE id = p_post_id
  FOR SHARE;

  IF NOT FOUND
     OR v_post.user_id IS DISTINCT FROM p_user_id
     OR lower(COALESCE(v_post.kind, '')) NOT IN ('video', 'long_video')
     OR COALESCE(NULLIF(lower(btrim(to_jsonb(v_post) ->> 'is_deleted')), ''), 'false') <> 'false'
     OR COALESCE(NULLIF(lower(btrim(to_jsonb(v_post) ->> 'visibility')), ''), 'public') <> 'public'
     OR COALESCE(NULLIF(lower(btrim(v_post.video_access)), ''), 'public') <> 'public'
     OR NOT EXISTS (
       SELECT 1
       FROM public.video_view_ledger l
       WHERE l.video_id = p_post_id
         AND l.user_id IS NOT NULL
         AND l.watched_duration_seconds > 0
     ) THEN
    RAISE EXCEPTION 'Video ad settlement requires an active public video with verified logged-in watch activity';
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

REVOKE ALL ON FUNCTION public.record_video_ad_earning(uuid, uuid, numeric, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_video_ad_earning(uuid, uuid, numeric, text, text)
  TO service_role;
