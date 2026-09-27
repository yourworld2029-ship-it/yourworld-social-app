ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS series_title text,
  ADD COLUMN IF NOT EXISTS episode_number text;

CREATE INDEX IF NOT EXISTS posts_video_series_episode_idx
  ON public.posts (series_title, episode_number, created_at)
  WHERE kind = 'video' AND series_title IS NOT NULL;