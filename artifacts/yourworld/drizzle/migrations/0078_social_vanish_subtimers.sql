-- Social Vanish Mode keeps its existing immediate-on-exit default and adds
-- recipient-view timers. Message mode remains "after_view"; the selected
-- duration is snapshotted into metadata on each new message.

alter table public.conversations
  drop constraint if exists conversations_auto_delete_setting_check;
alter table public.conversations
  add constraint conversations_auto_delete_setting_check
  check (
    auto_delete_setting in (
      'off',
      'after_view',
      'after_view_15s',
      'after_view_1m',
      'after_view_10m',
      '3_hours',
      '5_hours',
      '6_hours',
      '24_hours'
    )
  );

alter table public.conversation_preferences
  drop constraint if exists conversation_preferences_auto_delete_check;
alter table public.conversation_preferences
  add constraint conversation_preferences_auto_delete_check
  check (
    auto_delete_setting in (
      'off',
      'after_view',
      'after_view_15s',
      'after_view_1m',
      'after_view_10m',
      '3_hours',
      '5_hours',
      '6_hours',
      '24_hours'
    )
  );

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
      when new.metadata ->> 'vanish_delay_seconds' = '15'
        then new.viewed_at + interval '15 seconds'
      when new.metadata ->> 'vanish_delay_seconds' = '60'
        then new.viewed_at + interval '1 minute'
      when new.metadata ->> 'vanish_delay_seconds' = '600'
        then new.viewed_at + interval '10 minutes'
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
  where m.auto_delete_mode = 'after_view'
    and (m.is_viewed is true or m.is_read is true)
    and coalesce(m.is_system_message, false) = false
    and coalesce(m.metadata ->> 'view_once', 'false') <> 'true'
    and coalesce(m.metadata ->> 'vanish_delay_seconds', '0') not in ('15', '60', '600')
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
      or (
        coalesce(is_system_message, false) = false
        and (
          (
            auto_delete_mode = '5_hours'
            and created_at < clock_timestamp() - interval '5 hours'
          )
          or (
            auto_delete_mode = '24_hours'
            and created_at < clock_timestamp() - interval '24 hours'
          )
          or (
            auto_delete_mode = 'after_view'
            and coalesce(metadata ->> 'view_once', 'false') = 'true'
            and expires_at is not null
            and expires_at <= clock_timestamp()
          )
          or (
            auto_delete_mode = 'after_view'
            and metadata ->> 'vanish_delay_seconds' in ('15', '60', '600')
            and expires_at is not null
            and expires_at <= clock_timestamp()
          )
          or (
            coalesce(auto_delete_mode, 'off') = 'off'
            and expires_at is not null
            and expires_at <= clock_timestamp()
          )
        )
      )
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