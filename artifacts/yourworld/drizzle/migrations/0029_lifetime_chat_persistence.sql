-- Keep chat rows forever by default and scope after-view expiry to explicitly
-- expiring media. Timed expiry remains opt-in through the shared setting.

create or replace function public.apply_message_auto_delete()
returns trigger language plpgsql
set search_path = public
as $$
declare
  mode text;
  expiring_media boolean;
begin
  if coalesce(new.is_system_message, false) then
    new.auto_delete_mode := 'off';
    new.auto_delete_setting := 'off';
    new.expires_at := null;
    return new;
  end if;

  mode := case
    when new.auto_delete_mode in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_mode
    when new.auto_delete_setting in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_setting
    else 'off'
  end;

  expiring_media :=
    coalesce(new.media_url, '') <> ''
    or coalesce(new.voice_note_url, '') <> ''
    or coalesce(new.metadata ->> 'expiring_media', 'false') = 'true';

  -- After-view is a media-only behavior. Text stays permanent unless a
  -- time-based setting was explicitly selected.
  if mode = 'after_view' and not expiring_media then
    mode := 'off';
  end if;

  new.auto_delete_mode := mode;
  new.auto_delete_setting := mode;
  new.expires_at := case mode
    when '6_hours' then now() + interval '6 hours'
    when '24_hours' then now() + interval '24 hours'
    else null
  end;
  return new;
end
$$;

create or replace function public.apply_orbit_message_auto_delete()
returns trigger language plpgsql
set search_path = public
as $$
declare
  mode text;
  expiring_media boolean;
begin
  mode := case
    when new.auto_delete_setting in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_setting
    else 'off'
  end;

  expiring_media :=
    new.view_once
    or new.kind in ('photo', 'video', 'audio');

  if mode = 'after_view' and not expiring_media then
    mode := 'off';
  end if;

  new.auto_delete_setting := mode;
  new.expires_at := case mode
    when '6_hours' then now() + interval '6 hours'
    when '24_hours' then now() + interval '24 hours'
    else null
  end;
  return new;
end
$$;

drop trigger if exists orbit_messages_apply_auto_delete on public.orbit_messages;
create trigger orbit_messages_apply_auto_delete
before insert on public.orbit_messages
for each row execute function public.apply_orbit_message_auto_delete();