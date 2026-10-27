-- Persist real Reel account tags, deliver a Reel preview in the tagged user's
-- 1:1 chat, and let only that tagged user remove their own tag.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS tagged_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

CREATE OR REPLACE FUNCTION public.notify_reel_tagged_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tagged_user_id uuid;
  v_creator_name text;
  v_thread_id text;
  v_conversation_id uuid;
  v_metadata jsonb;
BEGIN
  IF NEW.kind IS DISTINCT FROM 'reel' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    NULLIF(profile.display_name, ''),
    NULLIF(profile.full_name, ''),
    NULLIF(profile.username, ''),
    'A creator'
  )
  INTO v_creator_name
  FROM public.profiles profile
  WHERE profile.id = NEW.user_id;

  FOREACH v_tagged_user_id IN ARRAY COALESCE(NEW.tagged_user_ids, '{}'::uuid[])
  LOOP
    IF v_tagged_user_id = NEW.user_id THEN
      CONTINUE;
    END IF;
    IF TG_OP = 'UPDATE'
      AND v_tagged_user_id = ANY(COALESCE(OLD.tagged_user_ids, '{}'::uuid[]))
    THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles profile WHERE profile.id = v_tagged_user_id
    ) THEN
      CONTINUE;
    END IF;

    v_thread_id := 'dm_' ||
      least(NEW.user_id::text, v_tagged_user_id::text) || '_' ||
      greatest(NEW.user_id::text, v_tagged_user_id::text);
    INSERT INTO public.conversations (
      thread_id, participant_one_id, participant_two_id, auto_delete_setting
    )
    VALUES (
      v_thread_id,
      least(NEW.user_id, v_tagged_user_id),
      greatest(NEW.user_id, v_tagged_user_id),
      'off'
    )
    ON CONFLICT (thread_id) DO NOTHING;

    SELECT conversation.id
    INTO v_conversation_id
    FROM public.conversations conversation
    WHERE conversation.thread_id = v_thread_id
    LIMIT 1;

    v_metadata := jsonb_build_object(
      'type', 'reel_tag',
      'source', 'reel_tag',
      'post_id', NEW.id,
      'creator_id', NEW.user_id,
      'tagged_user_id', v_tagged_user_id,
      'status', 'active',
      'thumbnail_url', NEW.thumbnail_url,
      'shared_media', jsonb_build_object(
        'id', NEW.id,
        'kind', 'reel',
        'title', COALESCE(NULLIF(NEW.caption, ''), 'Reel tag'),
        'thumbnail_url', NEW.thumbnail_url,
        'thumbnail_bucket', 'thumbnails'
      )
    );

    INSERT INTO public.messages (
      sender_id,
      receiver_id,
      content,
      media_url,
      metadata,
      conversation_id,
      is_system_message,
      auto_delete_setting,
      auto_delete_mode
    )
    SELECT
      NEW.user_id,
      v_tagged_user_id,
      COALESCE(v_creator_name, 'A creator') || ' tagged you in a Reel',
      NULL,
      v_metadata,
      v_conversation_id,
      false,
      'off',
      'off'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.messages message
      WHERE message.sender_id = NEW.user_id
        AND message.receiver_id = v_tagged_user_id
        AND message.metadata ->> 'source' = 'reel_tag'
        AND message.metadata ->> 'post_id' = NEW.id::text
        AND message.metadata ->> 'tagged_user_id' = v_tagged_user_id::text
        AND message.metadata ->> 'status' = 'active'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_notify_reel_tags ON public.posts;
CREATE TRIGGER posts_notify_reel_tags
AFTER INSERT OR UPDATE OF tagged_user_ids ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_reel_tagged_users();

CREATE OR REPLACE FUNCTION public.remove_my_reel_tag(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_post public.posts%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to remove your Reel tag';
  END IF;

  SELECT *
  INTO v_post
  FROM public.posts
  WHERE id = p_post_id
    AND kind = 'reel'
  FOR UPDATE;

  IF NOT FOUND OR NOT (v_user_id = ANY(COALESCE(v_post.tagged_user_ids, '{}'::uuid[]))) THEN
    RAISE EXCEPTION 'You are not tagged in this Reel';
  END IF;

  UPDATE public.posts
  SET tagged_user_ids = array_remove(tagged_user_ids, v_user_id)
  WHERE id = p_post_id;

  UPDATE public.messages
  SET metadata = COALESCE(metadata, '{}'::jsonb) ||
    jsonb_build_object('status', 'removed', 'removed_at', now())
  WHERE receiver_id = v_user_id
    AND metadata ->> 'source' = 'reel_tag'
    AND metadata ->> 'post_id' = p_post_id::text
    AND metadata ->> 'tagged_user_id' = v_user_id::text
    AND metadata ->> 'status' = 'active';

  RETURN jsonb_build_object('post_id', p_post_id, 'status', 'removed');
END;
$$;

REVOKE ALL ON FUNCTION public.remove_my_reel_tag(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_my_reel_tag(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.notify_reel_tagged_users() FROM PUBLIC, anon, authenticated;
