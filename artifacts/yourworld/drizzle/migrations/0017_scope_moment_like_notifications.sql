-- The interaction table is public-facing, but only a posts-backed Moment
-- should produce a Moment notification.
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
    and p.kind = 'moment'
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