-- YourWorld core schema
-- Idempotent and non-destructive: existing tables and rows are preserved.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('post', 'reel', 'video')),
  media_url text not null,
  media_type text not null default 'image',
  title text default '',
  caption text default '',
  hashtags text[] not null default '{}',
  location text,
  audio text,
  thumbnail_url text,
  orientation text default 'landscape',
  duration_seconds integer,
  views bigint not null default 0,
  allow_download boolean not null default true,
  audience text not null default 'everyone',
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  media_url text not null,
  thumbnail_url text,
  duration_seconds integer,
  orientation text default 'landscape',
  created_at timestamptz not null default now()
);

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text default '',
  media_url text not null,
  audio text,
  hashtags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  pinned boolean not null default false,
  pinned_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.videos enable row level security;
alter table public.reels enable row level security;
alter table public.comments enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_likes enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles','posts','videos','reels','comments','post_comments','post_likes']
  loop
    execute format('drop policy if exists "public read" on public.%I', table_name);
    execute format('create policy "public read" on public.%I for select using (true)', table_name);
  end loop;
end $$;

drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['posts','videos','reels','comments','post_comments']
  loop
    execute format('drop policy if exists "owners insert" on public.%I', table_name);
    execute format('create policy "owners insert" on public.%I for insert with check (auth.uid() = user_id)', table_name);
    execute format('drop policy if exists "owners update" on public.%I', table_name);
    execute format('create policy "owners update" on public.%I for update using (auth.uid() = user_id)', table_name);
    execute format('drop policy if exists "owners delete" on public.%I', table_name);
    execute format('create policy "owners delete" on public.%I for delete using (auth.uid() = user_id)', table_name);
  end loop;
end $$;

drop policy if exists "users like as themselves" on public.post_likes;
create policy "users like as themselves" on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "users remove own likes" on public.post_likes;
create policy "users remove own likes" on public.post_likes for delete using (auth.uid() = user_id);