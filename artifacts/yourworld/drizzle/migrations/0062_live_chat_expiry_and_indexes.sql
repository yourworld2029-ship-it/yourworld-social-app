-- Server-authoritative live chat expiry, shared Orbit settings, and hot-path
-- message indexes. This migration is additive and preserves existing rows.

alter table public.messages
  add column if not exists chat_id text;

update public.messages
set chat_id = coalesce(
  chat_id,
  conversation_id::text,
  case
    when sender_id is not null and receiver_id is not null
      then 'dm_' || least(sender_id::text, receiver_id::text) || '_' ||
        greatest(sender_id::text, receiver_id::text)
    else null
  end
)
where chat_id is null;

create index if not exists messages_chat_created_idx
  on public.messages (chat_id, created_at desc);
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

create or replace function public.apply_message_chat_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.chat_id is null then
    new.chat_id := coalesce(
      new.conversation_id::text,
      case
        when new.sender_id is not null and new.receiver_id is not null
          then 'dm_' || least(new.sender_id::text, new.receiver_id::text) || '_' ||
            greatest(new.sender_id::text, new.receiver_id::text)
        else null
      end
    );
  end if;
  return new;
end
$$;

drop trigger if exists messages_apply_chat_id on public.messages;
create trigger messages_apply_chat_id
before insert on public.messages
for each row execute function public.apply_message_chat_id();

-- After-view applies to every user message. The receiver marks it viewed and
-- the specific RPC below permanently removes it after the five-second window.
create or replace function public.apply_message_auto_delete()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  mode text;
begin
  if coalesce(new.is_system_message, false) then
    new.auto_delete_mode := 'off';
    new.auto_delete_setting := 'off';
    new.expires_at := null;
    return new;
  end if;

  mode := case
    when new.auto_delete_setting in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_setting
    when new.auto_delete_mode in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_mode
    else 'off'
  end;

  new.auto_delete_mode := mode;
  new.auto_delete_setting := mode;
  new.expires_at := case mode
    when '6_hours' then coalesce(new.created_at, now()) + interval '6 hours'
    when '24_hours' then coalesce(new.created_at, now()) + interval '24 hours'
    else null
  end;
  return new;
end
$$;

drop trigger if exists messages_apply_auto_delete on public.messages;
create trigger messages_apply_auto_delete
before insert on public.messages
for each row execute function public.apply_message_auto_delete();

create or replace function public.apply_orbit_message_auto_delete()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  mode text;
begin
  mode := case
    when new.auto_delete_setting in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_setting
    else 'off'
  end;
  new.auto_delete_setting := mode;
  new.expires_at := case mode
    when '6_hours' then coalesce(new.created_at, now()) + interval '6 hours'
    when '24_hours' then coalesce(new.created_at, now()) + interval '24 hours'
    else null
  end;
  return new;
end
$$;

drop trigger if exists orbit_messages_apply_auto_delete on public.orbit_messages;
create trigger orbit_messages_apply_auto_delete
before insert on public.orbit_messages
for each row execute function public.apply_orbit_message_auto_delete();

create or replace function public.delete_social_message_after_view(_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.messages
  where id = _message_id
    and receiver_id = auth.uid()
    and auto_delete_mode = 'after_view'
    and is_viewed = true
    and expires_at is not null
    and expires_at <= now();
  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end
$$;

create or replace function public.delete_orbit_message_after_view(_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.orbit_messages
  where id = _message_id
    and recipient_id = auth.uid()
    and auto_delete_setting = 'after_view'
    and is_viewed = true
    and expires_at is not null
    and expires_at <= now();
  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end
$$;

create table if not exists public.chat_auto_delete_settings (
  chat_id text primary key,
  participant_one_id uuid not null references auth.users(id) on delete cascade,
  participant_two_id uuid not null references auth.users(id) on delete cascade,
  auto_delete_mode text not null default 'off',
  updated_by uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  constraint chat_auto_delete_settings_mode_check
    check (auto_delete_mode in ('off', 'after_view', '6_hours', '24_hours')),
  constraint chat_auto_delete_settings_participants_check
    check (participant_one_id <> participant_two_id)
);

alter table public.chat_auto_delete_settings enable row level security;
drop policy if exists chat_auto_delete_settings_read on public.chat_auto_delete_settings;
create policy chat_auto_delete_settings_read
on public.chat_auto_delete_settings for select to authenticated
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);
drop policy if exists chat_auto_delete_settings_write on public.chat_auto_delete_settings;
create policy chat_auto_delete_settings_write
on public.chat_auto_delete_settings for insert to authenticated
with check (
  auth.uid() = updated_by
  and (auth.uid() = participant_one_id or auth.uid() = participant_two_id)
);
drop policy if exists chat_auto_delete_settings_update on public.chat_auto_delete_settings;
create policy chat_auto_delete_settings_update
on public.chat_auto_delete_settings for update to authenticated
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id)
with check (
  auth.uid() = updated_by
  and (auth.uid() = participant_one_id or auth.uid() = participant_two_id)
);

create index if not exists chat_auto_delete_settings_participants_idx
  on public.chat_auto_delete_settings (participant_one_id, participant_two_id);

grant execute on function public.delete_social_message_after_view(uuid),
  public.delete_orbit_message_after_view(uuid)
  to authenticated;
grant select, insert, update on public.chat_auto_delete_settings to authenticated;

alter table public.chat_auto_delete_settings replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_auto_delete_settings'
  ) then
    alter publication supabase_realtime add table public.chat_auto_delete_settings;
  end if;
end
$$;