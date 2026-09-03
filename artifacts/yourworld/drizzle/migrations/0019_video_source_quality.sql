ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS original_width integer,
  ADD COLUMN IF NOT EXISTS original_height integer,
  ADD COLUMN IF NOT EXISTS source_quality_tier text;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_source_quality_tier_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_source_quality_tier_check
  CHECK (
    source_quality_tier IS NULL OR
    source_quality_tier IN ('480p', '720p', '1080p', '1440p', '2160p', '4320p')
  );