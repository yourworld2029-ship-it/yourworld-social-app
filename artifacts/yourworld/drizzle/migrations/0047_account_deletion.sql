CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  account_id uuid := auth.uid();
BEGIN
  IF account_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove rows that can otherwise block post/comment/conversation cleanup.
  DELETE FROM public.comment_likes WHERE user_id = account_id;
  DELETE FROM public.comments WHERE user_id = account_id;
  DELETE FROM public.likes WHERE user_id = account_id;
  DELETE FROM public.post_saves WHERE user_id = account_id;
  DELETE FROM public.notifications
    WHERE recipient_id = account_id OR actor_id = account_id;
  DELETE FROM public.follows
    WHERE follower_id = account_id OR following_id = account_id;
  DELETE FROM public.call_push_subscriptions WHERE user_id = account_id;

  -- Delete every chat owned by or shared with the account.
  DELETE FROM public.conversation_preferences
    WHERE user_id = account_id
       OR conversation_id IN (
         SELECT id
         FROM public.conversations
         WHERE participant_one_id = account_id OR participant_two_id = account_id
       );
  DELETE FROM public.messages
    WHERE sender_id = account_id
       OR receiver_id = account_id
       OR conversation_id IN (
         SELECT id
         FROM public.conversations
         WHERE participant_one_id = account_id OR participant_two_id = account_id
       );
  DELETE FROM public.thread_participants
    WHERE user_id = account_id
       OR thread_id IN (
         SELECT thread_id
         FROM public.conversations
         WHERE participant_one_id = account_id OR participant_two_id = account_id
       );
  DELETE FROM public.conversations
    WHERE participant_one_id = account_id OR participant_two_id = account_id;

  -- Delete Orbit requests and their attached messages.
  DELETE FROM public.orbit_request_messages
    WHERE sender_id = account_id
       OR request_id IN (
         SELECT id
         FROM public.orbit_chat_requests
         WHERE requester_id = account_id OR addressee_id = account_id
       );
  DELETE FROM public.orbit_chat_requests
    WHERE requester_id = account_id OR addressee_id = account_id;

  -- Remove account-owned moderation, verification, monetization, and report data.
  DELETE FROM public.user_roles WHERE user_id = account_id;
  DELETE FROM public.admin_action_audit
    WHERE admin_user_id = account_id OR target_user_id = account_id;
  DELETE FROM public.admin_account_restrictions
    WHERE user_id = account_id OR created_by = account_id OR lifted_by = account_id;
  DELETE FROM public.sports_verification_review_audit
    WHERE applicant_user_id = account_id OR admin_user_id = account_id;
  DELETE FROM public.sports_verification_details WHERE user_id = account_id;
  DELETE FROM public.copyright_reports WHERE reporter_user_id = account_id;
  DELETE FROM public.video_access_grants
    WHERE user_id = account_id
       OR granted_by = account_id
       OR post_id IN (SELECT id FROM public.posts WHERE user_id = account_id);

  -- Posts cascade their comments, likes, saves, and access grants. Moments and
  -- Highlights store their item payloads inline, so deleting the owner rows is
  -- the complete database cleanup for those features.
  DELETE FROM public.posts WHERE user_id = account_id;
  DELETE FROM public.moments WHERE user_id = account_id;
  DELETE FROM public.highlights WHERE user_id = account_id;
  DELETE FROM public.profiles WHERE id = account_id;

  -- Supabase's auth.users is the account record for this project. Deleting it
  -- last lets the database enforce any remaining auth foreign keys safely.
  DELETE FROM auth.users WHERE id = account_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;