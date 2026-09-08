-- Make Social Chat auto-delete state explicit and visible to both participants.
-- Legacy auto_delete_setting is retained for older clients and rows.

alter table public.conversations
  add column if not exists auto_delete_setting text not null default 'off';

alter table public.conversations
  drop constraint if exists conversations_auto_delete_setting_check;
alter table public.conversations
  add constraint conversations_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '6_hours', '24_hours'));

alter table public.orbit_chat_settings
  add column if not exists auto_delete_mode text not null default 'off';

update public.orbit_chat_settings
set auto_delete_mode = case
  when auto_delete_setting in ('after_view', '6_hours', '24_hours')
    then auto_delete_setting
  when auto_delete_seconds >= 86400 then '24_hours'
  when auto_delete_seconds > 0 then '6_hours'
  else 'off'
end
where auto_delete_mode = 'off';

alter table public.orbit_chat_settings
  drop constraint if exists orbit_chat_settings_auto_delete_mode_check;
alter table public.orbit_chat_settings
  add constraint orbit_chat_settings_auto_delete_mode_check
  check (auto_delete_mode in ('off', 'after_view', '6_hours', '24_hours'));

alter table public.messages
  add column if not exists auto_delete_mode text not null default 'off',
  add column if not exists is_deleted boolean not null default false;

update public.messages
set auto_delete_mode = case
  when auto_delete_setting in ('after_view', '6_hours', '24_hours')
    then auto_delete_setting
  else 'off'
end
where auto_delete_mode = 'off'
  and auto_delete_setting in ('after_view', '6_hours', '24_hours');

alter table public.messages
  drop constraint if exists messages_auto_delete_mode_check;
alter table public.messages
  add constraint messages_auto_delete_mode_check
  check (auto_delete_mode in ('off', 'after_view', '6_hours', '24_hours'));

create or replace function public.apply_message_auto_delete()
returns trigger language plpgsql
set search_path = public
as $$
declare
  mode text;
begin
  mode := case
    when new.auto_delete_mode in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_mode
    when new.auto_delete_setting in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_setting
    else 'off'
  end;

  new.auto_delete_mode := mode;
  new.auto_delete_setting := mode;
  new.expires_at := case mode
    when '6_hours' then now() + interval '6 hours'
    when '24_hours' then now() + interval '24 hours'
    else null
  end;
  return new;
end
$$;

drop trigger if exists messages_apply_auto_delete on public.messages;
create trigger messages_apply_auto_delete
before insert on public.messages
for each row execute function public.apply_message_auto_delete();

create index if not exists messages_auto_delete_state_idx
  on public.messages (expires_at, is_deleted)
  where expires_at is not null or is_deleted = true;

create or replace function public.delete_expired_chat_messages()
returns integer language plpgsql security definer set search_path = public
as $$
declare
  n integer := 0;
  d integer := 0;
  o integer := 0;
begin
  delete from public.messages
  where is_deleted = true
     or (expires_at is not null and expires_at <= now());
  get diagnostics n = row_count;

  delete from public.direct_messages
  where expires_at is not null and expires_at <= now();
  get diagnostics d = row_count;

  delete from public.orbit_messages
  where expires_at is not null and expires_at <= now();
  get diagnostics o = row_count;

  return n + d + o;
end
$$;

grant execute on function public.delete_expired_chat_messages() to authenticated;
alter table public.messages replica identity full;