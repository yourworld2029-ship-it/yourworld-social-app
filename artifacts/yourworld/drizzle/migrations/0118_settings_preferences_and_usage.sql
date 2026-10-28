CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  who_can_message text NOT NULL DEFAULT 'everyone'
    CHECK (who_can_message IN ('everyone', 'following')),
  read_receipts_enabled boolean NOT NULL DEFAULT true,
  daily_limit_minutes smallint NULL
    CHECK (daily_limit_minutes IS NULL OR daily_limit_minutes IN (30, 60, 120)),
  notification_preferences jsonb NOT NULL DEFAULT
    '{"likes":true,"comments":true,"followers":true,"messages":true,"calls":true,"monetization":true,"system":true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_settings_notification_preferences_object
    CHECK (jsonb_typeof(notification_preferences) = 'object')
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_settings_select_own ON public.user_settings;
CREATE POLICY user_settings_select_own
  ON public.user_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.user_settings FROM anon, authenticated;
GRANT SELECT ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_user_settings()
RETURNS SETOF public.user_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT *
  FROM public.user_settings
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.save_my_user_settings(p_patch jsonb)
RETURNS public.user_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_row public.user_settings;
  v_item record;
  v_limit integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
    RAISE EXCEPTION 'Settings patch must be an object';
  END IF;

  IF p_patch ? 'who_can_message'
     AND (jsonb_typeof(p_patch->'who_can_message') <> 'string'
       OR p_patch->>'who_can_message' NOT IN ('everyone', 'following')) THEN
    RAISE EXCEPTION 'Invalid message permission';
  END IF;
  IF p_patch ? 'read_receipts_enabled'
     AND jsonb_typeof(p_patch->'read_receipts_enabled') <> 'boolean' THEN
    RAISE EXCEPTION 'Invalid read receipts preference';
  END IF;
  IF p_patch ? 'daily_limit_minutes' THEN
    IF jsonb_typeof(p_patch->'daily_limit_minutes') = 'null' THEN
      v_limit := NULL;
    ELSIF jsonb_typeof(p_patch->'daily_limit_minutes') = 'number' THEN
      v_limit := (p_patch->>'daily_limit_minutes')::integer;
      IF v_limit NOT IN (30, 60, 120) THEN
        RAISE EXCEPTION 'Invalid daily limit';
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid daily limit';
    END IF;
  END IF;
  IF p_patch ? 'notification_preferences' THEN
    IF jsonb_typeof(p_patch->'notification_preferences') <> 'object' THEN
      RAISE EXCEPTION 'Notification preferences must be an object';
    END IF;
    FOR v_item IN
      SELECT key, value
      FROM jsonb_each(p_patch->'notification_preferences')
    LOOP
      IF v_item.key NOT IN
           ('likes', 'comments', 'followers', 'messages', 'calls', 'monetization', 'system')
         OR jsonb_typeof(v_item.value) <> 'boolean' THEN
        RAISE EXCEPTION 'Invalid notification preference';
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.user_settings (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_settings
  SET who_can_message = CASE
        WHEN p_patch ? 'who_can_message' THEN p_patch->>'who_can_message'
        ELSE who_can_message
      END,
      read_receipts_enabled = CASE
        WHEN p_patch ? 'read_receipts_enabled'
          THEN (p_patch->>'read_receipts_enabled')::boolean
        ELSE read_receipts_enabled
      END,
      daily_limit_minutes = CASE
        WHEN p_patch ? 'daily_limit_minutes' THEN v_limit::smallint
        ELSE daily_limit_minutes
      END,
      notification_preferences = CASE
        WHEN p_patch ? 'notification_preferences'
          THEN notification_preferences || (p_patch->'notification_preferences')
        ELSE notification_preferences
      END,
      updated_at = now()
  WHERE user_id = v_user_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_user_settings() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_my_user_settings(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_user_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_my_user_settings(jsonb) TO authenticated;

CREATE TABLE IF NOT EXISTS public.user_daily_usage_sessions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_day date NOT NULL,
  session_id uuid NOT NULL,
  seconds integer NOT NULL DEFAULT 0 CHECK (seconds BETWEEN 0 AND 86400),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, local_day, session_id)
);

