-- Long videos are rows in public.posts. Keep saves keyed by that post/video id.
-- The live likes table is shared by reels, feed posts, and long videos.
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS likes_allow_all ON public.likes;
DROP POLICY IF EXISTS likes_read_all ON public.likes;
CREATE POLICY likes_read_all
  ON public.likes FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS likes_insert_own ON public.likes;
CREATE POLICY likes_insert_own
  ON public.likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS likes_delete_own ON public.likes;
CREATE POLICY likes_delete_own
  ON public.likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.likes TO authenticated;

CREATE TABLE IF NOT EXISTS public.post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_saves_post_user_unique UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_saves_select_own ON public.post_saves;
CREATE POLICY post_saves_select_own
  ON public.post_saves FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS post_saves_insert_own ON public.post_saves;
CREATE POLICY post_saves_insert_own
  ON public.post_saves FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS post_saves_delete_own ON public.post_saves;
CREATE POLICY post_saves_delete_own
  ON public.post_saves FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.post_saves TO authenticated;
GRANT ALL ON public.post_saves TO service_role;

ALTER TABLE public.post_saves REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'post_saves'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_saves;
  END IF;
END
$$;