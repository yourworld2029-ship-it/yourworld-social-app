-- Supabase default privileges may grant new public-schema functions to anon.
-- Collaboration mutations must only be callable from authenticated sessions.
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
