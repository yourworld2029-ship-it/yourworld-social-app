-- Keep revoked devices out of the app session list while preserving the
-- Supabase Auth revocation state that prevents refresh-token reuse.

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

  current_session_id := nullif(auth.jwt()->>'session_id', '')::uuid;
  IF current_session_id IS NULL THEN
    RAISE EXCEPTION 'Authentication session identifier is missing';
  END IF;

  -- A valid-looking access token must not be enough to restore a session
  -- after its refresh-token family was revoked by another device.
  IF NOT EXISTS (
    SELECT 1
    FROM auth.sessions AS auth_session
    WHERE auth_session.id = current_session_id
      AND auth_session.user_id = account_id
      AND (auth_session.not_after IS NULL OR auth_session.not_after > now())
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.user_sessions (
    user_id, session_id, device_name, ip_address, location_city,
    last_active_at, is_current, revoked_at
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
    coalesce(nullif(s.device_name, 'Unknown device'), auth_session.user_agent, s.device_name),
    coalesce(s.ip_address, auth_session.ip::text),
    s.location_city,
    s.last_active_at,
    s.session_id = nullif(auth.jwt()->>'session_id', '')::uuid,
    s.created_at
  FROM public.user_sessions AS s
  LEFT JOIN auth.sessions AS auth_session ON auth_session.id = s.session_id
  WHERE s.user_id = auth.uid()
    AND s.revoked_at IS NULL
  ORDER BY (s.session_id = nullif(auth.jwt()->>'session_id', '')::uuid) DESC,
           s.last_active_at DESC;
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

  UPDATE auth.refresh_tokens
  SET revoked = true, updated_at = now()
  WHERE session_id = target_session_id;
  UPDATE auth.sessions
  SET not_after = now()
  WHERE id = target_session_id AND user_id = account_id;
  DELETE FROM public.user_sessions WHERE id = _session_row_id;
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
    UPDATE auth.refresh_tokens
    SET revoked = true, updated_at = now()
    WHERE session_id = target_session_id;
    UPDATE auth.sessions
    SET not_after = now()
    WHERE id = target_session_id AND user_id = account_id;
    DELETE FROM public.user_sessions
    WHERE user_id = account_id AND session_id = target_session_id;
    revoked_count := revoked_count + 1;
  END LOOP;
  RETURN revoked_count;
END;
$$;