DROP POLICY IF EXISTS user_roles_select_own_role ON public.user_roles;

CREATE POLICY user_roles_select_own_role
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
