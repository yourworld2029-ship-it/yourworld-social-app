ALTER TABLE public.post_reel_reposts
  ADD COLUMN IF NOT EXISTS repost_post_id uuid
  REFERENCES public.posts(id)
  ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS post_reel_reposts_copy_unique_idx
  ON public.post_reel_reposts (repost_post_id);

ALTER TABLE public.post_reel_reposts
  ALTER COLUMN repost_post_id SET NOT NULL;

DROP POLICY IF EXISTS post_reel_reposts_insert_visible_reel
  ON public.post_reel_reposts;
CREATE POLICY post_reel_reposts_insert_visible_reel
  ON public.post_reel_reposts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.posts AS original
      WHERE original.id = post_id
        AND original.kind = 'reel'
        AND original.user_id <> (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.posts AS repost
      WHERE repost.id = repost_post_id
        AND repost.user_id = (SELECT auth.uid())
        AND repost.kind = 'reel'
    )
  );
