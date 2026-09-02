-- Store only server-validated playback increments as append-only events so
-- analytics can aggregate watch time by the period it was actually watched.
CREATE TABLE IF NOT EXISTS public.video_watch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watched_seconds integer NOT NULL CHECK (watched_seconds > 0 AND watched_seconds <= 3600),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_watch_events_post_created_idx
  ON public.video_watch_events (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS video_watch_events_viewer_created_idx
  ON public.video_watch_events (viewer_id, created_at DESC);

ALTER TABLE public.video_watch_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Viewers can record their own watch time" ON public.video_watch_events;
REVOKE ALL ON public.video_watch_events FROM anon, authenticated;

-- One active server-timed session per viewer prevents parallel tabs or direct
-- API calls from multiplying elapsed time.
CREATE TABLE IF NOT EXISTS public.video_watch_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_watch_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.video_watch_sessions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.start_video_watch_session(_post_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _viewer_id uuid := auth.uid();
  _session_id uuid := gen_random_uuid();
BEGIN
  IF _viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = _post_id
      AND p.kind = 'video'
      AND p.review_status = 'approved'
      AND NOT p.archived
      AND (p.scheduled_at IS NULL OR p.scheduled_at <= now())
      AND public.can_view_post(p.id)
  ) THEN
    RAISE EXCEPTION 'Video is not available';
  END IF;

  INSERT INTO public.video_watch_sessions (
    id,
    post_id,
    viewer_id,
    started_at,
    last_heartbeat_at
  )
  VALUES (_session_id, _post_id, _viewer_id, now(), now())
  ON CONFLICT (viewer_id) DO UPDATE
  SET
    id = EXCLUDED.id,
    post_id = EXCLUDED.post_id,
    started_at = EXCLUDED.started_at,
    last_heartbeat_at = EXCLUDED.last_heartbeat_at;

  RETURN _session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_video_watch_heartbeat(_session_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _viewer_id uuid := auth.uid();
  _post_id uuid;
  _last_heartbeat_at timestamptz;
  _duration_seconds integer;
  _elapsed_seconds integer;
  _daily_seconds integer;
  _daily_budget integer;
  _credited_seconds integer;
BEGIN
  IF _viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT s.post_id, s.last_heartbeat_at, p.duration_seconds
  INTO _post_id, _last_heartbeat_at, _duration_seconds
  FROM public.video_watch_sessions s
  JOIN public.posts p ON p.id = s.post_id
  WHERE s.id = _session_id
    AND s.viewer_id = _viewer_id
    AND p.kind = 'video'
    AND p.review_status = 'approved'
    AND NOT p.archived
    AND (p.scheduled_at IS NULL OR p.scheduled_at <= now())
    AND public.can_view_post(p.id)
  FOR UPDATE OF s;

  IF _post_id IS NULL THEN
    RETURN 0;
  END IF;

  _elapsed_seconds := floor(extract(epoch FROM (now() - _last_heartbeat_at)))::integer;

  UPDATE public.video_watch_sessions
  SET last_heartbeat_at = now()
  WHERE id = _session_id;

  -- Heartbeats are expected every ten played seconds. Crediting at most 15
  -- server-observed seconds prevents delayed or repeated requests from
  -- manufacturing time.
  IF _elapsed_seconds < 1 THEN
    RETURN 0;
  END IF;
  _credited_seconds := least(_elapsed_seconds, 15);

  -- Count at most three complete watches per viewer/video/day. Unknown media
  -- duration receives a conservative one-hour budget per watch.
  _daily_budget := greatest(coalesce(_duration_seconds, 3600), 60) * 3;
  SELECT coalesce(sum(e.watched_seconds), 0)::integer
  INTO _daily_seconds
  FROM public.video_watch_events e
  WHERE e.viewer_id = _viewer_id
    AND e.post_id = _post_id
    AND e.created_at >= date_trunc('day', now());

  _credited_seconds := least(_credited_seconds, greatest(_daily_budget - _daily_seconds, 0));
  IF _credited_seconds < 1 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.video_watch_events (post_id, viewer_id, watched_seconds)
  VALUES (_post_id, _viewer_id, _credited_seconds);

  RETURN _credited_seconds;
END;
$$;

REVOKE ALL ON FUNCTION public.start_video_watch_session(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_video_watch_heartbeat(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_video_watch_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_video_watch_heartbeat(uuid) TO authenticated;

-- Return only an aggregate for the signed-in channel owner. Raw watch events
-- remain private to protect viewer activity.
CREATE OR REPLACE FUNCTION public.get_channel_watch_hours(
  _channel_id uuid,
  _period_start timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(e.watched_seconds), 0)::numeric / 3600
  FROM public.video_watch_events e
  JOIN public.posts p ON p.id = e.post_id
  WHERE _channel_id = auth.uid()
    AND p.user_id = _channel_id
    AND p.kind = 'video'
    AND p.review_status = 'approved'
    AND e.created_at >= _period_start;
$$;

REVOKE ALL ON FUNCTION public.get_channel_watch_hours(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_channel_watch_hours(uuid, timestamptz) TO authenticated;