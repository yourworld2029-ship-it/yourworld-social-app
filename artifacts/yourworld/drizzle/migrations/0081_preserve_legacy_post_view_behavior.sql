-- Retain the prior kind matching behavior for ordinary post views while keeping
-- long-video and Reel counters exclusively on the validated dual-key ledger.
CREATE OR REPLACE FUNCTION public.register_unique_view(
  _content_id text,
  _content_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_found boolean := false;
BEGIN
  IF auth.uid() IS NULL
     OR _content_id IS NULL
     OR _content_type NOT IN ('post', 'moment') THEN
    RETURN false;
  END IF;

  INSERT INTO public.unique_views (user_id, content_id, content_type)
  VALUES (auth.uid(), _content_id, _content_type)
  ON CONFLICT (user_id, content_id, content_type) DO NOTHING;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF _content_type = 'moment' THEN
    UPDATE public.posts
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id::text = _content_id AND kind = 'moment';
  ELSE
    UPDATE public.posts
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id::text = _content_id
      AND (
        kind = _content_type
        OR (_content_type = 'post' AND (kind IS NULL OR kind NOT IN ('reel', 'video')))
      );
  END IF;
  target_found := FOUND;

  IF NOT target_found THEN
    DELETE FROM public.unique_views
    WHERE user_id = auth.uid()
      AND content_id = _content_id
      AND content_type = _content_type;
  END IF;
  RETURN target_found;
END;
$$;

REVOKE ALL ON FUNCTION public.register_unique_view(text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_unique_view(text, text)
  TO authenticated;
