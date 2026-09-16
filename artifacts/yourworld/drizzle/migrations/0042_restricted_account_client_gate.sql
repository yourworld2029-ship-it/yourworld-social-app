GRANT SELECT ON public.admin_account_restrictions TO authenticated;

DROP POLICY IF EXISTS "Users can read their own account restriction"
  ON public.admin_account_restrictions;
CREATE POLICY "Users can read their own account restriction"
  ON public.admin_account_restrictions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    AND lifted_at IS NULL
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  );