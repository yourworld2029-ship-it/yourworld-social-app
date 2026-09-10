-- Clear message rows, call-log messages, and durable call rows for the same
-- two participants. This remains participant-authorized and bypasses the
-- sender-only delete policies only inside the clear operation.

create or replace function public.clear_social_conversation(_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_one uuid;
  participant_two uuid;
begin
  select c.participant_one_id, c.participant_two_id
    into participant_one, participant_two
  from public.conversations c
  where c.id = _conversation_id
    and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid());

  if participant_one is null or participant_two is null then
    raise exception 'Not a participant in this conversation';
  end if;

  delete from public.messages
  where conversation_id = _conversation_id
     or (
       (sender_id = participant_one and receiver_id = participant_two)
       or (sender_id = participant_two and receiver_id = participant_one)
     );

  delete from public.calls
  where (caller_id = participant_one and receiver_id = participant_two)
     or (caller_id = participant_two and receiver_id = participant_one);
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

  delete from public.calls
  where (caller_id = auth.uid() and receiver_id = _peer_id)
     or (caller_id = _peer_id and receiver_id = auth.uid());
end;
$$;