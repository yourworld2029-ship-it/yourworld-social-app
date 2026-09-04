-- Functional auto-delete settings for Social Chat and Orbit Chat.
-- This migration is additive and preserves existing messages.

alter table public.orbit_chat_settings
  add column if not exists auto_delete_setting text not null default 'off';

update public.orbit_chat_settings
set auto_delete_setting = case
  when auto_delete_seconds >= 86400 then '24_hours'
  when auto_delete_seconds > 0 then '6_hours'
  else 'off'
end
where auto_delete_setting = 'off' and auto_delete_seconds > 0;

alter table public.orbit_chat_settings
  drop constraint if exists orbit_chat_settings_auto_delete_setting_check;
alter table public.orbit_chat_settings
  add constraint orbit_chat_settings_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '6_hours', '24_hours'));

alter table public.messages
  add column if not exists expires_at timestamptz,
  add column if not exists is_viewed boolean not null default false,
  add column if not exists viewed_at timestamptz,
  add column if not exists auto_delete_setting text not null default 'off';

alter table public.direct_messages
  add column if not exists is_viewed boolean not null default false,
  add column if not exists viewed_at timestamptz,
  add column if not exists auto_delete_setting text not null default 'off';

alter table public.orbit_messages
  add column if not exists is_viewed boolean not null default false,
  add column if not exists viewed_at timestamptz,
  add column if not exists auto_delete_setting text not null default 'off';

alter table public.messages
  drop constraint if exists messages_auto_delete_setting_check;
alter table public.messages
  add constraint messages_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '6_hours', '24_hours'));

alter table public.direct_messages
  drop constraint if exists direct_messages_auto_delete_setting_check;
alter table public.direct_messages
  add constraint direct_messages_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '6_hours', '24_hours'));

alter table public.orbit_messages
  drop constraint if exists orbit_messages_auto_delete_setting_check;
alter table public.orbit_messages
  add constraint orbit_messages_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '6_hours', '24_hours'));

create index if not exists messages_expires_at_idx
  on public.messages (expires_at)
  where expires_at is not null;
create index if not exists direct_messages_expires_at_idx
  on public.direct_messages (expires_at)
  where expires_at is not null;
create index if not exists orbit_messages_expires_at_idx
  on public.orbit_messages (expires_at)
  where expires_at is not null;

create or replace function public.delete_expired_chat_messages()
returns integer language plpgsql security definer set search_path = public
as $$
declare
  n integer := 0;
  d integer := 0;
  o integer := 0;
begin
  delete from public.messages
  where expires_at is not null and expires_at <= now();
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
alter table public.direct_messages replica identity full;
alter table public.orbit_messages replica identity full;