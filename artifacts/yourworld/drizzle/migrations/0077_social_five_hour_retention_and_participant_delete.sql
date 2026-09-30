-- Social Chat replaces its three-hour selector with five hours. Legacy
-- three/six-hour values remain accepted for old clients but normalize to 5h.

alter table public.conversations
  drop constraint if exists conversations_auto_delete_setting_check;
alter table public.conversations
  add constraint conversations_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '3_hours', '5_hours', '6_hours', '24_hours'));

alter table public.conversation_preferences
  drop constraint if exists conversation_preferences_auto_delete_check;
alter table public.conversation_preferences
  add constraint conversation_preferences_auto_delete_check
  check (auto_delete_setting in ('off', 'after_view', '3_hours', '5_hours', '6_hours', '24_hours'));

alter table public.messages
  drop constraint if exists messages_auto_delete_setting_check;
alter table public.messages
  add constraint messages_auto_delete_setting_check
  check (auto_delete_setting in ('off', 'after_view', '3_hours', '5_hours', '6_hours', '24_hours'));

alter table public.messages
  drop constraint if exists messages_auto_delete_mode_check;
alter table public.messages
  add constraint messages_auto_delete_mode_check
  check (auto_delete_mode in ('off', 'after_view', '3_hours', '5_hours', '6_hours', '24_hours'));

update public.conversations
set auto_delete_setting = '5_hours'
where auto_delete_setting in ('3_hours', '6_hours');

update public.conversation_preferences
set auto_delete_setting = '5_hours'
where auto_delete_setting in ('3_hours', '6_hours');

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
    when new.auto_delete_setting in ('after_view', '5_hours', '24_hours')
      then new.auto_delete_setting
    when new.auto_delete_setting in ('3_hours', '6_hours')
      then '5_hours'
    when new.auto_delete_mode in ('after_view', '5_hours', '24_hours')
      then new.auto_delete_mode
    when new.auto_delete_mode in ('3_hours', '6_hours')
      then '5_hours'
    else 'off'
  end;

  new.auto_delete_mode := mode;
  new.auto_delete_setting := mode;
  new.expires_at := case mode
    when '5_hours' then coalesce(new.created_at, now()) + interval '5 hours'
    when '24_hours' then coalesce(new.created_at, now()) + interval '24 hours'
    else null
  end;
  return new;
end
$$;

-- Rebase existing timed Social rows from created_at, including rows whose
-- previous three-hour expires_at snapshot would otherwise delete them early.
with normalized_modes as (
  select
    id,
    case
      when auto_delete_setting in ('3_hours', '5_hours', '6_hours') then '5_hours'
      when auto_delete_setting = '24_hours' then '24_hours'
      when auto_delete_mode in ('3_hours', '5_hours', '6_hours') then '5_hours'
      when auto_delete_mode = '24_hours' then '24_hours'
    end as retention_mode
  from public.messages
  where coalesce(is_system_message, false) = false
    and (
      auto_delete_setting in ('3_hours', '5_hours', '6_hours', '24_hours')
      or auto_delete_mode in ('3_hours', '5_hours', '6_hours', '24_hours')
    )
)
update public.messages as m
set auto_delete_setting = normalized_modes.retention_mode,
    auto_delete_mode = normalized_modes.retention_mode,
    expires_at = case normalized_modes.retention_mode
      when '5_hours' then coalesce(m.created_at, now()) + interval '5 hours'
      when '24_hours' then coalesce(m.created_at, now()) + interval '24 hours'
    end
from normalized_modes
where m.id = normalized_modes.id;

create index if not exists messages_auto_delete_mode_created_at_idx
  on public.messages (auto_delete_mode, created_at)
  where auto_delete_mode in ('5_hours', '24_hours');

-- Either authenticated participant can remove rows in their direct conversation.
drop policy if exists messages_participants_delete on public.messages;
create policy messages_participants_delete on public.messages
  for delete to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());
grant delete on public.messages to authenticated;

-- Read receipts from either participant make ordinary Vanish rows eligible.
-- View Once media keeps its separate five-second cleanup path.
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

-- The minute cron enforces created_at age for Social text. Explicit View Once
-- rows continue to use the five-second expires_at value set when opened.
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