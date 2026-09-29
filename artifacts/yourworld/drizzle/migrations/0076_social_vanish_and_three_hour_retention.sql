-- Social Chat supports three-hour retention and deletes viewed Vanish Mode
-- messages when the recipient exits the conversation. Orbit retains its own
-- independent auto-delete values and view-once behavior.

alter table public.conversations
  drop constraint if exists conversations_auto_delete_setting_check;
alter table public.conversations
  add constraint conversations_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '3_hours', '6_hours', '24_hours'));

alter table public.conversation_preferences
  drop constraint if exists conversation_preferences_auto_delete_check;
alter table public.conversation_preferences
  add constraint conversation_preferences_auto_delete_check
  check (auto_delete_setting in ('off', 'after_view', '3_hours', '6_hours', '24_hours'));

alter table public.messages
  drop constraint if exists messages_auto_delete_setting_check;
alter table public.messages
  add constraint messages_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '3_hours', '6_hours', '24_hours'));

alter table public.messages
  drop constraint if exists messages_auto_delete_mode_check;
alter table public.messages
  add constraint messages_auto_delete_mode_check
  check (auto_delete_mode in ('off', 'after_view', '3_hours', '6_hours', '24_hours'));

-- The former selector value becomes the new three-hour setting. Existing
-- message rows keep their original expires_at snapshots.
update public.conversations
set auto_delete_setting = '3_hours'
where auto_delete_setting = '6_hours';

update public.conversation_preferences
set auto_delete_setting = '3_hours'
where auto_delete_setting = '6_hours';

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
    when new.auto_delete_setting in ('after_view', '3_hours', '24_hours')
      then new.auto_delete_setting
    when new.auto_delete_setting = '6_hours'
      then '3_hours'
    when new.auto_delete_mode in ('after_view', '3_hours', '24_hours')
      then new.auto_delete_mode
    when new.auto_delete_mode = '6_hours'
      then '3_hours'
    else 'off'
  end;

  new.auto_delete_mode := mode;
  new.auto_delete_setting := mode;
  new.expires_at := case mode
    when '3_hours' then coalesce(new.created_at, now()) + interval '3 hours'
    when '24_hours' then coalesce(new.created_at, now()) + interval '24 hours'
    else null
  end;
  return new;
end
$$;

-- Vanish messages stay available while the conversation is open. Only explicit
-- View Once media retains its existing five-second expiry after it is opened.
create or replace function public.apply_social_message_view_expiry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.is_viewed is distinct from true
    and new.is_viewed is true
    and new.auto_delete_mode = 'after_view'
    and coalesce(new.is_system_message, false) = false
  then
    if auth.uid() is not null and auth.uid() <> new.receiver_id then
      raise exception 'Only the recipient can mark a chat message viewed';
    end if;
    new.is_read := true;
    new.viewed_at := clock_timestamp();
    new.expires_at := case
      when coalesce(new.metadata ->> 'view_once', 'false') = 'true'
        then new.viewed_at + interval '5 seconds'
      else null
    end;
  end if;
  return new;
end
$$;

create or replace function public.delete_viewed_social_messages_on_exit(
  _conversation_id uuid
)
returns table(message_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_participant_one uuid;
  v_participant_two uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select participant_one_id, participant_two_id
    into v_participant_one, v_participant_two
  from public.conversations
  where id = _conversation_id
  for share;

  if not found
    or v_user_id is distinct from v_participant_one
       and v_user_id is distinct from v_participant_two
  then
    raise exception 'Not a participant in this conversation' using errcode = '42501';
  end if;

  return query
  delete from public.messages as m
  where m.receiver_id = v_user_id
    and m.auto_delete_mode = 'after_view'
    and m.is_viewed is true
    and coalesce(m.is_system_message, false) = false
    and coalesce(m.metadata ->> 'view_once', 'false') <> 'true'
    and (
      m.conversation_id = _conversation_id
      or (m.sender_id = v_participant_one and m.receiver_id = v_participant_two)
      or (m.sender_id = v_participant_two and m.receiver_id = v_participant_one)
    )
  returning m.id;
end
$$;

revoke all on function public.delete_viewed_social_messages_on_exit(uuid)
  from public, anon;
grant execute on function public.delete_viewed_social_messages_on_exit(uuid)
  to authenticated;

-- Timed text-only Social messages are deleted even when nobody has the chat
-- mounted. Media-bearing rows remain for the storage-aware Edge cleanup job.
create or replace function public.purge_expired_social_text_messages()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer := 0;
begin
  delete from public.messages
  where (
      is_deleted = true
      or (expires_at is not null and expires_at <= clock_timestamp())
    )
    and media_url is null
    and voice_note_url is null
    and metadata ->> 'media_path' is null;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end
$$;

revoke all on function public.purge_expired_social_text_messages()
  from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'purge-expired-social-text-messages'
  ) then
    perform cron.schedule(
      'purge-expired-social-text-messages',
      '* * * * *',
      'select public.purge_expired_social_text_messages();'
    );
  end if;
end
$$;

-- Existing message listeners already handle PostgreSQL DELETE events; publish
-- Social message changes so both participants update without an app refresh.
alter table public.messages replica identity full;
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end
$$;