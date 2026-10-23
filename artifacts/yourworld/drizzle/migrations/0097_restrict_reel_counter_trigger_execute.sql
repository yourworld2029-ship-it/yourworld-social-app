REVOKE ALL ON FUNCTION public.bump_reel_interaction_counter()
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS post_reel_shares_insert_visible_reel
  ON public.post_reel_shares;
CREATE POLICY post_reel_shares_insert_visible_reel
  ON public.post_reel_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
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
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.posts AS p
      WHERE p.id = post_id
        AND p.kind = 'reel'
        AND p.user_id <> (SELECT auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS post_reel_shares_post_id_idx
  ON public.post_reel_shares (post_id);
CREATE INDEX IF NOT EXISTS post_reel_shares_user_id_idx
  ON public.post_reel_shares (user_id);
CREATE INDEX IF NOT EXISTS post_reel_reposts_user_id_idx
  ON public.post_reel_reposts (user_id);
