-- Secure, realtime one-to-one messaging and calling.
-- This migration is additive and preserves all existing rows.

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists display_name text;

create table if not exists public.thread_participants (
  thread_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  media_url text,
  media_type text not null default 'text',
  is_read boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.direct_messages add column if not exists expires_at timestamptz;
create index if not exists direct_messages_thread_created_idx
  on public.direct_messages (thread_id, created_at desc);

create or replace function public.dm_thread_id(_a uuid, _b uuid)
returns text language sql immutable strict
as $$ select 'dm_' || least(_a::text, _b::text) || '_' || greatest(_a::text, _b::text) $$;

create or replace function public.dm_thread_has_user(_thread_id text, _user_id uuid)
returns boolean language sql immutable strict
as $$
  select _thread_id ~* '^dm_[0-9a-f-]{36}_[0-9a-f-]{36}$'
    and (_thread_id = public.dm_thread_id(_user_id, substring(_thread_id from 41 for 36)::uuid)
      or _thread_id = public.dm_thread_id(_user_id, substring(_thread_id from 4 for 36)::uuid))
$$;

create or replace function public.dm_thread_peer(_thread_id text, _user_id uuid)
returns uuid language sql immutable strict
as $$
  select case
    when substring(_thread_id from 4 for 36)::uuid = _user_id
      then substring(_thread_id from 41 for 36)::uuid
    when substring(_thread_id from 41 for 36)::uuid = _user_id
      then substring(_thread_id from 4 for 36)::uuid
    else null
  end
$$;

create or replace function public.add_thread_participant()
returns trigger language plpgsql security definer set search_path = public
as $$
declare a uuid; b uuid;
begin
  insert into public.thread_participants(thread_id,user_id)
  values (new.thread_id,new.sender_id) on conflict do nothing;
  if new.thread_id ~* '^dm_[0-9a-f-]{36}_[0-9a-f-]{36}$' then
    a := substring(new.thread_id from 4 for 36)::uuid;
    b := substring(new.thread_id from 41 for 36)::uuid;
    insert into public.thread_participants(thread_id,user_id)
    values (new.thread_id,a),(new.thread_id,b) on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists direct_messages_add_participants on public.direct_messages;
create trigger direct_messages_add_participants
after insert on public.direct_messages for each row execute function public.add_thread_participant();

insert into public.thread_participants(thread_id,user_id)
select distinct m.thread_id, u.id
from public.direct_messages m
cross join lateral (
  values (substring(m.thread_id from 4 for 36)::uuid),
         (substring(m.thread_id from 41 for 36)::uuid)
) u(id)
where m.thread_id ~* '^dm_[0-9a-f-]{36}_[0-9a-f-]{36}$'
on conflict do nothing;

create table if not exists public.orbit_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text','photo','video','audio','system')),
  text text,
  url text,
  view_once boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orbit_messages_pair_created_idx
  on public.orbit_messages (sender_id, recipient_id, created_at desc);

create table if not exists public.orbit_chat_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  peer_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  secret_lock_enabled boolean not null default false,
  secret_pin_salt text,
  secret_pin_hash text,
  view_once_mode boolean not null default false,
  auto_delete_seconds integer not null default 0 check (auto_delete_seconds >= 0),
  screenshot_alert boolean not null default true,
  recording_alert boolean not null default true,
  muted boolean not null default false,
  blocked boolean not null default false,
  cleared_before timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, peer_id)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface in ('social','orbit','call')),
  thread_id text,
  message_id uuid,
  reason text not null default 'User report',
  created_at timestamptz not null default now(),
  unique (reporter_id, reported_user_id, surface)
);

create or replace function public.users_blocked(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.user_blocks
    where (blocker_id=_a and blocked_id=_b) or (blocker_id=_b and blocked_id=_a)
  )
$$;

create or replace function public.search_profiles(search text)
returns table(id uuid, username text, display_name text, avatar_url text, bio text, is_verified boolean, category text)
language sql stable security definer set search_path = public
as $$
  select p.id,p.username,coalesce(p.display_name,p.full_name),p.avatar_url,p.bio,p.is_verified,p.category
  from public.profiles p
  where nullif(trim(search),'') is not null
    and (p.username ilike '%'||trim(leading '@' from search)||'%'
      or p.display_name ilike '%'||search||'%'
      or p.full_name ilike '%'||search||'%')
  order by
    case when lower(p.username)=lower(trim(leading '@' from search)) then 0 else 1 end,
    p.updated_at desc nulls last
  limit 50
$$;

create or replace function public.get_public_profiles(ids uuid[])
returns table(id uuid, username text, display_name text, avatar_url text, bio text, is_verified boolean, category text)
language sql stable security definer set search_path = public
as $$
  select p.id,p.username,coalesce(p.display_name,p.full_name),p.avatar_url,p.bio,p.is_verified,p.category
  from public.profiles p where p.id = any(ids)
$$;

