-- Keep deleting a message private to the participant who chose to hide it.
-- Message rows remain intact so the other participant keeps their copy.
create table if not exists public.chat_message_hides (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists chat_message_hides_user_conversation_idx
  on public.chat_message_hides (user_id, conversation_id);

alter table public.chat_message_hides enable row level security;

drop policy if exists chat_message_hides_select_own on public.chat_message_hides;
create policy chat_message_hides_select_own
  on public.chat_message_hides for select to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.messages m
      join public.conversations c on c.id = chat_message_hides.conversation_id
      where m.id = chat_message_hides.message_id
        and (
          (m.sender_id = c.participant_one_id and m.receiver_id = c.participant_two_id)
          or (m.sender_id = c.participant_two_id and m.receiver_id = c.participant_one_id)
        )
        and auth.uid() in (m.sender_id, m.receiver_id)
    )
  );

drop policy if exists chat_message_hides_insert_own on public.chat_message_hides;
create policy chat_message_hides_insert_own
  on public.chat_message_hides for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.messages m
      join public.conversations c on c.id = chat_message_hides.conversation_id
      where m.id = chat_message_hides.message_id
        and (
          (m.sender_id = c.participant_one_id and m.receiver_id = c.participant_two_id)
          or (m.sender_id = c.participant_two_id and m.receiver_id = c.participant_one_id)
        )
        and auth.uid() in (m.sender_id, m.receiver_id)
    )
  );

drop policy if exists chat_message_hides_delete_own on public.chat_message_hides;
create policy chat_message_hides_delete_own
  on public.chat_message_hides for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.chat_message_hides to authenticated;

-- A reaction belongs to the person who set it, but both participants can see
-- it. This avoids overwriting message metadata or another participant's state.
create table if not exists public.chat_message_reactions (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default '❤️' check (reaction = '❤️'),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists chat_message_reactions_conversation_idx
  on public.chat_message_reactions (conversation_id, message_id);

alter table public.chat_message_reactions enable row level security;

drop policy if exists chat_message_reactions_select_participants on public.chat_message_reactions;
create policy chat_message_reactions_select_participants
  on public.chat_message_reactions for select to authenticated
  using (
    exists (
      select 1
      from public.messages m
      join public.conversations c on c.id = chat_message_reactions.conversation_id
      where m.id = chat_message_reactions.message_id
        and (
          (m.sender_id = c.participant_one_id and m.receiver_id = c.participant_two_id)
          or (m.sender_id = c.participant_two_id and m.receiver_id = c.participant_one_id)
        )
        and auth.uid() in (m.sender_id, m.receiver_id)
    )
  );

drop policy if exists chat_message_reactions_insert_own on public.chat_message_reactions;
create policy chat_message_reactions_insert_own
  on public.chat_message_reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.messages m
      join public.conversations c on c.id = chat_message_reactions.conversation_id
      where m.id = chat_message_reactions.message_id
        and (
          (m.sender_id = c.participant_one_id and m.receiver_id = c.participant_two_id)
          or (m.sender_id = c.participant_two_id and m.receiver_id = c.participant_one_id)
        )
        and auth.uid() in (m.sender_id, m.receiver_id)
    )
  );

drop policy if exists chat_message_reactions_delete_own on public.chat_message_reactions;
create policy chat_message_reactions_delete_own
  on public.chat_message_reactions for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.chat_message_reactions to authenticated;
