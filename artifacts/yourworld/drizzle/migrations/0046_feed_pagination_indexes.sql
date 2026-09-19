-- Feed and profile pagination indexes. Keep the sort key in each index so
-- cursor/range queries can avoid scanning the complete table.
CREATE INDEX IF NOT EXISTS posts_user_created_at_idx
  ON public.posts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS posts_kind_created_at_idx
  ON public.posts (kind, created_at DESC);

CREATE INDEX IF NOT EXISTS highlights_user_created_at_idx
  ON public.highlights (user_id, created_at DESC);