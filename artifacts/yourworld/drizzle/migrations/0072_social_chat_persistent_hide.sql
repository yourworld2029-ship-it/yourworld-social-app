-- Persist "delete for me" visibility across devices without changing the
-- existing shared conversation-clear behavior.
alter table public.conversation_preferences
  add column if not exists hidden_at timestamptz;