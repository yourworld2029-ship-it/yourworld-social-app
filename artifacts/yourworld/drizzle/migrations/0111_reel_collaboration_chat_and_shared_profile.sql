-- Deliver Reel collaboration invitations in the recipient's existing 1:1 chat
-- and let either accepted collaborator unlink the Reel.

CREATE OR REPLACE FUNCTION public.create_reel_collaboration_invite(
  p_post_id uuid,
  p_collaborator_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_creator_id uuid := auth.uid();
  v_post public.posts%ROWTYPE;
  v_invite_id uuid;
  v_creator_name text;
  v_thread_id text;
  v_conversation_id uuid;
  v_metadata jsonb;
BEGIN
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to invite a collaborator';
  END IF;
  IF p_collaborator_id IS NULL OR p_collaborator_id = v_creator_id THEN
    RAISE EXCEPTION 'Choose a different user as collaborator';
  END IF;

  SELECT *
  INTO v_post
  FROM public.posts
  WHERE id = p_post_id
    AND user_id = v_creator_id
    AND kind = 'reel'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This Reel is not owned by your account';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles profile WHERE profile.id = p_collaborator_id
  ) THEN
    RAISE EXCEPTION 'The selected collaborator does not exist';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.reel_collaboration_invites active_invite
    WHERE active_invite.post_id = p_post_id
      AND active_invite.status IN ('pending', 'accepted')
      AND active_invite.collaborator_id <> p_collaborator_id
  ) THEN
    RAISE EXCEPTION 'A Reel can have at most one active collaborator';
  END IF;

  SELECT COALESCE(
    NULLIF(profile.display_name, ''),
    NULLIF(profile.full_name, ''),
    NULLIF(profile.username, ''),
    'A creator'
  )
  INTO v_creator_name
  FROM public.profiles profile
  WHERE profile.id = v_creator_id;

  INSERT INTO public.reel_collaboration_invites (
    post_id, creator_id, collaborator_id, status, responded_at
  )
  VALUES (p_post_id, v_creator_id, p_collaborator_id, 'pending', NULL)
  ON CONFLICT (post_id, collaborator_id) DO UPDATE
    SET status = 'pending',
        updated_at = now(),
        responded_at = NULL
  RETURNING id INTO v_invite_id;

  INSERT INTO public.notifications (
    recipient_id, actor_id, kind, title, body, entity_type, entity_id, metadata
  )
  VALUES (
    p_collaborator_id,
    v_creator_id,
    'collaboration',
    v_creator_name || ' invited you to collaborate on a Reel',
    'Review the Reel preview and accept or decline the invitation.',
    'reel',
    p_post_id,
    jsonb_build_object(
      'source', 'reel_collaboration_invite',
      'invite_id', v_invite_id,
      'post_id', p_post_id,
      'status', 'pending',
      'thumbnail_url', v_post.thumbnail_url,
      'media_url', COALESCE(v_post.video_url, v_post.media_url),
      'stream_id', COALESCE(v_post.cloudflare_stream_uid, v_post.cloudflare_stream_id)
    )
  );

  v_thread_id := 'dm_' ||
    least(v_creator_id::text, p_collaborator_id::text) || '_' ||
    greatest(v_creator_id::text, p_collaborator_id::text);
  INSERT INTO public.conversations (
    thread_id, participant_one_id, participant_two_id, auto_delete_setting
  )
  VALUES (
    v_thread_id,
    least(v_creator_id, p_collaborator_id),
    greatest(v_creator_id, p_collaborator_id),
    'off'
  )
  ON CONFLICT (thread_id) DO NOTHING;

  SELECT conversation.id
  INTO v_conversation_id
  FROM public.conversations conversation
  WHERE conversation.thread_id = v_thread_id
  LIMIT 1;

  v_metadata := jsonb_build_object(
    'type', 'reel_collaboration_invite',
    'source', 'reel_collaboration_invite',
    'invite_id', v_invite_id,
    'post_id', p_post_id,
    'creator_id', v_creator_id,
    'status', 'pending',
    'thumbnail_url', v_post.thumbnail_url,
    'media_url', COALESCE(v_post.video_url, v_post.media_url),
    'stream_id', COALESCE(v_post.cloudflare_stream_uid, v_post.cloudflare_stream_id),
    'shared_media', jsonb_build_object(
      'id', p_post_id,
      'kind', 'reel',
      'title', COALESCE(NULLIF(v_post.title, ''), NULLIF(v_post.caption, ''), 'Reel collaboration invite'),
      'thumbnail_url', v_post.thumbnail_url,
      'thumbnail_bucket', 'reels'
    )
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.messages message
    WHERE message.sender_id = v_creator_id
      AND message.receiver_id = p_collaborator_id
      AND message.metadata ->> 'source' = 'reel_collaboration_invite'
      AND message.metadata ->> 'invite_id' = v_invite_id::text
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
      auto_delete_mode
    )
    VALUES (
      v_creator_id,
      p_collaborator_id,
      v_creator_name || ' invited you to collaborate on a Reel',
      NULL,
      v_metadata,
      v_conversation_id,
      false,
      'off',
      'off'
    );
  END IF;

  RETURN jsonb_build_object('invite_id', v_invite_id, 'status', 'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_reel_collaboration_invite(
  p_invite_id uuid,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_invite public.reel_collaboration_invites%ROWTYPE;
  v_next_status text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to respond to this collaboration invite';
  END IF;
  IF p_action NOT IN ('accept', 'decline') THEN
    RAISE EXCEPTION 'Choose accept or decline';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.reel_collaboration_invites
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND OR v_invite.collaborator_id <> v_user_id THEN
    RAISE EXCEPTION 'This collaboration invite is not available to you';
  END IF;
  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'This collaboration invite has already been answered';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE post.id = v_invite.post_id
      AND post.kind = 'reel'
      AND post.user_id = v_invite.creator_id
  ) THEN
    RAISE EXCEPTION 'This Reel is no longer available';
  END IF;

  v_next_status := CASE WHEN p_action = 'accept' THEN 'accepted' ELSE 'declined' END;
  UPDATE public.reel_collaboration_invites
  SET status = v_next_status,
      updated_at = now(),
      responded_at = now()
  WHERE id = p_invite_id;

  UPDATE public.notifications notification
  SET read = true,
      metadata = COALESCE(notification.metadata, '{}'::jsonb) ||
        jsonb_build_object('status', v_next_status, 'responded_at', now())
  WHERE notification.recipient_id = v_user_id
    AND notification.metadata ->> 'invite_id' = p_invite_id::text
    AND notification.metadata ->> 'source' = 'reel_collaboration_invite';

  UPDATE public.messages message
  SET metadata = COALESCE(message.metadata, '{}'::jsonb) ||
        jsonb_build_object('status', v_next_status, 'responded_at', now())
  WHERE message.metadata ->> 'invite_id' = p_invite_id::text
    AND message.metadata ->> 'source' = 'reel_collaboration_invite';

  RETURN jsonb_build_object(
    'invite_id', p_invite_id,
    'post_id', v_invite.post_id,
    'status', v_next_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_reel_collaboration_invite(
  p_post_id uuid,
  p_collaborator_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_invite public.reel_collaboration_invites%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to remove a collaborator';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.reel_collaboration_invites
  WHERE post_id = p_post_id
    AND status IN ('pending', 'accepted')
    AND (
      (
        creator_id = v_user_id
        AND (p_collaborator_id IS NULL OR collaborator_id = p_collaborator_id)
      )
      OR (
        collaborator_id = v_user_id
        AND status = 'accepted'
        AND (p_collaborator_id IS NULL OR p_collaborator_id = v_user_id)
      )
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This Reel has no active collaborator you can remove';
  END IF;

  UPDATE public.reel_collaboration_invites
  SET status = 'removed',
      updated_at = now(),
      responded_at = now()
  WHERE id = v_invite.id;

  UPDATE public.notifications notification
  SET read = true,
      metadata = COALESCE(notification.metadata, '{}'::jsonb) ||
        jsonb_build_object('status', 'removed', 'responded_at', now())
  WHERE notification.metadata ->> 'invite_id' = v_invite.id::text
    AND notification.metadata ->> 'source' = 'reel_collaboration_invite';

  UPDATE public.messages message
  SET metadata = COALESCE(message.metadata, '{}'::jsonb) ||
        jsonb_build_object('status', 'removed', 'responded_at', now())
  WHERE message.metadata ->> 'invite_id' = v_invite.id::text
    AND message.metadata ->> 'source' = 'reel_collaboration_invite';

  RETURN jsonb_build_object('post_id', p_post_id, 'status', 'removed');
END;
$$;

REVOKE ALL ON FUNCTION public.create_reel_collaboration_invite(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_reel_collaboration_invite(uuid, uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.respond_to_reel_collaboration_invite(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_reel_collaboration_invite(uuid, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.remove_reel_collaboration_invite(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_reel_collaboration_invite(uuid, uuid)
  TO authenticated;
