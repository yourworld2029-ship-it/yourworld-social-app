-- Per-user custom chat contact names require this nullable conversation field.
alter table public.conversation_preferences
  add column if not exists display_name text;
