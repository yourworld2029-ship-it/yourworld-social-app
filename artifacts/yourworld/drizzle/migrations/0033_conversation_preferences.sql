-- Social Chat preferences are private to one participant in one conversation.
-- The shared effective auto-delete value remains on conversations.
create table if not exists public.conversation_preferences (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_locked boolean not null default false,
  secret_pin_salt text,
  secret_pin_hash text,
  view_once boolean not null default false,
  auto_delete_setting text not null default 'off',
  screenshot_alert boolean not null default true,
  screen_recording_alert boolean not null default true,
  is_muted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id),
  constraint conversation_preferences_auto_delete_check
    check (auto_delete_setting in ('off', 'after_view', '6_hours', '24_hours'))
);

create index if not exists conversation_preferences_user_idx
  on public.conversation_preferences (user_id, conversation_id);

alter table public.conversation_preferences enable row level security;

drop policy if exists conversation_preferences_select on public.conversation_preferences;
create policy conversation_preferences_select
on public.conversation_preferences for select to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  )
);

drop policy if exists conversation_preferences_insert on public.conversation_preferences;
create policy conversation_preferences_insert
on public.conversation_preferences for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  )
);

drop policy if exists conversation_preferences_update on public.conversation_preferences;
create policy conversation_preferences_update
on public.conversation_preferences for update to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  )
);

drop policy if exists conversation_preferences_delete on public.conversation_preferences;
create policy conversation_preferences_delete
on public.conversation_preferences for delete to authenticated
using (user_id = auth.uid());