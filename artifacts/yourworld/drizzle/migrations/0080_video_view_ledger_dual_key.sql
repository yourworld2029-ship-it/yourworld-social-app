-- Video/Reel views are credited once per account and once per persistent device.
-- Playback progress is observed by server-timed sessions before a ledger insert.
CREATE TABLE IF NOT EXISTS public.video_view_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  device_fingerprint text NOT NULL,
  watched_duration_seconds integer NOT NULL DEFAULT 0
    CHECK (watched_duration_seconds >= 0 AND watched_duration_seconds <= 3600),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT video_view_ledger_device_fingerprint_format
    CHECK (device_fingerprint ~ '^[0-9a-f]{64}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_video
  ON public.video_view_ledger (video_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_device_video
  ON public.video_view_ledger (video_id, device_fingerprint);

CREATE INDEX IF NOT EXISTS video_view_ledger_created_at_idx
  ON public.video_view_ledger (created_at DESC);

CREATE TABLE IF NOT EXISTS public.video_view_validation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  device_fingerprint text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  last_position_seconds numeric NOT NULL DEFAULT 0
    CHECK (last_position_seconds >= 0),
  continuous_seconds integer NOT NULL DEFAULT 0
    CHECK (continuous_seconds >= 0),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT video_view_validation_fingerprint_format
    CHECK (device_fingerprint ~ '^[0-9a-f]{64}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS video_view_validation_one_active_device
  ON public.video_view_validation_sessions (device_fingerprint)
  WHERE is_active;

CREATE UNIQUE INDEX IF NOT EXISTS video_view_validation_one_active_user
  ON public.video_view_validation_sessions (user_id)
  WHERE is_active AND user_id IS NOT NULL;

ALTER TABLE public.video_view_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_view_validation_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.video_view_ledger FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.video_view_validation_sessions FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.start_valid_video_view_session(
  p_video_id uuid,
  p_device_fingerprint text,
  p_video_position_seconds numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_kind text;
  v_video_access text;
  v_session_id uuid := gen_random_uuid();
BEGIN
  IF p_video_id IS NULL
     OR p_device_fingerprint IS NULL
     OR p_device_fingerprint !~ '^[0-9a-f]{64}$'
     OR p_video_position_seconds IS NULL
     OR p_video_position_seconds < 0 THEN
    RETURN NULL;
  END IF;

  SELECT p.user_id, p.kind, p.video_access
  INTO v_owner_id, v_kind, v_video_access
  FROM public.posts p
  WHERE p.id = p_video_id;

  IF NOT FOUND OR v_kind NOT IN ('video', 'reel') THEN
    RETURN NULL;
  END IF;

  IF v_user_id IS NOT NULL AND v_owner_id = v_user_id THEN
    RETURN NULL;
  END IF;

  IF v_kind = 'video'
     AND v_video_access <> 'public'
     AND v_owner_id IS DISTINCT FROM v_user_id
     AND NOT EXISTS (
       SELECT 1
       FROM public.video_access_grants g
       WHERE g.post_id = p_video_id
         AND g.user_id = v_user_id
         AND g.access_type = v_video_access
         AND (g.expires_at IS NULL OR g.expires_at > now())
     ) THEN
    RETURN NULL;
  END IF;

  -- Serialize starts for both identity keys so two tabs/devices cannot create
  -- parallel sessions around the active-session indexes.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('video-view-user:' || coalesce(v_user_id::text, 'guest'), 0)
  );
  PERFORM pg_advisory_xact_lock(
    hashtextextended('video-view-device:' || p_device_fingerprint, 0)
  );

  UPDATE public.video_view_validation_sessions s
  SET is_active = false
  WHERE s.is_active
    AND (
      s.device_fingerprint = p_device_fingerprint
      OR (v_user_id IS NOT NULL AND s.user_id = v_user_id)
    );

  INSERT INTO public.video_view_validation_sessions (
    id,
    video_id,
    user_id,
    device_fingerprint,
    last_position_seconds
  )
  VALUES (
    v_session_id,
    p_video_id,
    v_user_id,
    p_device_fingerprint,
    p_video_position_seconds
  );

  RETURN v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_valid_video_view_heartbeat(
  p_session_id uuid,
  p_video_position_seconds numeric,
  p_is_playing boolean
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session public.video_view_validation_sessions%ROWTYPE;
  v_elapsed numeric;
  v_position_delta numeric;
  v_next_seconds integer;
BEGIN
  IF p_session_id IS NULL OR p_video_position_seconds IS NULL
     OR p_video_position_seconds < 0 THEN
    RETURN 0;
  END IF;

  SELECT s.*
  INTO v_session
  FROM public.video_view_validation_sessions s
  WHERE s.id = p_session_id
    AND s.user_id IS NOT DISTINCT FROM v_user_id
    AND s.is_active
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_elapsed := extract(epoch FROM (now() - v_session.last_heartbeat_at));
  v_position_delta := p_video_position_seconds - v_session.last_position_seconds;

  IF NOT coalesce(p_is_playing, false)
     OR v_elapsed < 1
     OR v_elapsed > 4.5
     OR v_position_delta < 0.25
     OR v_position_delta > (v_elapsed * 2.75) + 1.0 THEN
    UPDATE public.video_view_validation_sessions
    SET last_heartbeat_at = now(),
        last_position_seconds = p_video_position_seconds,
        continuous_seconds = 0
    WHERE id = p_session_id;
    RETURN 0;
  END IF;

  v_next_seconds := LEAST(
    3600,
    v_session.continuous_seconds + GREATEST(1, floor(v_elapsed)::integer)
  );

  UPDATE public.video_view_validation_sessions
  SET last_heartbeat_at = now(),
      last_position_seconds = p_video_position_seconds,
      continuous_seconds = v_next_seconds
  WHERE id = p_session_id;

  RETURN v_next_seconds;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_valid_video_view(
  p_video_id uuid,
  p_user_id uuid,
  p_device_fingerprint text,
  p_watch_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_session public.video_view_validation_sessions%ROWTYPE;
  v_owner_id uuid;
  v_kind text;
  v_video_access text;
  v_verified_seconds integer;
  v_ledger_id uuid;
BEGIN
  IF p_video_id IS NULL
     OR p_user_id IS DISTINCT FROM v_actor_id
     OR p_device_fingerprint IS NULL
     OR p_device_fingerprint !~ '^[0-9a-f]{64}$'
     OR p_watch_seconds IS NULL
     OR p_watch_seconds < 12
     OR p_watch_seconds > 3600 THEN
    RETURN false;
  END IF;

  SELECT s.*
  INTO v_session
  FROM public.video_view_validation_sessions s
  WHERE s.video_id = p_video_id
    AND s.user_id IS NOT DISTINCT FROM v_actor_id
    AND s.device_fingerprint = p_device_fingerprint
    AND s.is_active
    AND s.continuous_seconds >= 12
    AND s.last_heartbeat_at >= now() - interval '5 seconds'
  ORDER BY s.started_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT p.user_id, p.kind, p.video_access
  INTO v_owner_id, v_kind, v_video_access
  FROM public.posts p
  WHERE p.id = p_video_id;

  IF NOT FOUND OR v_kind NOT IN ('video', 'reel')
     OR (v_actor_id IS NOT NULL AND v_owner_id = v_actor_id) THEN
    UPDATE public.video_view_validation_sessions
    SET is_active = false
    WHERE id = v_session.id;
    RETURN false;
  END IF;

  IF v_kind = 'video'
     AND v_video_access <> 'public'
     AND v_owner_id IS DISTINCT FROM v_actor_id
     AND NOT EXISTS (
       SELECT 1
       FROM public.video_access_grants g
       WHERE g.post_id = p_video_id
         AND g.user_id = v_actor_id
         AND g.access_type = v_video_access
         AND (g.expires_at IS NULL OR g.expires_at > now())
     ) THEN
    UPDATE public.video_view_validation_sessions
    SET is_active = false
    WHERE id = v_session.id;
    RETURN false;
  END IF;

  v_verified_seconds := LEAST(
    p_watch_seconds,
    v_session.continuous_seconds,
    3600
  );
  IF v_verified_seconds < 12 THEN
    RETURN false;
  END IF;

  INSERT INTO public.video_view_ledger (
    video_id,
    user_id,
    device_fingerprint,
    watched_duration_seconds
  )
  VALUES (
    p_video_id,
    v_actor_id,
    p_device_fingerprint,
    v_verified_seconds
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ledger_id;

  UPDATE public.video_view_validation_sessions
  SET is_active = false
  WHERE id = v_session.id;

  IF v_ledger_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_video_id
    AND kind IN ('video', 'reel');

  RETURN FOUND;
END;
$$;

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
  SELECT COALESCE(SUM(l.watched_duration_seconds), 0)::numeric / 3600
  FROM public.video_view_ledger l
  JOIN public.posts p ON p.id = l.video_id
  WHERE _channel_id = auth.uid()
    AND p.user_id = _channel_id
    AND p.kind IN ('video', 'reel')
    AND l.created_at >= _period_start;
$$;

-- Keep the older user-only view RPC for ordinary posts and Moments, but prevent
-- it from bypassing the dual-key, timed video/Reel ledger.
CREATE OR REPLACE FUNCTION public.register_unique_view(
  _content_id text,
  _content_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_found boolean := false;
BEGIN
  IF auth.uid() IS NULL
     OR _content_id IS NULL
     OR _content_type NOT IN ('post', 'moment') THEN
    RETURN false;
  END IF;

  INSERT INTO public.unique_views (user_id, content_id, content_type)
  VALUES (auth.uid(), _content_id, _content_type)
  ON CONFLICT (user_id, content_id, content_type) DO NOTHING;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF _content_type = 'moment' THEN
    UPDATE public.posts
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id::text = _content_id AND kind = 'moment';
  ELSE
    UPDATE public.posts
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id::text = _content_id
      AND (
        kind = 'post'
        OR (_content_type = 'post' AND (kind IS NULL OR kind NOT IN ('reel', 'video')))
      );
  END IF;
  target_found := FOUND;

  IF NOT target_found THEN
    DELETE FROM public.unique_views
    WHERE user_id = auth.uid()
      AND content_id = _content_id
      AND content_type = _content_type;
  END IF;
  RETURN target_found;
END;
$$;

REVOKE ALL ON FUNCTION public.start_valid_video_view_session(uuid, text, numeric)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_valid_video_view_heartbeat(uuid, numeric, boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_valid_video_view(uuid, uuid, text, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_channel_watch_hours(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.register_unique_view(text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.start_valid_video_view_session(uuid, text, numeric)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_valid_video_view_heartbeat(uuid, numeric, boolean)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_valid_video_view(uuid, uuid, text, integer)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_channel_watch_hours(uuid, timestamptz)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_unique_view(text, text)
  TO authenticated;
