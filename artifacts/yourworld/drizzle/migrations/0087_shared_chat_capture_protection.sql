-- Make chat capture protection a shared conversation setting. The participant
-- who enables it owns the off-switch so the other participant cannot disable
-- the protection from their client.
alter table public.conversations
  add column if not exists protect_chat_enabled boolean not null default false,
  add column if not exists protect_chat_enabled_by uuid;

-- Preserve protection that was already enabled in either participant's
-- private preference row, choosing a deterministic owner if both had it on.
update public.conversations c
set
  protect_chat_enabled = true,
  protect_chat_enabled_by = (
    select p.user_id
    from public.conversation_preferences p
    where p.conversation_id = c.id
      and p.protect_chat_enabled = true
    order by p.updated_at asc, p.user_id asc
    limit 1
  )
where exists (
  select 1
  from public.conversation_preferences p
  where p.conversation_id = c.id
    and p.protect_chat_enabled = true
);

do $constraint$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_protect_chat_owner_consistent'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_protect_chat_owner_consistent
      check (
        (protect_chat_enabled and protect_chat_enabled_by is not null)
        or (not protect_chat_enabled and protect_chat_enabled_by is null)
      );
  end if;
end
$constraint$;

create or replace function public.guard_shared_chat_capture_protection()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if new.protect_chat_enabled then
      if actor_id is null then
        raise exception 'Authenticated user required to enable chat protection';
      end if;
      new.protect_chat_enabled_by := actor_id;
    else
      new.protect_chat_enabled_by := null;
    end if;
    return new;
  end if;

  if old.protect_chat_enabled then
    if not new.protect_chat_enabled then
      if old.protect_chat_enabled_by is not null
        and old.protect_chat_enabled_by is distinct from actor_id then
        raise exception 'Only the user who enabled chat protection can turn it off';
      end if;
      new.protect_chat_enabled_by := null;
    elsif new.protect_chat_enabled_by is distinct from old.protect_chat_enabled_by then
      raise exception 'The chat protection owner cannot be changed while protection is on';
    end if;
  elsif new.protect_chat_enabled then
    if actor_id is null then
      raise exception 'Authenticated user required to enable chat protection';
    end if;
    new.protect_chat_enabled_by := actor_id;
  else
    new.protect_chat_enabled_by := null;
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_shared_capture_protection_guard on public.conversations;
create trigger conversations_shared_capture_protection_guard
before insert or update of protect_chat_enabled, protect_chat_enabled_by
on public.conversations
for each row
execute function public.guard_shared_chat_capture_protection();

do $publication$
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
$publication$;
