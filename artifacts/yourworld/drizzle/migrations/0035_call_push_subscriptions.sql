-- Durable device registrations for background call notifications.
-- Provider credentials and delivery remain server-side; the browser stores only
-- its public subscription material.

create table if not exists public.call_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  provider text not null default 'webpush'
    check (provider in ('webpush', 'fcm', 'apns')),
  subscription jsonb not null,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.call_push_subscriptions enable row level security;

drop policy if exists call_push_subscriptions_owner on public.call_push_subscriptions;
create policy call_push_subscriptions_owner
  on public.call_push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.call_push_subscriptions to authenticated;
create index if not exists call_push_subscriptions_user_idx
  on public.call_push_subscriptions (user_id, last_seen_at desc);