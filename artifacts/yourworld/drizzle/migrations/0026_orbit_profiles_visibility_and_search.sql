-- Orbit profiles are public discovery metadata, separate from the main profile.
-- Keep writes owner-only while allowing public profile/search reads.

create table if not exists public.orbit_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age integer not null default 18 check (age between 18 and 120),
  country text not null default '',
  state text not null default '',
  city text not null default '',
  about text not null default '',
  hobbies text[] not null default '{}',
  looking_for text not null default 'Everyone',
  gender text not null default 'Women',
  photos jsonb not null default '[]'::jsonb,
  original_photo_privacy text not null default 'matched',
  mood text,
  orbit_enabled boolean not null default true,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orbit_profiles enable row level security;

drop policy if exists "Public read orbit_profiles" on public.orbit_profiles;
create policy "Public read orbit_profiles" on public.orbit_profiles
  for select to anon, authenticated using (true);

drop policy if exists "Users can insert own orbit profile" on public.orbit_profiles;
create policy "Users can insert own orbit profile" on public.orbit_profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own orbit profile" on public.orbit_profiles;
create policy "Users can update own orbit profile" on public.orbit_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own orbit profile" on public.orbit_profiles;
create policy "Users can delete own orbit profile" on public.orbit_profiles
  for delete to authenticated using (auth.uid() = user_id);

grant select on public.orbit_profiles to anon, authenticated;
grant insert, update, delete on public.orbit_profiles to authenticated;

create or replace function public.touch_orbit_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orbit_profiles_updated_at on public.orbit_profiles;
create trigger orbit_profiles_updated_at
before update on public.orbit_profiles
for each row execute function public.touch_orbit_profiles_updated_at();

create or replace function public.discover_orbit_profiles(ids uuid[] default null)
returns table(
  user_id uuid,
  name text,
  age integer,
  country text,
  state text,
  city text,
  about text,
  hobbies text[],
  looking_for text,
  gender text,
  photos jsonb,
  original_photo_privacy text,
  mood text,
  orbit_enabled boolean,
  visible boolean,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.name,
    p.age,
    p.country,
    p.state,
    p.city,
    p.about,
    p.hobbies,
    p.looking_for,
    p.gender,
    p.photos,
    p.original_photo_privacy,
    p.mood,
    p.orbit_enabled,
    p.visible,
    p.updated_at
  from public.orbit_profiles p
  where p.orbit_enabled = true
    and p.visible = true
    and (ids is null or p.user_id = any(ids));
$$;

grant execute on function public.discover_orbit_profiles(uuid[]) to anon, authenticated;

drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles" on public.profiles
  for select to anon, authenticated using (true);

grant select on public.profiles to anon, authenticated;