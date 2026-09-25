-- SECURITY DEFINER chat functions must not be callable by anonymous clients.
-- Authenticated callers remain subject to each function's recipient or
-- participant checks.
revoke all on function public.apply_social_message_view_expiry()
  from public, anon, authenticated;

revoke all on function public.clear_social_conversation(uuid)
  from public, anon;
grant execute on function public.clear_social_conversation(uuid)
  to authenticated;

revoke all on function public.clear_orbit_conversation(uuid)
  from public, anon;
grant execute on function public.clear_orbit_conversation(uuid)
  to authenticated;

revoke all on function public.delete_expired_chat_messages()
  from public, anon;
grant execute on function public.delete_expired_chat_messages()
  to authenticated;

revoke all on function public.burn_view_once(uuid)
  from public, anon;
grant execute on function public.burn_view_once(uuid)
  to authenticated;