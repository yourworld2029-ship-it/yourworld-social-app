CREATE TABLE IF NOT EXISTS public.user_post_preferences (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  preference text NOT NULL DEFAULT 'not_interested'
    CHECK (preference = 'not_interested'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS user_post_preferences_post_id_idx
  ON public.user_post_preferences (post_id);

ALTER TABLE public.user_post_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_post_preferences_owner ON public.user_post_preferences;
CREATE POLICY user_post_preferences_owner
  ON public.user_post_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_post_preferences TO authenticated;
GRANT ALL ON public.user_post_preferences TO service_role;

CREATE TABLE IF NOT EXISTS public.user_muted_creators (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, creator_id),
  CHECK (user_id <> creator_id)
);

CREATE INDEX IF NOT EXISTS user_muted_creators_creator_id_idx
  ON public.user_muted_creators (creator_id);

ALTER TABLE public.user_muted_creators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_muted_creators_owner ON public.user_muted_creators;
CREATE POLICY user_muted_creators_owner
  ON public.user_muted_creators
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_muted_creators TO authenticated;
GRANT ALL ON public.user_muted_creators TO service_role;

ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS reported_post_id uuid;

CREATE INDEX IF NOT EXISTS user_reports_reported_post_id_idx
  ON public.user_reports (reported_post_id)
  WHERE reported_post_id IS NOT NULL;
