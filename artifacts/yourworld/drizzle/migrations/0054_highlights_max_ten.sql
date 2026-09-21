-- Highlights remain owner-scoped and may contain only published video/reel
-- posts. The advisory lock keeps the ten-row cap race-safe.

CREATE OR REPLACE FUNCTION public.enforce_highlight_video_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'A highlight owner is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));

  IF TG_OP = 'INSERT'
     AND (SELECT count(*) FROM public.highlights WHERE user_id = NEW.user_id) >= 10
  THEN
    RAISE EXCEPTION 'Limit Reached: You can create a maximum of 10 highlights. Please delete an existing highlight to add a new one.';
  END IF;

  IF jsonb_typeof(NEW.items) <> 'array'
     OR jsonb_array_length(NEW.items) = 0
     OR EXISTS (
       SELECT 1
       FROM jsonb_array_elements(NEW.items) AS item
       WHERE COALESCE(item->>'source', '') <> 'post'
          OR lower(COALESCE(item->>'mediaType', '')) NOT LIKE 'video%'
          OR NOT EXISTS (
            SELECT 1
            FROM public.posts AS p
            WHERE p.id::text = item->>'refId'
              AND p.user_id = NEW.user_id
              AND p.kind::text IN ('video', 'reel')
          )
     )
  THEN
    RAISE EXCEPTION 'Only published videos and reels can be added to highlights';
  END IF;

  RETURN NEW;
END;
$$;

ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete their own highlights" ON public.highlights;
DROP POLICY IF EXISTS "Users can delete own highlights" ON public.highlights;
CREATE POLICY "Users can delete their own highlights"
  ON public.highlights
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
GRANT DELETE ON TABLE public.highlights TO authenticated;