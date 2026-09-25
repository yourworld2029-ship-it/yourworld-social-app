-- Live broadcast metadata and server-timed audience analytics.
-- Deliberately contains no media, storage, monetization, or wallet state.

CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcaster_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  peak_viewer_count integer NOT NULL DEFAULT 0 CHECK (peak_viewer_count >= 0),
  CONSTRAINT live_streams_ended_at_check CHECK (
    (status = 'live' AND ended_at IS NULL)
    OR (status = 'ended' AND ended_at IS NOT NULL AND ended_at >= started_at)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS live_streams_one_active_broadcaster_idx
  ON public.live_streams (broadcaster_id) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS live_streams_status_started_idx
  ON public.live_streams (status, started_at DESC);
CREATE INDEX IF NOT EXISTS live_streams_broadcaster_started_idx
  ON public.live_streams (broadcaster_id, started_at DESC);
COMMENT ON TABLE public.live_streams IS 'Metadata-only live broadcasts; media is intentionally stored elsewhere.';

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS live_streams_authenticated_select ON public.live_streams;
CREATE POLICY live_streams_authenticated_select ON public.live_streams
  FOR SELECT TO authenticated
  USING (status = 'live' OR broadcaster_id = auth.uid());
REVOKE ALL ON public.live_streams FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.live_streams TO authenticated;

CREATE TABLE IF NOT EXISTS public.live_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS live_comments_stream_created_idx
  ON public.live_comments (stream_id, created_at ASC);
COMMENT ON TABLE public.live_comments IS 'Text-only comments for currently live streams.';
ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS live_comments_live_select ON public.live_comments;
DROP POLICY IF EXISTS live_comments_live_insert ON public.live_comments;
CREATE POLICY live_comments_live_select ON public.live_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.live_streams s
    WHERE s.id = stream_id AND s.status = 'live'
  ));
CREATE POLICY live_comments_live_insert ON public.live_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.live_streams s
      WHERE s.id = stream_id AND s.status = 'live'
    )
  );
REVOKE ALL ON public.live_comments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.live_comments TO authenticated;

-- Raw watch state is private; only the aggregate RPC below is exposed.
CREATE TABLE IF NOT EXISTS public.live_view_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stream_id, viewer_id)
);
CREATE INDEX IF NOT EXISTS live_view_sessions_stream_idx
  ON public.live_view_sessions (stream_id);
ALTER TABLE public.live_view_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_view_sessions FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.live_watch_events (
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minute_bucket timestamptz NOT NULL,
  watched_seconds integer NOT NULL DEFAULT 0 CHECK (watched_seconds BETWEEN 0 AND 60),
  PRIMARY KEY (stream_id, viewer_id, minute_bucket)
);
CREATE INDEX IF NOT EXISTS live_watch_events_stream_minute_idx
  ON public.live_watch_events (stream_id, minute_bucket);
COMMENT ON TABLE public.live_watch_events IS 'Server-measured, compact watch seconds capped at 60 per viewer/stream/minute.';
ALTER TABLE public.live_watch_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_watch_events FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.start_live_stream(_title text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _broadcaster uuid := auth.uid();
  _id uuid;
BEGIN
  IF _broadcaster IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _title IS NULL OR char_length(btrim(_title)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Title must be between 1 and 200 characters';
  END IF;
  INSERT INTO public.live_streams (broadcaster_id, title)
  VALUES (_broadcaster, btrim(_title))
  RETURNING id INTO _id;
  RETURN _id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Broadcaster already has an active stream';
END;
$$;

CREATE OR REPLACE FUNCTION public.end_live_stream(_stream_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _started timestamptz;
  _peak integer;
  _ended timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  UPDATE public.live_streams
  SET status = 'ended', ended_at = _ended
  WHERE id = _stream_id AND broadcaster_id = auth.uid() AND status = 'live'
  RETURNING started_at, peak_viewer_count INTO _started, _peak;
  IF _started IS NULL THEN RAISE EXCEPTION 'Active stream not found'; END IF;
  RETURN jsonb_build_object(
    'duration_seconds', greatest(0, floor(extract(epoch FROM (_ended - _started)))::integer),
    'peak_viewers', _peak
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_live_stream_peak(_stream_id uuid, _peak_viewers integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _peak_viewers IS NULL OR _peak_viewers < 0 OR _peak_viewers > 100000 THEN
    RAISE EXCEPTION 'Invalid peak viewer count';
  END IF;
  UPDATE public.live_streams
  SET peak_viewer_count = greatest(peak_viewer_count, _peak_viewers)
  WHERE id = _stream_id AND broadcaster_id = auth.uid() AND status = 'live';
  IF NOT FOUND THEN RAISE EXCEPTION 'Active stream not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_live_view_session(_stream_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _viewer uuid := auth.uid();
  _session uuid;
BEGIN
  IF _viewer IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.live_streams
    WHERE id = _stream_id AND status = 'live' AND broadcaster_id <> _viewer
  ) THEN RAISE EXCEPTION 'Stream is not available for viewing'; END IF;
  INSERT INTO public.live_view_sessions (stream_id, viewer_id)
  VALUES (_stream_id, _viewer)
  ON CONFLICT (stream_id, viewer_id) DO UPDATE
    SET started_at = now(), last_heartbeat_at = now()
  RETURNING id INTO _session;
  RETURN _session;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_live_view_heartbeat(_session_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _viewer uuid := auth.uid();
  _stream uuid;
  _last timestamptz;
  _credited integer;
  _now timestamptz := now();
  _bucket timestamptz;
BEGIN
  IF _viewer IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT v.stream_id, v.last_heartbeat_at INTO _stream, _last
  FROM public.live_view_sessions v
  JOIN public.live_streams s ON s.id = v.stream_id
  WHERE v.id = _session_id AND v.viewer_id = _viewer
    AND s.status = 'live' AND s.broadcaster_id <> _viewer
  FOR UPDATE OF v;
  IF _stream IS NULL THEN RETURN 0; END IF;
  _credited := floor(extract(epoch FROM (_now - _last)))::integer;
  UPDATE public.live_view_sessions SET last_heartbeat_at = _now WHERE id = _session_id;
  IF _credited < 1 THEN RETURN 0; END IF;
  _credited := least(_credited, 15);
  _bucket := date_trunc('minute', _now);
  INSERT INTO public.live_watch_events (stream_id, viewer_id, minute_bucket, watched_seconds)
  VALUES (_stream, _viewer, _bucket, least(_credited, 60))
  ON CONFLICT (stream_id, viewer_id, minute_bucket) DO UPDATE
    SET watched_seconds = least(60, public.live_watch_events.watched_seconds + EXCLUDED.watched_seconds);
  RETURN _credited;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_channel_live_watch_hours(
  _channel_id uuid, _period_start timestamptz
) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(e.watched_seconds), 0)::numeric / 3600
  FROM public.live_watch_events e
  JOIN public.live_streams s ON s.id = e.stream_id
  WHERE _channel_id = auth.uid()
    AND s.broadcaster_id = _channel_id
    AND e.minute_bucket >= _period_start;
$$;

REVOKE ALL ON FUNCTION public.start_live_stream(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.end_live_stream(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_live_stream_peak(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_live_view_session(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_live_view_heartbeat(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_channel_live_watch_hours(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_live_stream(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_live_stream(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_live_stream_peak(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_live_view_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_live_view_heartbeat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_channel_live_watch_hours(uuid, timestamptz) TO authenticated;

-- Room signaling, comments, and active-room refreshes use broadcast channels.
-- This migration deliberately avoids changing ownership-managed Realtime
-- system tables or the managed supabase_realtime publication.