-- Forward cleanup for the retired Orbit product.
-- Social Chat settings are copied only when a matching Social conversation
-- exists. This migration is staged in source and is not applied by this task.

alter table public.conversation_preferences
  add column if not exists display_name text;

do $backfill$
begin
  if to_regclass('public.orbit_chat_settings') is not null then
    execute $sql$
      insert into public.conversation_preferences as current_preferences (
        conversation_id,
        user_id,
        is_locked,
        secret_pin_salt,
        secret_pin_hash,
        view_once,
        screenshot_alert,
        screen_recording_alert,
        protect_chat_enabled,
        is_muted,
        display_name
      )
      select distinct on (c.id, legacy.user_id)
        c.id,
        legacy.user_id,
        coalesce(legacy.secret_lock_enabled, false)
          and nullif(legacy.secret_pin_salt, '') is not null
          and nullif(legacy.secret_pin_hash, '') is not null,
        legacy.secret_pin_salt,
        legacy.secret_pin_hash,
        coalesce(legacy.view_once_mode, false),
        coalesce(legacy.screenshot_alert, true),
        coalesce(legacy.recording_alert, true),
        coalesce(legacy.protect_chat_enabled, false),
        coalesce(legacy.muted, false),
        nullif(btrim(legacy.display_name), '')
      from public.orbit_chat_settings legacy
      join public.conversations c
        on (
          (c.participant_one_id = legacy.user_id and c.participant_two_id = legacy.peer_id)
          or
          (c.participant_two_id = legacy.user_id and c.participant_one_id = legacy.peer_id)
        )
      order by c.id, legacy.user_id, legacy.updated_at desc
      on conflict (conversation_id, user_id) do update
      set
        display_name = coalesce(
          nullif(btrim(current_preferences.display_name), ''),
          excluded.display_name
        ),
        secret_pin_salt = coalesce(
          current_preferences.secret_pin_salt,
          excluded.secret_pin_salt
        ),
        secret_pin_hash = coalesce(
          current_preferences.secret_pin_hash,
          excluded.secret_pin_hash
        ),
        is_locked = current_preferences.is_locked or excluded.is_locked,
        is_muted = current_preferences.is_muted or excluded.is_muted,
        updated_at = now()
    $sql$;
  end if;
end
$backfill$;

-- Preserve the shared Social/direct-message cleanup while removing its former
-- dependency on Orbit message rows.
create or replace function public.delete_expired_chat_messages()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  social_count integer := 0;
  direct_count integer := 0;
begin
  delete from public.messages
  where (
      is_deleted = true
      or (expires_at is not null and expires_at <= now())
    )
    and media_url is null
    and voice_note_url is null
    and metadata ->> 'media_path' is null;
  get diagnostics social_count = row_count;

  delete from public.direct_messages
  where expires_at is not null
    and expires_at <= now()
    and media_url is null;
  get diagnostics direct_count = row_count;

  return social_count + direct_count;
end
$$;

-- Keep the transactional account-deletion pipeline intact without references
-- to the retired request tables.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  account_id uuid := auth.uid();
begin
  if account_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.comment_likes where user_id = account_id;
  delete from public.comments where user_id = account_id;
  delete from public.likes where user_id = account_id;
  delete from public.post_saves where user_id = account_id;
  delete from public.notifications
    where recipient_id = account_id or actor_id = account_id;
  delete from public.follows
    where follower_id = account_id or following_id = account_id;
  delete from public.call_push_subscriptions where user_id = account_id;

  delete from public.conversation_preferences
    where user_id = account_id
       or conversation_id in (
         select id
         from public.conversations
         where participant_one_id = account_id or participant_two_id = account_id
       );
  delete from public.messages
    where sender_id = account_id
       or receiver_id = account_id
       or conversation_id in (
         select id
         from public.conversations
         where participant_one_id = account_id or participant_two_id = account_id
       );
  delete from public.thread_participants
    where user_id = account_id
       or thread_id in (
         select thread_id
         from public.conversations
         where participant_one_id = account_id or participant_two_id = account_id
       );
  delete from public.conversations
    where participant_one_id = account_id or participant_two_id = account_id;

  delete from public.user_roles where user_id = account_id;
  delete from public.admin_action_audit
    where admin_user_id = account_id or target_user_id = account_id;
  delete from public.admin_account_restrictions
    where user_id = account_id or created_by = account_id or lifted_by = account_id;
  delete from public.sports_verification_review_audit
    where applicant_user_id = account_id or admin_user_id = account_id;
  delete from public.sports_verification_details where user_id = account_id;
  delete from public.copyright_reports where reporter_user_id = account_id;
  delete from public.video_access_grants
    where user_id = account_id
       or granted_by = account_id
       or post_id in (select id from public.posts where user_id = account_id);

  delete from public.posts where user_id = account_id;
  delete from public.moments where user_id = account_id;
  delete from public.highlights where user_id = account_id;
  delete from public.profiles where id = account_id;

  delete from auth.users where id = account_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Remove policies associated with the dedicated Orbit Storage bucket.
do $storage_policies$
declare
  policy record;
begin
  for policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and policyname ilike '%orbit%'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy.policyname,
      policy.schemaname,
      policy.tablename
    );
  end loop;
end
$storage_policies$;

-- The dedicated bucket is Orbit-only. Shared buckets are deliberately kept.
do $storage_objects$
begin
  if to_regclass('storage.objects') is not null then
    execute 'delete from storage.objects where bucket_id = ''orbit-media''';
  end if;
  if to_regclass('storage.buckets') is not null then
    execute 'delete from storage.buckets where id = ''orbit-media''';
  end if;
end
$storage_objects$;

-- Dropping tables also removes their indexes, triggers, grants, and policies.
do $orbit_tables$
declare
  relation_name text;
begin
  for relation_name in
    select format('%I.%I', n.nspname, c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and left(c.relname, 6) = 'orbit_'
  loop
    execute format('drop table if exists %s cascade', relation_name);
  end loop;
end
$orbit_tables$;

-- Remove Orbit RPCs and triggers after their table dependencies are gone.
do $orbit_functions$
declare
  function_signature text;
begin
  for function_signature in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname ilike '%orbit%'
  loop
    execute format('drop function if exists %s', function_signature);
  end loop;
end
$orbit_functions$;