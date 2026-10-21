ALTER TABLE public.live_replays
  ADD COLUMN IF NOT EXISTS post_id uuid,
  ALTER COLUMN expires_at DROP NOT NULL,
  ALTER COLUMN retention_days DROP NOT NULL;

ALTER TABLE public.live_replays
  DROP CONSTRAINT IF EXISTS live_replays_expiry_check,
  ADD CONSTRAINT live_replays_expiry_check
    CHECK (expires_at IS NULL OR expires_at > created_at),
  DROP CONSTRAINT IF EXISTS live_replays_retention_days_check,
  ADD CONSTRAINT live_replays_retention_days_check
    CHECK (retention_days IS NULL OR retention_days BETWEEN 1 AND 10);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'live_replays_post_id_fkey'
      AND conrelid = 'public.live_replays'::regclass
  ) THEN
    ALTER TABLE public.live_replays
      ADD CONSTRAINT live_replays_post_id_fkey
      FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS live_replays_post_id_unique
  ON public.live_replays (post_id)
  WHERE post_id IS NOT NULL;

DROP POLICY IF EXISTS live_replays_visible_until_expiry ON public.live_replays;
CREATE POLICY live_replays_visible_until_expiry
  ON public.live_replays FOR SELECT TO anon, authenticated
  USING (expires_at IS NULL OR expires_at > now());

DROP POLICY IF EXISTS live_replay_reports_insert_own ON public.live_replay_reports;
CREATE POLICY live_replay_reports_insert_own
  ON public.live_replay_reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND reporter_id <> reported_broadcaster_id
    AND EXISTS (
      SELECT 1 FROM public.live_replays r
      WHERE r.id = replay_id
        AND r.broadcaster_id = reported_broadcaster_id
        AND (r.expires_at IS NULL OR r.expires_at > now())
    )
  );
