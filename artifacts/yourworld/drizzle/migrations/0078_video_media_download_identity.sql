-- Additive media repair; never replaces existing buckets or clears records.
alter table public.posts add column if not exists cloudflare_stream_id text;
alter table public.posts add column if not exists cloudflare_stream_uid text;
alter table public.posts add column if not exists hls_url text;
alter table public.posts add column if not exists source_url text;
alter table public.posts add column if not exists thumbnail_url text;
alter table public.posts add column if not exists video_url text;

insert into storage.buckets (id, name, public)
values ('videos', 'videos', true), ('reels', 'reels', true), ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public thumbnail reads') then
    create policy "Public thumbnail reads" on storage.objects for select to public
      using (bucket_id='thumbnails');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Owner thumbnail uploads') then
    create policy "Owner thumbnail uploads" on storage.objects for insert to authenticated
      with check (bucket_id='thumbnails' and (storage.foldername(name))[1]=auth.uid()::text);
  end if;
end $$;

create or replace function public.sync_video_media_identity()
returns trigger language plpgsql set search_path=public as $$
declare stream_id text;
begin
  if new.kind not in ('video','reel') then return new; end if;
  stream_id := coalesce(nullif(new.cloudflare_stream_id,''),nullif(new.cloudflare_stream_uid,''));
  if stream_id is null then
    stream_id := substring(coalesce(new.hls_url,new.media_url) from '/([a-zA-Z0-9_-]{8,128})/manifest/video[.]m3u8');
  end if;
  new.cloudflare_stream_id := stream_id;
  new.cloudflare_stream_uid := stream_id;
  if coalesce(new.media_url,'') like '%/manifest/video.m3u8%' then
    new.hls_url := coalesce(nullif(new.hls_url,''),new.media_url);
  else
    new.video_url := coalesce(nullif(new.video_url,''),nullif(new.source_url,''),new.media_url);
  end if;
  new.source_url := coalesce(nullif(new.source_url,''),nullif(new.video_url,''));
  if stream_id is not null and coalesce(new.thumbnail_url,'')='' and
     coalesce(new.video_access,'public')='public' and coalesce(new.price,0)=0 then
    new.thumbnail_url := 'https://videodelivery.net/'||stream_id||'/thumbnails/thumbnail.jpg?time=1s';
  end if;
  return new;
end $$;
drop trigger if exists sync_video_media_identity on public.posts;
create trigger sync_video_media_identity before insert or update of media_url,video_url,source_url,hls_url,cloudflare_stream_id,cloudflare_stream_uid,thumbnail_url
on public.posts for each row execute function public.sync_video_media_identity();

-- Re-run normalization for existing rows without overwriting source/thumbnail data.
update public.posts set media_url=media_url where kind in ('video','reel');