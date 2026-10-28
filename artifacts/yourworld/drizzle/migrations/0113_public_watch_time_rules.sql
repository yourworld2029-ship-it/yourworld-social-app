-- Creator watch hours count only active public long videos and live streams
-- whose replay was saved and linked to a public profile video.

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
  WHERE e.minute_bucket >= _period_start
    AND lower(COALESCE(p.kind, '')) IN ('video', 'long_video')
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'is_deleted')), ''), 'false') = 'false'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'visibility')), ''), 'public') = 'public'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'video_access')), ''), 'public') = 'public';
$$;

CREATE OR REPLACE FUNCTION public.creator_public_watch_hours(
  _channel_id uuid,
  _period_start timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.creator_public_video_watch_hours(_channel_id, _period_start)
       + public.creator_saved_public_live_watch_hours(_channel_id, _period_start);
$$;

REVOKE ALL ON FUNCTION public.creator_public_video_watch_hours(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.creator_saved_public_live_watch_hours(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.creator_public_watch_hours(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_channel_watch_hours(
  _channel_id uuid,
  _period_start timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT CASE
    WHEN _channel_id = auth.uid()
      THEN public.creator_public_watch_hours(_channel_id, _period_start)
    ELSE 0::numeric
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_channel_live_watch_hours(
  _channel_id uuid,
  _period_start timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT CASE
    WHEN _channel_id = auth.uid()
      THEN public.creator_saved_public_live_watch_hours(_channel_id, _period_start)
    ELSE 0::numeric
  END;
$$;

REVOKE ALL ON FUNCTION public.get_channel_watch_hours(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_channel_live_watch_hours(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_channel_watch_hours(uuid, timestamptz)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_channel_live_watch_hours(uuid, timestamptz)
  TO authenticated;

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

  v_watch_hours := public.creator_public_watch_hours(NEW.user_id, 'epoch'::timestamptz);

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
