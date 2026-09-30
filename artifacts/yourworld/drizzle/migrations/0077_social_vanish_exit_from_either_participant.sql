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