-- Let authenticated creators delete only their own posts and Reels.
-- Preserve the existing separate admin moderation delete policy.
DROP POLICY IF EXISTS "Post owners can delete their posts" ON public.posts;
CREATE POLICY "Post owners can delete their posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
