-- Orbit request workflow: private pre-acceptance messages, atomic limits, and
-- receiver-only accept/decline actions.

create extension if not exists pgcrypto;

create table if not exists public.orbit_chat_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  intro text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists public.orbit_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.orbit_chat_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'photo')),
  text text,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists orbit_chat_requests_participants_idx
  on public.orbit_chat_requests (requester_id, addressee_id, updated_at desc);
create index if not exists orbit_request_messages_request_created_idx
  on public.orbit_request_messages (request_id, created_at asc);

create or replace function public.enforce_orbit_request_message_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.orbit_chat_requests%rowtype;
  sent_count integer;
begin
  -- Serialize senders for one request so two simultaneous inserts cannot
  -- both observe the same count and exceed the cap.
  perform pg_advisory_xact_lock(hashtextextended(new.request_id::text, 0));

  select * into request_row
  from public.orbit_chat_requests
  where id = new.request_id
  for update;

  if request_row.id is null
     or request_row.status <> 'pending'
     or request_row.requester_id <> new.sender_id then
    raise exception 'orbit_request_message_not_allowed'
      using errcode = '42501';
  end if;

  select count(*) into sent_count
  from public.orbit_request_messages
  where request_id = new.request_id
    and sender_id = request_row.requester_id;

  if sent_count >= 3 then
    raise exception 'orbit_request_message_limit'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists orbit_request_message_limit on public.orbit_request_messages;
create trigger orbit_request_message_limit
before insert on public.orbit_request_messages
for each row execute function public.enforce_orbit_request_message_limit();

create or replace function public.send_orbit_request_message(
  _target_id uuid,
  _kind text,
  _text text default null,
  _url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  request_row public.orbit_chat_requests%rowtype;
  message_id uuid;
begin
  if caller is null or _target_id is null or caller = _target_id
     or _kind not in ('text', 'photo') then
    raise exception 'orbit_request_message_invalid'
      using errcode = '22023';
  end if;

  if public.users_blocked(caller, _target_id) then
    raise exception 'orbit_request_blocked'
      using errcode = '42501';
  end if;

  select * into request_row
  from public.orbit_chat_requests
  where requester_id = caller and addressee_id = _target_id
  for update;

  if request_row.id is null then
    insert into public.orbit_chat_requests (requester_id, addressee_id, status)
    values (caller, _target_id, 'pending')
    returning * into request_row;
  elsif request_row.status <> 'pending' then
    raise exception 'orbit_request_message_not_pending'
      using errcode = '42501';
  end if;

  insert into public.orbit_request_messages (request_id, sender_id, kind, text, url)
  values (request_row.id, caller, _kind, nullif(_text, ''), nullif(_url, ''))
  returning id into message_id;

  update public.orbit_chat_requests
  set intro = case
                when intro is null and _kind = 'text' then nullif(_text, '')
                else intro
              end,
      updated_at = now()
  where id = request_row.id;

  return message_id;
end;
$$;

create or replace function public.send_orbit_chat_request(
  _target_id uuid,
  _intro text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  request_row public.orbit_chat_requests%rowtype;
begin
  if caller is null or _target_id is null or caller = _target_id then
    raise exception 'orbit_request_invalid'
      using errcode = '22023';
  end if;
  if public.users_blocked(caller, _target_id) then
    raise exception 'orbit_request_blocked'
      using errcode = '42501';
  end if;

  select * into request_row
  from public.orbit_chat_requests
  where requester_id = caller and addressee_id = _target_id
  for update;

  if request_row.id is null then
    insert into public.orbit_chat_requests (requester_id, addressee_id, intro, status)
    values (caller, _target_id, nullif(trim(_intro), ''), 'pending')
    returning * into request_row;
  elsif request_row.status = 'accepted' then
    return request_row.id;
  else
    update public.orbit_chat_requests
    set intro = coalesce(nullif(trim(_intro), ''), intro),
        status = 'pending',
        updated_at = now()
    where id = request_row.id
    returning * into request_row;
  end if;

  if nullif(trim(_intro), '') is not null
     and not exists (
       select 1 from public.orbit_request_messages
       where request_id = request_row.id and sender_id = caller
     ) then
    insert into public.orbit_request_messages (request_id, sender_id, kind, text)
    values (request_row.id, caller, 'text', trim(_intro));
  end if;

  return request_row.id;
end;
$$;

create or replace function public.respond_to_orbit_chat_request(
  _target_id uuid,
  _status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  request_row public.orbit_chat_requests%rowtype;
begin
  if caller is null or _status not in ('accepted', 'declined') then
    raise exception 'orbit_request_response_invalid'
      using errcode = '22023';
  end if;

  select * into request_row
  from public.orbit_chat_requests
  where requester_id = _target_id
    and addressee_id = caller
    and status = 'pending'
  for update;

  if request_row.id is null then
    return false;
  end if;

  update public.orbit_chat_requests
  set status = _status, updated_at = now()
  where id = request_row.id;

  if _status = 'accepted' then
    insert into public.orbit_connections (requester_id, addressee_id, status)
    values (request_row.requester_id, request_row.addressee_id, 'accepted')
    on conflict (requester_id, addressee_id)
    do update set status = 'accepted', updated_at = now();
  end if;

  return true;
end;
$$;

alter table public.orbit_chat_requests enable row level security;
alter table public.orbit_request_messages enable row level security;

drop policy if exists orbit_chat_requests_read on public.orbit_chat_requests;
create policy orbit_chat_requests_read on public.orbit_chat_requests
for select to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists orbit_chat_requests_insert on public.orbit_chat_requests;
create policy orbit_chat_requests_insert on public.orbit_chat_requests
for insert to authenticated
with check (
  requester_id = auth.uid()
  and requester_id <> addressee_id
  and not public.users_blocked(requester_id, addressee_id)
);

drop policy if exists orbit_request_messages_read on public.orbit_request_messages;
create policy orbit_request_messages_read on public.orbit_request_messages
for select to authenticated
using (
  exists (
    select 1 from public.orbit_chat_requests r
    where r.id = request_id
      and (r.requester_id = auth.uid() or r.addressee_id = auth.uid())
  )
);

-- Direct inserts remain available only for the requester and are protected by
-- the trigger above; the RPC is the normal client path.
drop policy if exists orbit_request_messages_insert on public.orbit_request_messages;
create policy orbit_request_messages_insert on public.orbit_request_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.orbit_chat_requests r
    where r.id = request_id
      and r.requester_id = auth.uid()
      and r.status = 'pending'
      and not public.users_blocked(r.requester_id, r.addressee_id)
  )
);

grant select, insert on public.orbit_chat_requests, public.orbit_request_messages to authenticated;
grant execute on function public.send_orbit_request_message(uuid, text, text, text),
  public.send_orbit_chat_request(uuid, text),
  public.respond_to_orbit_chat_request(uuid, text)
to authenticated;

alter table public.orbit_chat_requests replica identity full;
alter table public.orbit_request_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orbit_chat_requests'
  ) then
    alter publication supabase_realtime add table public.orbit_chat_requests;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orbit_request_messages'
  ) then
    alter publication supabase_realtime add table public.orbit_request_messages;
  end if;
end $$;