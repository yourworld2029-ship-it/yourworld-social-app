-- A creator's watch time is eligible only while their account is public.
-- Keep privacy transitions so private-period time stays excluded even after
-- the account is made public again.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_private = false
WHERE is_private IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN is_private SET DEFAULT false,
  ALTER COLUMN is_private SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.profile_privacy_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_private boolean NOT NULL,
  changed_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS profile_privacy_history_user_changed_idx
  ON public.profile_privacy_history (user_id, changed_at DESC, id DESC);

ALTER TABLE public.profile_privacy_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_privacy_history FROM PUBLIC, anon, authenticated;

-- The privacy toggle was not persisted before this migration, so existing
-- accounts begin with a public baseline; subsequent changes are recorded below.
INSERT INTO public.profile_privacy_history (user_id, is_private, changed_at)
SELECT p.id, p.is_private, '-infinity'::timestamptz
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profile_privacy_history h
  WHERE h.user_id = p.id
);

CREATE OR REPLACE FUNCTION public.record_profile_privacy_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profile_privacy_history (user_id, is_private, changed_at)
    VALUES (NEW.id, NEW.is_private, COALESCE(NEW.created_at, clock_timestamp()));
  ELSIF NEW.is_private IS DISTINCT FROM OLD.is_private THEN
    INSERT INTO public.profile_privacy_history (user_id, is_private, changed_at)
    VALUES (NEW.id, NEW.is_private, clock_timestamp());
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.record_profile_privacy_history()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_privacy_history_after_insert ON public.profiles;
CREATE TRIGGER profiles_privacy_history_after_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.record_profile_privacy_history();

DROP TRIGGER IF EXISTS profiles_privacy_history_after_update ON public.profiles;
CREATE TRIGGER profiles_privacy_history_after_update
  AFTER UPDATE OF is_private ON public.profiles
  FOR EACH ROW
  WHEN (OLD.is_private IS DISTINCT FROM NEW.is_private)
  EXECUTE FUNCTION public.record_profile_privacy_history();

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
  JOIN public.profiles owner ON owner.id = p.user_id
  WHERE p.user_id = _channel_id
    AND lower(COALESCE(p.kind, '')) IN ('video', 'long_video')
    AND l.user_id IS NOT NULL
    AND l.watched_duration_seconds > 0
    AND l.created_at >= _period_start
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'is_deleted')), ''), 'false') = 'false'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'visibility')), ''), 'public') = 'public'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'video_access')), ''), 'public') = 'public'
    AND COALESCE((
      SELECT h.is_private
      FROM public.profile_privacy_history h
      WHERE h.user_id = owner.id
        AND h.changed_at <= l.created_at
      ORDER BY h.changed_at DESC, h.id DESC
      LIMIT 1
    ), false) = false;
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
  JOIN public.profiles owner ON owner.id = p.user_id
  WHERE s.status = 'ended'
    AND (r.expires_at IS NULL OR r.expires_at > now())
    AND e.viewer_id IS NOT NULL
    AND e.watched_seconds > 0
    AND e.minute_bucket >= _period_start
    AND lower(COALESCE(p.kind, '')) IN ('video', 'long_video')
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'is_deleted')), ''), 'false') = 'false'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'visibility')), ''), 'public') = 'public'
    AND COALESCE(NULLIF(lower(btrim(to_jsonb(p) ->> 'video_access')), ''), 'public') = 'public'
    -- Live events are minute-bucketed; count a bucket only if the account
    -- stayed public for the whole minute.
    AND COALESCE((
      SELECT h.is_private
      FROM public.profile_privacy_history h
      WHERE h.user_id = owner.id
        AND h.changed_at <= e.minute_bucket
      ORDER BY h.changed_at DESC, h.id DESC
      LIMIT 1
    ), false) = false
    AND NOT EXISTS (
      SELECT 1
      FROM public.profile_privacy_history h
      WHERE h.user_id = owner.id
        AND h.is_private
        AND h.changed_at > e.minute_bucket
        AND h.changed_at < e.minute_bucket + interval '1 minute'
    );
$$;
