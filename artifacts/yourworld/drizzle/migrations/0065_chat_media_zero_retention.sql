-- Keep media-bearing chat rows until their app-owned Storage objects have been
-- removed by the privileged cleanup function. Text-only expired rows can still
-- be removed by the authenticated client sweep.
create or replace function public.delete_expired_chat_messages()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  social_count integer := 0;
  direct_count integer := 0;
  orbit_count integer := 0;
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

  delete from public.orbit_messages
  where expires_at is not null
    and expires_at <= now()
    and url is null;
  get diagnostics orbit_count = row_count;

  return social_count + direct_count + orbit_count;
end
$$;

-- Claim Orbit view-once messages first. The recipient gets the URL only after
-- the atomic claim; the server removes the object and row after the bytes load.
create or replace function public.consume_orbit_view_once(_msg_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  media text;
begin
  if auth.uid() is null then
    return null;
  end if;

  update public.orbit_messages
  set is_viewed = true,
      viewed_at = clock_timestamp(),
      expires_at = clock_timestamp() + interval '5 seconds'
  where id = _msg_id
    and recipient_id = auth.uid()
    and view_once = true
    and url is not null
    and coalesce(is_viewed, false) = false
  returning url into media;

  return media;
end
$$;

revoke all on function public.consume_orbit_view_once(uuid) from public, anon;
grant execute on function public.consume_orbit_view_once(uuid) to authenticated;

-- A random token gates the scheduled Edge Function because the pg_net request
-- intentionally does not carry a user JWT. The token stays in Supabase Vault.
do $$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'chat_retention_cron_token'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'chat_retention_cron_token',
      'Private token for the scheduled chat media cleanup function'
    );
  end if;
end
$$;

create or replace function public.verify_chat_retention_token(_candidate text)
returns boolean
language sql
security definer
set search_path = pg_catalog, vault
as $$
  select _candidate is not null
    and exists (
      select 1
      from vault.decrypted_secrets
      where name = 'chat_retention_cron_token'
        and decrypted_secret = _candidate
    )
$$;

revoke all on function public.verify_chat_retention_token(text) from public, anon, authenticated;
grant execute on function public.verify_chat_retention_token(text) to service_role;

do $$
declare
  existing_job bigint;
begin
  select jobid
    into existing_job
  from cron.job
  where jobname = 'purge-expired-chat-media';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'purge-expired-chat-media',
    '* * * * *',
    $job$
      select net.http_post(
        url := 'https://pnpfybcdxynfooylxqou.supabase.co/functions/v1/purge-expired-chat-media',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-retention-token', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'chat_retention_cron_token'
            limit 1
          )
        ),
        body := '{}'::jsonb
      );
    $job$
  );
end
$$;