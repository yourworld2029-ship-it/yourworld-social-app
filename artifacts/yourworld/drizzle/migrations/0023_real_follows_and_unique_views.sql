-- Real follow relationships and database-enforced one-view-per-user tracking.

alter table public.profiles
  add column if not exists followers_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_no_self_follow check (follower_id <> following_id),
  constraint follows_follower_following_unique unique (follower_id, following_id)
);

create index if not exists follows_follower_idx on public.follows (follower_id, created_at desc);
create index if not exists follows_following_idx on public.follows (following_id, created_at desc);

alter table public.follows enable row level security;
drop policy if exists follows_read_authenticated on public.follows;
create policy follows_read_authenticated on public.follows
  for select to authenticated using (true);
drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows
  for delete to authenticated using (follower_id = auth.uid());
grant select, insert, delete on public.follows to authenticated;

create or replace function public.set_follow(
  _following_id uuid,
  _on boolean
)
returns table (
  following boolean,
  followers integer,
  following_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  target_followers integer := 0;
  actor_following integer := 0;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;
  if _following_id is null or _following_id = actor then
    raise exception 'You cannot follow yourself';
  end if;
  if not exists (select 1 from auth.users where id = _following_id) then
    raise exception 'User not found';
  end if;

  if coalesce(_on, false) then
    insert into public.follows (follower_id, following_id)
    values (actor, _following_id)
    on conflict (follower_id, following_id) do nothing;
  else
    delete from public.follows
    where follower_id = actor and following_id = _following_id;
  end if;

  select count(*)::integer into target_followers
  from public.follows where following_id = _following_id;
  select count(*)::integer into actor_following
  from public.follows where follower_id = actor;

  update public.profiles
  set followers_count = case when id = _following_id then target_followers else followers_count end,
      following_count = case when id = actor then actor_following else following_count end
  where id in (_following_id, actor);

  return query select
    exists (
      select 1 from public.follows
      where follower_id = actor and following_id = _following_id
    ),
    target_followers,
    actor_following;
end;
$$;

revoke all on function public.set_follow(uuid, boolean) from public;
grant execute on function public.set_follow(uuid, boolean) to authenticated;

create or replace function public.get_follow_counts(ids uuid[])
returns table (id uuid, followers integer, following integer)
language sql
security definer
set search_path = public, pg_temp
as $$
  select p.id,
         (select count(*)::integer from public.follows f where f.following_id = p.id),
         (select count(*)::integer from public.follows f where f.follower_id = p.id)
  from public.profiles p
  where p.id = any(ids);
$$;

revoke all on function public.get_follow_counts(uuid[]) from public;
grant execute on function public.get_follow_counts(uuid[]) to anon, authenticated;

create or replace function public.list_follows(
  _user_id uuid,
  _kind text,
  _limit integer default 500
)
returns table (id uuid, created_at timestamptz)
language sql
security definer
set search_path = public, pg_temp
as $$
  select case when _kind = 'following' then f.following_id else f.follower_id end,
         f.created_at
  from public.follows f
  where case when _kind = 'following' then f.follower_id = _user_id else f.following_id = _user_id end
  order by f.created_at desc
  limit greatest(1, least(coalesce(_limit, 500), 1000));
$$;

revoke all on function public.list_follows(uuid, text, integer) from public;
grant execute on function public.list_follows(uuid, text, integer) to anon, authenticated;

create table if not exists public.unique_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  content_type text not null check (content_type in ('post', 'reel', 'video', 'moment')),
  viewed_at timestamptz not null default now(),
  primary key (user_id, content_id, content_type)
);

create index if not exists unique_views_content_idx
  on public.unique_views (content_id, content_type);

alter table public.unique_views enable row level security;
drop policy if exists unique_views_read_own on public.unique_views;
create policy unique_views_read_own on public.unique_views
  for select to authenticated using (user_id = auth.uid());
drop policy if exists unique_views_insert_own on public.unique_views;
create policy unique_views_insert_own on public.unique_views
  for insert to authenticated with check (user_id = auth.uid());
grant select, insert on public.unique_views to authenticated;

create or replace function public.register_unique_view(
  _content_id text,
  _content_type text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_found boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;
  if _content_id is null or _content_type not in ('post', 'reel', 'video', 'moment') then
    return false;
  end if;

  insert into public.unique_views (user_id, content_id, content_type)
  values (auth.uid(), _content_id, _content_type)
  on conflict (user_id, content_id, content_type) do nothing;
  if not found then
    return false;
  end if;

  if _content_type = 'moment' then
    update public.posts
    set views_count = coalesce(views_count, 0) + 1
    where id::text = _content_id and kind = 'moment';
  else
    update public.posts
    set views_count = coalesce(views_count, 0) + 1
    where id::text = _content_id
      and (
        kind = _content_type
        or (_content_type = 'post' and (kind is null or kind not in ('reel', 'video')))
      );
  end if;
  target_found := found;

  if not target_found then
    delete from public.unique_views
    where user_id = auth.uid()
      and content_id = _content_id
      and content_type = _content_type;
  end if;
  return target_found;
end;
$$;

revoke all on function public.register_unique_view(text, text) from public;
grant execute on function public.register_unique_view(text, text) to authenticated;

-- Rebuild counters from the idempotent source of truth without changing rows.
update public.profiles p
set followers_count = (select count(*)::integer from public.follows f where f.following_id = p.id),
    following_count = (select count(*)::integer from public.follows f where f.follower_id = p.id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter table public.follows replica identity full;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'follows'
    ) then
      alter publication supabase_realtime add table public.follows;
    end if;
    alter table public.unique_views replica identity full;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'unique_views'
    ) then
      alter publication supabase_realtime add table public.unique_views;
    end if;
  end if;
end;
$$;