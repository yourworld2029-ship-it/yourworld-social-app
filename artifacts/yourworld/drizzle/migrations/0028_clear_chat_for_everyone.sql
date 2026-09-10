-- Permanently clear both participants' messages from a one-to-one chat.
-- The functions perform their own participant check and bypass row-level
-- delete policies only for this narrowly scoped operation.

create or replace function public.clear_social_conversation(_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.conversations c
    where c.id = _conversation_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  ) then
    raise exception 'Not a participant in this conversation';
  end if;

  delete from public.messages
  where conversation_id = _conversation_id;
end;
$$;

create or replace function public.clear_orbit_conversation(_peer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() = _peer_id then
    raise exception 'Invalid conversation participant';
  end if;

  delete from public.orbit_messages
  where (sender_id = auth.uid() and recipient_id = _peer_id)
     or (sender_id = _peer_id and recipient_id = auth.uid());
end;
$$;

revoke all on function public.clear_social_conversation(uuid) from public;
grant execute on function public.clear_social_conversation(uuid) to authenticated;
revoke all on function public.clear_orbit_conversation(uuid) from public;
grant execute on function public.clear_orbit_conversation(uuid) to authenticated;