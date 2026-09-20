-- Highlights may contain only the owner's published video/reel posts and are
-- capped at five rows per owner. The advisory lock makes the cap race-safe.

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
     AND (SELECT count(*) FROM public.highlights WHERE user_id = NEW.user_id) >= 5
  THEN
    RAISE EXCEPTION 'Maximum 5 highlights reached. Delete an existing highlight to add a new one.';
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

DROP TRIGGER IF EXISTS highlights_video_rules_trigger ON public.highlights;
CREATE TRIGGER highlights_video_rules_trigger
  BEFORE INSERT OR UPDATE OF user_id, items
  ON public.highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_highlight_video_rules();

ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete their own highlights" ON public.highlights;
CREATE POLICY "Users can delete their own highlights"
  ON public.highlights
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);