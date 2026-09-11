-- Enforce blocks in the database, not only in the Social Chat UI.
create or replace function public.is_social_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks ub
    where (ub.blocker_id = a and ub.blocked_id = b)
       or (ub.blocker_id = b and ub.blocked_id = a)
  );
$$;

drop policy if exists messages_participants_read on public.messages;
create policy messages_participants_read
on public.messages for select to authenticated
using (
  (sender_id = auth.uid() or receiver_id = auth.uid())
  and not public.is_social_blocked(sender_id, receiver_id)
);

drop policy if exists messages_sender_insert on public.messages;
create policy messages_sender_insert
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and not public.is_social_blocked(sender_id, receiver_id)
  and ((conversation_id is null) or exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  ))
);

create or replace function public.prevent_blocked_social_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_social_blocked(new.sender_id, new.receiver_id) then
    raise exception 'This conversation is blocked';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_blocked_social_message on public.messages;
create trigger prevent_blocked_social_message
before insert on public.messages
for each row execute function public.prevent_blocked_social_message();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversation_preferences'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_preferences;
  END IF;
END
$$;