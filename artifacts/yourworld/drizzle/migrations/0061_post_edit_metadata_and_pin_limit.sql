ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS mentions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS sports_tag text;

CREATE OR REPLACE FUNCTION public.enforce_post_pin_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pinned IS TRUE
    AND (TG_OP = 'INSERT' OR COALESCE(OLD.pinned, FALSE) IS DISTINCT FROM TRUE)
    AND (
      SELECT count(*)
      FROM public.posts
      WHERE user_id = NEW.user_id
        AND pinned IS TRUE
        AND id <> NEW.id
    ) >= 3
  THEN
    RAISE EXCEPTION 'You can pin at most 3 posts to your profile grid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_pin_limit_trigger ON public.posts;
CREATE TRIGGER posts_pin_limit_trigger
BEFORE INSERT OR UPDATE OF pinned ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_post_pin_limit();