create or replace function public.burn_view_once(_msg_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
declare deleted_count integer;
begin
  delete from public.direct_messages
  where id=_msg_id and media_type like '%_once'
    and sender_id <> auth.uid()
    and public.dm_thread_has_user(thread_id,auth.uid());
  get diagnostics deleted_count = row_count;
  return deleted_count=1;
end $$;

create or replace function public.consume_orbit_view_once(_msg_id uuid)
returns text language plpgsql security definer set search_path = public
as $$
declare media text;
begin
  delete from public.orbit_messages
  where id=_msg_id and view_once and recipient_id=auth.uid()
  returning url into media;
  return media;
end $$;

create or replace function public.delete_expired_chat_messages()
returns integer language plpgsql security definer set search_path = public
as $$
declare n integer := 0; m integer := 0;
begin
  delete from public.direct_messages where expires_at is not null and expires_at <= now();
  get diagnostics n = row_count;
  delete from public.orbit_messages where expires_at is not null and expires_at <= now();
  get diagnostics m = row_count;
  return n+m;
end $$;

create or replace function public.delete_expired_orbit_messages()
returns integer language sql security definer set search_path = public
as $$ select public.delete_expired_chat_messages() $$;

alter table public.direct_messages enable row level security;
alter table public.thread_participants enable row level security;
alter table public.orbit_messages enable row level security;
alter table public.orbit_chat_settings enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;
alter table public.calls enable row level security;

drop policy if exists "Allow all messages" on public.messages;
drop policy if exists messages_allow_all on public.messages;
drop policy if exists "Allow all calls" on public.calls;
drop policy if exists calls_allow_all on public.calls;
drop policy if exists profiles_allow_all on public.profiles;

drop policy if exists dm_participants_read on public.direct_messages;
create policy dm_participants_read on public.direct_messages for select to authenticated
using (public.dm_thread_has_user(thread_id,auth.uid()) and (expires_at is null or expires_at > now()));
drop policy if exists dm_sender_insert on public.direct_messages;
create policy dm_sender_insert on public.direct_messages for insert to authenticated
with check (
  sender_id=auth.uid() and public.dm_thread_has_user(thread_id,auth.uid())
  and not public.users_blocked(auth.uid(),public.dm_thread_peer(thread_id,auth.uid()))
);
drop policy if exists dm_participants_update on public.direct_messages;
create policy dm_participants_update on public.direct_messages for update to authenticated
using (public.dm_thread_has_user(thread_id,auth.uid()))
with check (public.dm_thread_has_user(thread_id,auth.uid()));
drop policy if exists dm_sender_delete on public.direct_messages;
create policy dm_sender_delete on public.direct_messages for delete to authenticated
using (sender_id=auth.uid());

drop policy if exists thread_participants_read on public.thread_participants;
create policy thread_participants_read on public.thread_participants for select to authenticated
using (user_id=auth.uid());

drop policy if exists orbit_participants_read on public.orbit_messages;
create policy orbit_participants_read on public.orbit_messages for select to authenticated
using ((sender_id=auth.uid() or recipient_id=auth.uid()) and (expires_at is null or expires_at > now()));
drop policy if exists orbit_sender_insert on public.orbit_messages;
create policy orbit_sender_insert on public.orbit_messages for insert to authenticated
with check (sender_id=auth.uid() and not public.users_blocked(sender_id,recipient_id));
drop policy if exists orbit_sender_delete on public.orbit_messages;
create policy orbit_sender_delete on public.orbit_messages for delete to authenticated
using (sender_id=auth.uid());

drop policy if exists chat_settings_owner on public.orbit_chat_settings;
create policy chat_settings_owner on public.orbit_chat_settings for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists blocks_owner_read on public.user_blocks;
create policy blocks_owner_read on public.user_blocks for select to authenticated
using (blocker_id=auth.uid());
drop policy if exists blocks_owner_write on public.user_blocks;
create policy blocks_owner_write on public.user_blocks for all to authenticated
using (blocker_id=auth.uid()) with check (blocker_id=auth.uid());
drop policy if exists reports_owner on public.user_reports;
create policy reports_owner on public.user_reports for all to authenticated
using (reporter_id=auth.uid()) with check (reporter_id=auth.uid());

drop policy if exists calls_participants_read on public.calls;
create policy calls_participants_read on public.calls for select to authenticated
using (caller_id=auth.uid() or receiver_id=auth.uid());
drop policy if exists calls_caller_insert on public.calls;
create policy calls_caller_insert on public.calls for insert to authenticated
with check (caller_id=auth.uid() and not public.users_blocked(caller_id,receiver_id));
drop policy if exists calls_participants_update on public.calls;
create policy calls_participants_update on public.calls for update to authenticated
using (caller_id=auth.uid() or receiver_id=auth.uid())
with check (caller_id=auth.uid() or receiver_id=auth.uid());

grant select,insert,update,delete on public.direct_messages,public.thread_participants,
  public.orbit_messages,public.orbit_chat_settings,public.user_blocks,public.user_reports,public.calls
  to authenticated;
grant execute on function public.search_profiles(text),public.get_public_profiles(uuid[]),
  public.burn_view_once(uuid),public.consume_orbit_view_once(uuid),
  public.delete_expired_chat_messages(),public.delete_expired_orbit_messages()
  to authenticated;

alter table public.direct_messages replica identity full;
alter table public.orbit_messages replica identity full;
alter table public.calls replica identity full;
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='direct_messages') then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orbit_messages') then
    alter publication supabase_realtime add table public.orbit_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='calls') then
    alter publication supabase_realtime add table public.calls;
  end if;
end $$;