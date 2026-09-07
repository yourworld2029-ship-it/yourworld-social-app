-- Keep enough Moment context on chat messages to render a durable reply preview.
-- The metadata JSON fallback remains populated by the client for older schemas.

alter table public.messages
  add column if not exists moment_id uuid,
  add column if not exists moment_media_url text,
  add column if not exists moment_created_at timestamptz;

create index if not exists messages_moment_id_idx
  on public.messages (moment_id)
  where moment_id is not null;

alter table public.messages replica identity full;