-- Give canonical social DM rooms a durable conversation row and make the
-- auto-delete setting available to both participants.

alter table public.conversations
  add column if not exists thread_id text,
  add column if not exists participant_one_id uuid references auth.users(id) on delete cascade,
  add column if not exists participant_two_id uuid references auth.users(id) on delete cascade;

create unique index if not exists conversations_thread_id_key
  on public.conversations (thread_id);

alter table public.messages
  add column if not exists conversation_id uuid references public.conversations(id) on delete set null,
  add column if not exists is_system_message boolean not null default false;

-- Preserve existing chat history when it can be associated with a canonical
-- two-person room.
insert into public.conversations (
  thread_id,
  participant_one_id,
  participant_two_id,
  auto_delete_setting
)
select distinct
  'dm_' || least(m.sender_id::text, m.receiver_id::text) || '_' ||
    greatest(m.sender_id::text, m.receiver_id::text),
  least(m.sender_id, m.receiver_id),
  greatest(m.sender_id, m.receiver_id),
  'off'
from public.messages m
where m.sender_id is not null
  and m.receiver_id is not null
  and m.sender_id <> m.receiver_id
on conflict (thread_id) do nothing;

update public.messages m
set conversation_id = c.id
from public.conversations c
where m.conversation_id is null
  and m.sender_id is not null
  and m.receiver_id is not null
  and c.thread_id = (
    'dm_' || least(m.sender_id::text, m.receiver_id::text) || '_' ||
      greatest(m.sender_id::text, m.receiver_id::text)
  );

drop policy if exists "Allow all conversations access" on public.conversations;
drop policy if exists conversations_participants_read on public.conversations;
drop policy if exists conversations_participants_insert on public.conversations;
drop policy if exists conversations_participants_update on public.conversations;

create policy conversations_participants_read
on public.conversations for select to authenticated
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

create policy conversations_participants_insert
on public.conversations for insert to authenticated
with check (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

create policy conversations_participants_update
on public.conversations for update to authenticated
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id)
with check (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists messages_sender_insert on public.messages;
create policy messages_sender_insert
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and (
    conversation_id is null
    or exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
    )
  )
);

-- System notices should never inherit a disappearing-message lifetime.
create or replace function public.apply_message_auto_delete()
returns trigger language plpgsql
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

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end
$$;