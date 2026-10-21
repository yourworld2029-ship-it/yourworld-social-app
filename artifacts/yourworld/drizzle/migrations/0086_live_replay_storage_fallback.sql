ALTER TABLE public.live_replays
  ALTER COLUMN stream_uid DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS storage_bucket text NOT NULL DEFAULT 'videos',
  ADD COLUMN IF NOT EXISTS retention_days smallint NOT NULL DEFAULT 10;

ALTER TABLE public.live_replays
  DROP CONSTRAINT IF EXISTS live_replays_storage_bucket_check,
  ADD CONSTRAINT live_replays_storage_bucket_check
    CHECK (storage_bucket IN ('videos', 'live-replays')),
  DROP CONSTRAINT IF EXISTS live_replays_retention_days_check,
  ADD CONSTRAINT live_replays_retention_days_check
    CHECK (retention_days BETWEEN 1 AND 10);

UPDATE public.live_replays
SET expires_at = LEAST(expires_at, created_at + make_interval(days => retention_days))
WHERE expires_at > created_at + make_interval(days => retention_days);

INSERT INTO storage.buckets (id, name, public)
VALUES ('live-replays', 'live-replays', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS live_replay_fallback_storage_owner_select ON storage.objects;
CREATE POLICY live_replay_fallback_storage_owner_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'live-replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS live_replay_fallback_storage_owner_insert ON storage.objects;
CREATE POLICY live_replay_fallback_storage_owner_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'live-replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS live_replay_fallback_storage_owner_update ON storage.objects;
CREATE POLICY live_replay_fallback_storage_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'live-replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'live-replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS live_replay_fallback_storage_owner_delete ON storage.objects;
CREATE POLICY live_replay_fallback_storage_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'live-replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

GRANT UPDATE ON public.live_replays TO authenticated;

DROP POLICY IF EXISTS live_replays_owner_update ON public.live_replays;
CREATE POLICY live_replays_owner_update
  ON public.live_replays FOR UPDATE TO authenticated
  USING (broadcaster_id = auth.uid())
  WITH CHECK (
    broadcaster_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.live_streams s
      WHERE s.id = live_replays.stream_id
        AND s.broadcaster_id = auth.uid()
        AND s.status = 'ended'
    )
  );
