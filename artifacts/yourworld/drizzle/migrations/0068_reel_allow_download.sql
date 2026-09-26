-- Per-post download permission. Existing posts remain downloadable by default.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS allow_download boolean NOT NULL DEFAULT true;