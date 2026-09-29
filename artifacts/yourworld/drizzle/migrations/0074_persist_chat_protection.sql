-- Keep the participant's screenshot-protection preference across chat sessions.
-- Both tables already store participant-scoped chat settings; no shared
-- conversation metadata or broader access-policy changes are needed.
alter table public.conversation_preferences
  add column if not exists protect_chat_enabled boolean not null default false;

alter table public.orbit_chat_settings
  add column if not exists protect_chat_enabled boolean not null default false;