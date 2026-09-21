-- The session-management RPCs are authenticated-only. Explicitly deny anon
-- in addition to PUBLIC so the API privilege state is unambiguous.

REVOKE ALL ON TABLE public.user_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.register_current_user_session(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_current_user_sessions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_user_session_is_active() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_user_session(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_other_user_sessions() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.register_current_user_session(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_current_user_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_session_is_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_other_user_sessions() TO authenticated;