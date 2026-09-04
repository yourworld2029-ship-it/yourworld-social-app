-- Instagram-style threaded replies and per-user comment likes.
-- The app uses public.comments in the live schema; this migration preserves
-- existing rows and only adds the interaction columns and child table.
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS comments_post_parent_created_idx
  ON public.comments (post_id, parent_comment_id, created_at);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comment_likes_comment_user_unique UNIQUE (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS comment_likes_comment_idx
  ON public.comment_likes (comment_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comment_likes_read_all ON public.comment_likes;
CREATE POLICY comment_likes_read_all
  ON public.comment_likes FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS comment_likes_insert_own ON public.comment_likes;
CREATE POLICY comment_likes_insert_own
  ON public.comment_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS comment_likes_delete_own ON public.comment_likes;
CREATE POLICY comment_likes_delete_own
  ON public.comment_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.comment_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;

CREATE OR REPLACE FUNCTION public.sync_comment_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments
      SET likes_count = likes_count + 1
      WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_comment_likes_count_trg ON public.comment_likes;
CREATE TRIGGER sync_comment_likes_count_trg
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_likes_count();

UPDATE public.comments AS c
SET likes_count = counts.total
FROM (
  SELECT comment_id, count(*)::integer AS total
  FROM public.comment_likes
  GROUP BY comment_id
) AS counts
WHERE c.id = counts.comment_id;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'comment_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
  END IF;
END
$$;