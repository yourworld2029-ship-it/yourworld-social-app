-- Enforce recipient-view expiry on the server, atomically consume view-once
-- media, and keep the lifetime clock anchored to the first view.

create or replace function public.apply_social_message_view_expiry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.is_viewed is distinct from true
    and new.is_viewed is true
    and new.auto_delete_mode = 'after_view'
    and coalesce(new.is_system_message, false) = false
  then
    if auth.uid() is not null and auth.uid() <> new.receiver_id then
      raise exception 'Only the recipient can mark a chat message viewed';
    end if;
    new.is_read := true;
    new.viewed_at := clock_timestamp();
    new.expires_at := new.viewed_at + interval '5 seconds';
  end if;
  return new;
end
$$;

drop trigger if exists messages_apply_view_expiry on public.messages;
create trigger messages_apply_view_expiry
before update of is_viewed on public.messages
for each row execute function public.apply_social_message_view_expiry();

create or replace function public.consume_social_view_once(_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.messages
  set is_viewed = true
  where id = _message_id
    and receiver_id = auth.uid()
    and coalesce(is_system_message, false) = false
    and auto_delete_mode = 'after_view'
    and coalesce(metadata ->> 'view_once', 'false') = 'true'
    and coalesce(is_viewed, false) = false
    and coalesce(is_deleted, false) = false;

  return found;
end
$$;

revoke all on function public.consume_social_view_once(uuid) from public, anon;
grant execute on function public.consume_social_view_once(uuid) to authenticated;