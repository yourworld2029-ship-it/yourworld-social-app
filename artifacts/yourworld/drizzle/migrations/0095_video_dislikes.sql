CREATE TABLE IF NOT EXISTS public.post_dislikes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_dislikes_post_user_unique UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_dislikes_select_own ON public.post_dislikes;
CREATE POLICY post_dislikes_select_own
  ON public.post_dislikes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS post_dislikes_insert_own ON public.post_dislikes;
CREATE POLICY post_dislikes_insert_own
  ON public.post_dislikes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS post_dislikes_delete_own ON public.post_dislikes;
CREATE POLICY post_dislikes_delete_own
  ON public.post_dislikes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.post_dislikes TO authenticated;
GRANT ALL ON public.post_dislikes TO service_role;

CREATE OR REPLACE FUNCTION public.get_video_reaction_state(p_post_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT pg_catalog.jsonb_build_object(
    'likeCount', (
      SELECT pg_catalog.count(*)
      FROM public.likes
      WHERE post_id = p_post_id
    ),
    'dislikeCount', (
      SELECT pg_catalog.count(*)
      FROM public.post_dislikes
      WHERE post_id = p_post_id
    ),
    'liked', EXISTS (
      SELECT 1
      FROM public.likes
      WHERE post_id = p_post_id
        AND user_id = auth.uid()
    ),
    'disliked', EXISTS (
      SELECT 1
      FROM public.post_dislikes
      WHERE post_id = p_post_id
        AND user_id = auth.uid()
    )
  );
$function$;

REVOKE ALL ON FUNCTION public.get_video_reaction_state(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_video_reaction_state(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_video_reaction(
  p_post_id uuid,
  p_reaction text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  IF p_reaction IS NULL OR p_reaction NOT IN ('like', 'dislike', 'none') THEN
    RAISE EXCEPTION 'Invalid video reaction'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.posts
    WHERE id = p_post_id
  ) THEN
    RAISE EXCEPTION 'Post not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_reaction = 'like' THEN
    DELETE FROM public.post_dislikes
    WHERE post_id = p_post_id
      AND user_id = v_user_id;

    INSERT INTO public.likes (post_id, user_id)
    VALUES (p_post_id, v_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  ELSIF p_reaction = 'dislike' THEN
    DELETE FROM public.likes
    WHERE post_id = p_post_id
      AND user_id = v_user_id;

    INSERT INTO public.post_dislikes (post_id, user_id)
    VALUES (p_post_id, v_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  ELSE
    DELETE FROM public.likes
    WHERE post_id = p_post_id
      AND user_id = v_user_id;

    DELETE FROM public.post_dislikes
    WHERE post_id = p_post_id
      AND user_id = v_user_id;
  END IF;

  RETURN public.get_video_reaction_state(p_post_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.set_video_reaction(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_video_reaction(uuid, text) TO authenticated;
