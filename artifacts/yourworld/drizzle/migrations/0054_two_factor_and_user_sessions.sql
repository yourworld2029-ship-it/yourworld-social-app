-- Real email OTP 2FA and per-device session tracking.
-- The Supabase Auth session_id claim is the stable key for one browser/device
-- login. Revocation also marks the corresponding Auth refresh tokens unusable.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  device_name text NOT NULL DEFAULT 'Unknown device',
  ip_address text,
  location_city text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS user_sessions_user_active_idx
  ON public.user_sessions (user_id, revoked_at, last_active_at DESC);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_sessions FROM anon, authenticated;
GRANT ALL ON public.user_sessions TO service_role;

CREATE OR REPLACE FUNCTION public.register_current_user_session(
  _device_name text DEFAULT 'Unknown device',
  _location_city text DEFAULT NULL,
  _ip_address text DEFAULT NULL
)
RETURNS SETOF public.user_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  account_id uuid := auth.uid();
  current_session_id uuid;
BEGIN
  IF account_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  BEGIN
    current_session_id := nullif(auth.jwt()->>'session_id', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Authentication session identifier is invalid';
  END;

  IF current_session_id IS NULL THEN
    RAISE EXCEPTION 'Authentication session identifier is missing';
  END IF;

  INSERT INTO public.user_sessions (
    user_id,
    session_id,
    device_name,
    ip_address,
    location_city,
    last_active_at,
    is_current,
    revoked_at
  )
  VALUES (
    account_id,
    current_session_id,
    left(coalesce(nullif(trim(_device_name), ''), 'Unknown device'), 120),
    left(nullif(trim(_ip_address), ''), 120),
    left(nullif(trim(_location_city), ''), 120),
    now(),
    true,
    NULL
  )
  ON CONFLICT (user_id, session_id) DO UPDATE
  SET device_name = EXCLUDED.device_name,
      ip_address = COALESCE(EXCLUDED.ip_address, public.user_sessions.ip_address),
      location_city = COALESCE(EXCLUDED.location_city, public.user_sessions.location_city),
      last_active_at = now(),
      is_current = true
  WHERE public.user_sessions.revoked_at IS NULL;

  RETURN QUERY
  SELECT s.*
  FROM public.user_sessions AS s
  WHERE s.user_id = account_id
    AND s.session_id = current_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_current_user_sessions()
RETURNS TABLE (
  id uuid,
  device_name text,
  ip_address text,
  location_city text,
  last_active_at timestamptz,
  is_current boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT
    s.id,
    s.device_name,
    s.ip_address,
    s.location_city,
    s.last_active_at,
    s.session_id = nullif(auth.jwt()->>'session_id', '')::uuid AS is_current,
    s.created_at
  FROM public.user_sessions AS s
  WHERE s.user_id = auth.uid()
    AND s.revoked_at IS NULL
  ORDER BY (s.session_id = nullif(auth.jwt()->>'session_id', '')::uuid) DESC,
           s.last_active_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.current_user_session_is_active()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_sessions AS s
    WHERE s.user_id = auth.uid()
      AND s.session_id = nullif(auth.jwt()->>'session_id', '')::uuid
      AND s.revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_session(_session_row_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  account_id uuid := auth.uid();
  target_session_id uuid;
  current_session_id uuid := nullif(auth.jwt()->>'session_id', '')::uuid;
BEGIN
  IF account_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT s.session_id
  INTO target_session_id
  FROM public.user_sessions AS s
  WHERE s.id = _session_row_id
    AND s.user_id = account_id
    AND s.revoked_at IS NULL
  FOR UPDATE;

  IF target_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  IF target_session_id = current_session_id THEN
    RAISE EXCEPTION 'The current session cannot be removed here';
  END IF;

  UPDATE public.user_sessions
  SET revoked_at = now(),
      is_current = false
  WHERE id = _session_row_id;

  -- Supabase Auth stores refresh-token families by session_id. Marking the
  -- family revoked prevents the targeted device from refreshing its token.
  UPDATE auth.refresh_tokens
  SET revoked = true,
      updated_at = now()
  WHERE session_id = target_session_id;

  UPDATE auth.sessions
  SET not_after = now()
  WHERE id = target_session_id
    AND user_id = account_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_other_user_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  account_id uuid := auth.uid();
  current_session_id uuid := nullif(auth.jwt()->>'session_id', '')::uuid;
  target_session_id uuid;
  revoked_count integer := 0;
BEGIN
  IF account_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR target_session_id IN
    SELECT s.session_id
    FROM public.user_sessions AS s
    WHERE s.user_id = account_id
      AND s.revoked_at IS NULL
      AND s.session_id <> current_session_id
    FOR UPDATE
  LOOP
    UPDATE public.user_sessions
    SET revoked_at = now(),
        is_current = false
    WHERE user_id = account_id
      AND session_id = target_session_id;

    UPDATE auth.refresh_tokens
    SET revoked = true,
        updated_at = now()
    WHERE session_id = target_session_id;

    UPDATE auth.sessions
    SET not_after = now()
    WHERE id = target_session_id
      AND user_id = account_id;

    revoked_count := revoked_count + 1;
  END LOOP;

  RETURN revoked_count;
END;
$$;

REVOKE ALL ON FUNCTION public.register_current_user_session(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_current_user_sessions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_session_is_active() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_user_session(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_other_user_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_current_user_session(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_current_user_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_session_is_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_other_user_sessions() TO authenticated;