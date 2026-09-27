ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_source_quality_tier_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_source_quality_tier_check
  CHECK (
    source_quality_tier IN (
      '360p',
      '480p',
      '720p',
      '1080p',
      '1440p',
      '2k',
      '2160p',
      '4k',
      '4320p',
      'original',
      'high',
      'standard'
    )
  );