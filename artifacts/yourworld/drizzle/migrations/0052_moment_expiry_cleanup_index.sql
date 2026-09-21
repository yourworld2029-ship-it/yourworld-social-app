-- Keep expiry cleanup bounded to the rows that are eligible for deletion.
create index if not exists moments_expires_at_idx
  on public.moments (expires_at)
  where expires_at is not null;

-- Supabase projects do not all have the scheduler extensions enabled by
-- default. When available, run the storage-aware Edge Function every five
-- minutes so cleanup does not depend on an app session being open.
create extension if not exists pg_net;
create extension if not exists pg_cron;

do $schedule$
begin
  if not exists (
    select 1 from cron.job where jobname = 'purge-expired-moments'
  ) then
    perform cron.schedule(
      'purge-expired-moments',
      '*/5 * * * *',
      $job$
        select net.http_post(
          url := 'https://pnpfybcdxynfooylxqou.supabase.co/functions/v1/purge-expired-moments',
          headers := '{"Content-Type":"application/json"}'::jsonb,
          body := '{}'::jsonb
        );
      $job$
    );
  end if;
end
$schedule$;