ALTER TABLE public.user_daily_usage_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_daily_usage_sessions_select_own
  ON public.user_daily_usage_sessions;
CREATE POLICY user_daily_usage_sessions_select_own
  ON public.user_daily_usage_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.user_daily_usage_sessions FROM anon, authenticated;
GRANT SELECT ON public.user_daily_usage_sessions TO authenticated;
GRANT ALL ON public.user_daily_usage_sessions TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_daily_usage(p_local_day date)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(seconds), 0)::integer
  FROM public.user_daily_usage_sessions
  WHERE user_id = auth.uid()
    AND local_day = p_local_day;
$$;

CREATE OR REPLACE FUNCTION public.record_my_daily_usage(
  p_local_day date,
  p_session_id uuid,
  p_seconds integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_local_day IS NULL
     OR p_local_day < current_date - 1
     OR p_local_day > current_date + 1
     OR p_session_id IS NULL
     OR p_seconds IS NULL
     OR p_seconds < 0
     OR p_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid daily usage session';
  END IF;

  INSERT INTO public.user_daily_usage_sessions
    (user_id, local_day, session_id, seconds, updated_at)
  VALUES
    (v_user_id, p_local_day, p_session_id, p_seconds, now())
  ON CONFLICT (user_id, local_day, session_id)
  DO UPDATE SET
    seconds = GREATEST(public.user_daily_usage_sessions.seconds, EXCLUDED.seconds),
    updated_at = now();

  SELECT COALESCE(SUM(seconds), 0)::integer
  INTO v_total
  FROM public.user_daily_usage_sessions
  WHERE user_id = v_user_id
    AND local_day = p_local_day;

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_daily_usage(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_my_daily_usage(date, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_daily_usage(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_my_daily_usage(date, uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_start_social_message(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_conversation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_policy text;
BEGIN
  IF p_sender_id IS NULL
     OR p_receiver_id IS NULL
     OR p_sender_id = p_receiver_id
     OR p_sender_id <> auth.uid() THEN
    RETURN false;
  END IF;

  SELECT who_can_message
  INTO v_policy
  FROM public.user_settings
  WHERE user_id = p_receiver_id;

  IF COALESCE(v_policy, 'everyone') = 'everyone' THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.follows
    WHERE follower_id = p_receiver_id
      AND following_id = p_sender_id
  ) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE m.sender_id = p_sender_id
      AND m.receiver_id = p_receiver_id
      AND m.is_deleted = false
      AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
  ) OR EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE m.sender_id = p_receiver_id
      AND m.receiver_id = p_sender_id
      AND m.is_deleted = false
      AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_start_social_message(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_start_social_message(uuid, uuid, uuid)
  TO authenticated;

DROP POLICY IF EXISTS messages_sender_insert ON public.messages;
CREATE POLICY messages_sender_insert
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND NOT public.is_social_blocked(sender_id, receiver_id)
    AND (
      conversation_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (
            (c.participant_one_id = messages.sender_id AND c.participant_two_id = messages.receiver_id)
            OR
            (c.participant_two_id = messages.sender_id AND c.participant_one_id = messages.receiver_id)
          )
      )
    )
    AND public.can_start_social_message(sender_id, receiver_id, conversation_id)
  );

CREATE OR REPLACE FUNCTION public.enforce_social_read_receipts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_receipts_enabled boolean;
BEGIN
  IF OLD.is_read IS DISTINCT FROM NEW.is_read AND NEW.is_read = true THEN
    IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.receiver_id THEN
      RAISE EXCEPTION 'Only the recipient can mark a message as read';
    END IF;

    SELECT read_receipts_enabled
    INTO v_receipts_enabled
    FROM public.user_settings
    WHERE user_id = OLD.receiver_id;

    IF COALESCE(v_receipts_enabled, true) = false THEN
      NEW.is_read := OLD.is_read;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_social_read_receipts ON public.messages;
CREATE TRIGGER enforce_social_read_receipts
  BEFORE UPDATE OF is_read ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_social_read_receipts();
