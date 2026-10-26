-- Secure Reel collaboration invitations. New collaborators are pending until
-- they accept; only accepted invitations are exposed on public Reels.

CREATE TABLE IF NOT EXISTS public.reel_collaboration_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT reel_collaboration_invites_distinct_users
    CHECK (creator_id <> collaborator_id),
  CONSTRAINT reel_collaboration_invites_post_user_unique
    UNIQUE (post_id, collaborator_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS reel_collaboration_invites_one_active_per_reel
  ON public.reel_collaboration_invites (post_id)
  WHERE status IN ('pending', 'accepted');

CREATE INDEX IF NOT EXISTS reel_collaboration_invites_collaborator_status_idx
  ON public.reel_collaboration_invites (collaborator_id, status, created_at DESC);

ALTER TABLE public.reel_collaboration_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reel_collaboration_invites_read_participant_or_accepted
  ON public.reel_collaboration_invites;
CREATE POLICY reel_collaboration_invites_read_participant_or_accepted
  ON public.reel_collaboration_invites
  FOR SELECT TO anon, authenticated
  USING (
    status = 'accepted'
    OR creator_id = auth.uid()
    OR collaborator_id = auth.uid()
  );

REVOKE ALL ON public.reel_collaboration_invites FROM anon, authenticated;
GRANT SELECT ON public.reel_collaboration_invites TO anon, authenticated;

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
    post_id,
    creator_id,
    collaborator_id,
    status,
    responded_at
  )
  VALUES (p_post_id, v_creator_id, p_collaborator_id, 'pending', NULL)
  ON CONFLICT (post_id, collaborator_id) DO UPDATE
    SET status = 'pending',
        updated_at = now(),
        responded_at = NULL
  RETURNING id INTO v_invite_id;

  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    kind,
    title,
    body,
    entity_type,
    entity_id,
    metadata
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

  RETURN jsonb_build_object('invite_id', v_invite_id, 'status', 'pending');
END;
$$;

REVOKE ALL ON FUNCTION public.create_reel_collaboration_invite(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_reel_collaboration_invite(uuid, uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_reel_collaborators(p_post_ids uuid[])
RETURNS TABLE (post_id uuid, collaborator_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT invite.post_id, invite.collaborator_id
  FROM public.reel_collaboration_invites invite
  JOIN public.posts post ON post.id = invite.post_id
  WHERE invite.status = 'accepted'
    AND post.kind = 'reel'
    AND p_post_ids IS NOT NULL
    AND invite.post_id = ANY (p_post_ids)
    AND (
      COALESCE(lower(post.video_access), 'public') = 'public'
      OR invite.creator_id = auth.uid()
      OR invite.collaborator_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.get_public_reel_collaborators(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_reel_collaborators(uuid[])
  TO anon, authenticated;

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

  RETURN jsonb_build_object(
    'invite_id', p_invite_id,
    'post_id', v_invite.post_id,
    'status', v_next_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_reel_collaboration_invite(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_reel_collaboration_invite(uuid, text)
  TO authenticated;

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
    AND creator_id = v_user_id
    AND status IN ('pending', 'accepted')
    AND (p_collaborator_id IS NULL OR collaborator_id = p_collaborator_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This Reel has no active collaborator to remove';
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

  RETURN jsonb_build_object('post_id', p_post_id, 'status', 'removed');
END;
$$;

REVOKE ALL ON FUNCTION public.remove_reel_collaboration_invite(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_reel_collaboration_invite(uuid, uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_reel_collaboration_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF lower(COALESCE(OLD.kind, '')) = 'reel' THEN
    DELETE FROM public.notifications
    WHERE entity_type = 'reel'
      AND entity_id = OLD.id
      AND metadata ->> 'source' = 'reel_collaboration_invite';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS posts_cleanup_reel_collaboration_notifications
  ON public.posts;
CREATE TRIGGER posts_cleanup_reel_collaboration_notifications
  AFTER DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_reel_collaboration_notifications();
