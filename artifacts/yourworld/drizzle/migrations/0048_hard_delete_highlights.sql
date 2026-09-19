CREATE OR REPLACE FUNCTION public.delete_highlight_hard(
  p_highlight_id uuid,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_id uuid;
BEGIN
  IF p_highlight_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid highlight ID or unauthorized';
  END IF;

  -- Check ownership before touching optional child mappings. The function is
  -- called by the server with the already-authenticated user's ID.
  IF NOT EXISTS (
    SELECT 1
    FROM public.highlights
    WHERE id = p_highlight_id
      AND user_id = p_user_id
  ) THEN
    RETURN NULL;
  END IF;

  -- These tables are not present in the current schema because items are
  -- stored inline as JSONB, but keep the hard-delete path safe for deployments
  -- that still have the legacy mappings.
  IF to_regclass('public.highlight_stories') IS NOT NULL THEN
    EXECUTE
      'DELETE FROM public.highlight_stories WHERE highlight_id = $1'
      USING p_highlight_id;
  END IF;

  IF to_regclass('public.highlight_items') IS NOT NULL THEN
    EXECUTE
      'DELETE FROM public.highlight_items WHERE highlight_id = $1'
      USING p_highlight_id;
  END IF;

  DELETE FROM public.highlights
  WHERE id = p_highlight_id
    AND user_id = p_user_id
  RETURNING id INTO deleted_id;

  RETURN deleted_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_highlight_hard(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_highlight_hard(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_highlight_hard(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_highlight_hard(uuid, uuid) TO service_role;