-- Moment reactions use the existing posts-backed Moment records in the live
-- schema. Keep this table independent of posts so the app can later move
-- Moments to their own table without changing the client contract.
alter table if exists public.messages
  add column if not exists metadata jsonb default '{}'::jsonb;

create table if not exists public.moment_likes (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (moment_id, user_id)
);

create index if not exists moment_likes_moment_id_idx
  on public.moment_likes(moment_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);

alter table public.moment_likes enable row level security;
alter table public.notifications enable row level security;

drop policy if exists moment_likes_read on public.moment_likes;
create policy moment_likes_read on public.moment_likes
  for select to authenticated
  using (true);

drop policy if exists moment_likes_insert on public.moment_likes;
create policy moment_likes_insert on public.moment_likes
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists moment_likes_delete on public.moment_likes;
create policy moment_likes_delete on public.moment_likes
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications
  for select to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Canonical messages are private to their two participants. This replaces
-- the old public-all policy that was present in the live database.
drop policy if exists "Allow all messages access" on public.messages;
drop policy if exists "Allow all messages" on public.messages;
drop policy if exists messages_allow_all on public.messages;
drop policy if exists messages_participants_read on public.messages;
create policy messages_participants_read on public.messages
  for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists messages_sender_insert on public.messages;
create policy messages_sender_insert on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid());

drop policy if exists messages_participants_update on public.messages;
create policy messages_participants_update on public.messages
  for update to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid())
  with check (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists messages_sender_delete on public.messages;
create policy messages_sender_delete on public.messages
  for delete to authenticated
  using (sender_id = auth.uid());

grant select, insert, delete on public.moment_likes to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

-- Preserve any existing Moment likes that were previously stored in likes.
insert into public.moment_likes (moment_id, user_id, created_at)
select l.post_id, l.user_id, coalesce(l.created_at, now())
from public.likes l
join public.posts p on p.id = l.post_id
where p.kind = 'moment'
on conflict (moment_id, user_id) do nothing;

create or replace function public.notify_moment_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select p.user_id into owner_id
  from public.posts p
  where p.id = new.moment_id
  limit 1;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (
      recipient_id, actor_id, kind, title, entity_type, entity_id, metadata
    )
    values (
      owner_id,
      new.user_id,
      'like',
      'Someone liked your Moment',
      'moment',
      new.moment_id,
      jsonb_build_object('source', 'moment', 'moment_id', new.moment_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists moment_like_notification on public.moment_likes;
create trigger moment_like_notification
  after insert on public.moment_likes
  for each row execute function public.notify_moment_like();

alter table public.moment_likes replica identity full;
alter table public.notifications replica identity full;
alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'moment_likes'
  ) then
    alter publication supabase_realtime add table public.moment_likes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;