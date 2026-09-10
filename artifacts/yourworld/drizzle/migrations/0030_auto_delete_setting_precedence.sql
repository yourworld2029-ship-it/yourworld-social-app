-- Prefer the shared setting when both legacy mode columns are present.
-- This keeps an explicitly selected setting authoritative for older clients.

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
    when new.auto_delete_setting in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_setting
    when new.auto_delete_mode in ('after_view', '6_hours', '24_hours')
      then new.auto_delete_mode
    else 'off'
  end;

  expiring_media :=
    coalesce(new.media_url, '') <> ''
    or coalesce(new.voice_note_url, '') <> ''
    or coalesce(new.metadata ->> 'expiring_media', 'false') = 'true';

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