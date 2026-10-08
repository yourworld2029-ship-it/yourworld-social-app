-- Mentioned Moment recipients get a normal one-to-one chat message instead of
-- a global Notifications entry. Keep the existing AFTER INSERT triggers and
-- replace only their dispatch behavior.
CREATE OR REPLACE FUNCTION public.notify_moment_mentions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_row jsonb := to_jsonb(NEW);
  actor_id uuid;
  source_moment_id uuid;
  actor_username text;
  recipient_id uuid;
  mentioned_ids jsonb;
  body_text text;
  media_url text;
  thumbnail_url text;
  media_type text;
  moment_kind text;
  moment_created_at timestamptz;
  moment_expires_at timestamptz;
  canonical_thread_id text;
  conversation_id uuid;
  retention_setting text;
BEGIN
  IF TG_TABLE_NAME = 'posts'
     AND lower(coalesce(new_row ->> 'kind', '')) <> 'moment' THEN
    RETURN NEW;
  END IF;

  actor_id := nullif(new_row ->> 'user_id', '')::uuid;
  source_moment_id := nullif(new_row ->> 'id', '')::uuid;
  mentioned_ids := new_row -> 'mentioned_user_ids';

  IF actor_id IS NULL
     OR source_moment_id IS NULL
     OR jsonb_typeof(mentioned_ids) IS DISTINCT FROM 'array' THEN
    RETURN NEW;
  END IF;

  SELECT nullif(ltrim(coalesce(p.username, ''), '@'), '')
    INTO actor_username
  FROM public.profiles p
  WHERE p.id = actor_id
  LIMIT 1;

  body_text := '@' || coalesce(actor_username, 'someone') ||
    ' mentioned you in their moment';
  media_url := nullif(btrim(new_row ->> 'media_url'), '');
  thumbnail_url := coalesce(
    nullif(btrim(new_row ->> 'thumbnail_url'), ''),
    nullif(btrim(new_row ->> 'preview_thumbnail_url'), ''),
    media_url
  );
  media_type := lower(coalesce(new_row ->> 'media_type', ''));
  moment_kind := CASE
    WHEN lower(coalesce(new_row ->> 'kind', '')) = 'text' THEN 'text'
    WHEN lower(coalesce(new_row ->> 'kind', '')) = 'video'
      OR media_type LIKE 'video%' THEN 'video'
    WHEN media_url IS NOT NULL THEN 'photo'
    ELSE 'text'
  END;
  moment_created_at := coalesce(
    nullif(new_row ->> 'created_at', '')::timestamptz,
    now()
  );
  moment_expires_at := coalesce(
    nullif(new_row ->> 'expires_at', '')::timestamptz,
    moment_created_at + interval '24 hours'
  );

  FOR recipient_id IN
    SELECT DISTINCT mention.value::uuid
    FROM jsonb_array_elements_text(mentioned_ids) AS mention(value)
  LOOP
    IF recipient_id = actor_id
       OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = recipient_id) THEN
      CONTINUE;
    END IF;

    canonical_thread_id := 'dm_' ||
      least(actor_id::text, recipient_id::text) || '_' ||
      greatest(actor_id::text, recipient_id::text);

    INSERT INTO public.conversations (
      canonical_thread_id,
      participant_one_id,
      participant_two_id,
      auto_delete_setting
    )
    VALUES (
      thread_id,
      least(actor_id, recipient_id),
      greatest(actor_id, recipient_id),
      'off'
    )
    ON CONFLICT (thread_id) DO NOTHING;

    SELECT c.id, coalesce(c.auto_delete_setting, 'off')
      INTO conversation_id, retention_setting
    FROM public.conversations c
    WHERE c.thread_id = canonical_thread_id
    LIMIT 1;

    retention_setting := CASE
      WHEN retention_setting IN ('after_view', '5_hours', '24_hours')
        THEN retention_setting
      WHEN retention_setting IN ('3_hours', '6_hours')
        THEN '5_hours'
      ELSE 'off'
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.sender_id = actor_id
        AND m.receiver_id = recipient_id
        AND m.moment_id = source_moment_id
        AND m.metadata ->> 'source' = 'moment_mention'
    ) THEN
      INSERT INTO public.messages (
        sender_id,
        receiver_id,
        content,
        media_url,
        metadata,
        conversation_id,
        is_system_message,
        auto_delete_setting,
        auto_delete_mode,
        moment_id,
        moment_media_url,
        moment_created_at
      )
      VALUES (
        actor_id,
        recipient_id,
        body_text,
        NULL,
        jsonb_build_object(
          'type', 'moment_mention',
          'source', 'moment_mention',
          'moment_id', source_moment_id,
          'moment_media_url', media_url,
          'moment_created_at', moment_created_at,
          'moment_expires_at', moment_expires_at,
          'preview', jsonb_build_object(
            'media_url', media_url,
            'thumbnail_url', thumbnail_url,
            'kind', moment_kind,
            'created_at', moment_created_at,
            'expires_at', moment_expires_at
          ),
          'action', 'add_to_moment'
        ),
        conversation_id,
        false,
        retention_setting,
        retention_setting,
        source_moment_id,
        media_url,
        moment_created_at
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
