ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS shares_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reposts_count bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.post_reel_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'native'
    CHECK (method IN ('copy', 'native', 'chat', 'moment')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_reel_reposts (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_reel_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reel_reposts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_reel_shares_insert_visible_reel
  ON public.post_reel_shares;
CREATE POLICY post_reel_shares_insert_visible_reel
  ON public.post_reel_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.posts AS p
      WHERE p.id = post_id
        AND p.kind = 'reel'
    )
  );

DROP POLICY IF EXISTS post_reel_reposts_insert_visible_reel
  ON public.post_reel_reposts;
CREATE POLICY post_reel_reposts_insert_visible_reel
  ON public.post_reel_reposts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.posts AS p
      WHERE p.id = post_id
        AND p.kind = 'reel'
        AND p.user_id <> auth.uid()
    )
  );

GRANT INSERT ON public.post_reel_shares TO authenticated;
GRANT INSERT ON public.post_reel_reposts TO authenticated;
GRANT ALL ON public.post_reel_shares TO service_role;
GRANT ALL ON public.post_reel_reposts TO service_role;

CREATE OR REPLACE FUNCTION public.bump_reel_interaction_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  affected_post_id uuid;
  delta integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_post_id := OLD.post_id;
    delta := -1;
  ELSE
    affected_post_id := NEW.post_id;
    delta := 1;
  END IF;

  IF TG_TABLE_NAME = 'likes' THEN
    UPDATE public.posts
       SET likes_count = GREATEST(0, COALESCE(likes_count, 0) + delta)
     WHERE id = affected_post_id
       AND kind = 'reel';
  ELSIF TG_TABLE_NAME = 'comments' THEN
    UPDATE public.posts
       SET comments_count = GREATEST(0, COALESCE(comments_count, 0) + delta)
     WHERE id = affected_post_id
       AND kind = 'reel';
  ELSIF TG_TABLE_NAME = 'post_reel_shares' THEN
    UPDATE public.posts
       SET shares_count = GREATEST(0, COALESCE(shares_count, 0) + delta)
     WHERE id = affected_post_id
       AND kind = 'reel';
  ELSIF TG_TABLE_NAME = 'post_reel_reposts' THEN
    UPDATE public.posts
       SET reposts_count = GREATEST(0, COALESCE(reposts_count, 0) + delta)
     WHERE id = affected_post_id
       AND kind = 'reel';
  END IF;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS sync_reel_likes_count ON public.likes;
CREATE TRIGGER sync_reel_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.bump_reel_interaction_counter();

DROP TRIGGER IF EXISTS sync_reel_comments_count ON public.comments;
CREATE TRIGGER sync_reel_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.bump_reel_interaction_counter();

DROP TRIGGER IF EXISTS sync_reel_shares_count ON public.post_reel_shares;
CREATE TRIGGER sync_reel_shares_count
  AFTER INSERT OR DELETE ON public.post_reel_shares
  FOR EACH ROW EXECUTE FUNCTION public.bump_reel_interaction_counter();

DROP TRIGGER IF EXISTS sync_reel_reposts_count ON public.post_reel_reposts;
CREATE TRIGGER sync_reel_reposts_count
  AFTER INSERT OR DELETE ON public.post_reel_reposts
  FOR EACH ROW EXECUTE FUNCTION public.bump_reel_interaction_counter();

UPDATE public.posts AS p
   SET likes_count = (
         SELECT count(*) FROM public.likes AS l WHERE l.post_id = p.id
       ),
       comments_count = (
         SELECT count(*) FROM public.comments AS c WHERE c.post_id = p.id
       ),
       shares_count = (
         SELECT count(*) FROM public.post_reel_shares AS s WHERE s.post_id = p.id
       ),
       reposts_count = (
         SELECT count(*) FROM public.post_reel_reposts AS r WHERE r.post_id = p.id
       )
 WHERE p.kind = 'reel';
