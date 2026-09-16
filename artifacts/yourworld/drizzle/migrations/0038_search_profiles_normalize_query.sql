create or replace function public.search_profiles(search text)
returns table(id uuid, username text, display_name text, avatar_url text, bio text, is_verified boolean, category text)
language sql stable security definer set search_path = public
as $$
  with normalized as (
    select nullif(regexp_replace(trim(search), '^@+', ''), '') as term
  )
  select
    p.id,
    p.username,
    coalesce(nullif(trim(p.display_name), ''), p.full_name),
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.category
  from public.profiles p
  cross join normalized
  where normalized.term is not null
    and (
      p.username ilike '%' || normalized.term || '%'
      or p.display_name ilike '%' || normalized.term || '%'
      or p.full_name ilike '%' || normalized.term || '%'
    )
  order by
    case when lower(p.username) = lower(normalized.term) then 0 else 1 end,
    p.updated_at desc nulls last
  limit 50
$$;