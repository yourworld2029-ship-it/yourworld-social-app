ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS normal_categories text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.profiles
SET normal_categories = ARRAY(
  SELECT trim(value)
  FROM unnest(regexp_split_to_array(trim(category), '\s+•\s+')) WITH ORDINALITY AS parts(value, position)
  WHERE trim(value) <> ''
  ORDER BY position
  LIMIT 2
)
WHERE coalesce(array_length(normal_categories, 1), 0) = 0
  AND category IS NOT NULL
  AND trim(category) <> ''
  AND category !~* '^(athlete|player|coach)(\s*[-·•|:]|$)';

DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
CREATE FUNCTION public.get_public_profiles(ids uuid[])
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  is_verified boolean,
  category text,
  normal_categories text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.username,
    coalesce(p.display_name, p.full_name),
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.category,
    p.normal_categories
  FROM public.profiles p
  WHERE p.id = ANY(ids)
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.search_profiles(text);
CREATE FUNCTION public.search_profiles(search text)
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  is_verified boolean,
  category text,
  normal_categories text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.username,
    coalesce(p.display_name, p.full_name),
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.category,
    p.normal_categories
  FROM public.profiles p
  WHERE nullif(trim(search), '') IS NOT NULL
    AND (
      p.username ILIKE '%' || trim(leading '@' from search) || '%'
      OR p.display_name ILIKE '%' || search || '%'
      OR p.full_name ILIKE '%' || search || '%'
    )
  ORDER BY
    CASE WHEN lower(p.username) = lower(trim(leading '@' from search)) THEN 0 ELSE 1 END,
    p.updated_at DESC NULLS LAST
  LIMIT 50
$function$;

GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO anon, authenticated;