-- A replay contributes live-room watch time only after the stream ended and
-- while the saved profile replay remains active.
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
    AND e.minute_bucket >= _period_start
    AND lower(COALESCE(p.kind, '')) IN ('video', 'long_video')
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'is_deleted')), ''), 'false') = 'false'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'visibility')), ''), 'public') = 'public'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'video_access')), ''), 'public') = 'public';
$$;

REVOKE ALL ON FUNCTION public.creator_saved_public_live_watch_hours(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
