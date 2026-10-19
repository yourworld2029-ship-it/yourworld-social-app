CREATE TABLE IF NOT EXISTS public.live_replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL UNIQUE REFERENCES public.live_streams(id) ON DELETE CASCADE,
  broadcaster_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  media_url text NOT NULL,
  stream_uid text NOT NULL,
  source_path text NOT NULL,
  poster_url text,
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  original_width integer NOT NULL CHECK (original_width > 0),
  original_height integer NOT NULL CHECK (original_height > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 days'),
  CONSTRAINT live_replays_expiry_check CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS live_replays_profile_expiry_idx
  ON public.live_replays (broadcaster_id, expires_at DESC, created_at DESC);
ALTER TABLE public.live_replays ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_replays FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.live_replays TO anon, authenticated;
GRANT INSERT, DELETE ON public.live_replays TO authenticated;

CREATE POLICY live_replays_visible_until_expiry
  ON public.live_replays FOR SELECT TO anon, authenticated
  USING (expires_at > now());
CREATE POLICY live_replays_owner_insert
  ON public.live_replays FOR INSERT TO authenticated
  WITH CHECK (
    broadcaster_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.live_streams s
      WHERE s.id = stream_id
        AND s.broadcaster_id = auth.uid()
        AND s.status = 'ended'
    )
  );
CREATE POLICY live_replays_owner_delete
  ON public.live_replays FOR DELETE TO authenticated
  USING (broadcaster_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.live_replay_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_id uuid REFERENCES public.live_replays(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_broadcaster_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN (
    'Inappropriate content / Nudity',
    'Spam or Scam',
    'Hate speech or Harassment',
    'Intellectual Property / Copyright'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (replay_id, reporter_id)
);
ALTER TABLE public.live_replay_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_replay_reports FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.live_replay_reports TO authenticated;
CREATE POLICY live_replay_reports_insert_own
  ON public.live_replay_reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND reporter_id <> reported_broadcaster_id
    AND EXISTS (
      SELECT 1 FROM public.live_replays r
      WHERE r.id = replay_id
        AND r.broadcaster_id = reported_broadcaster_id
        AND r.expires_at > now()
    )
  );
