CREATE TABLE IF NOT EXISTS public.user_hidden_creators (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, creator_id),
  CHECK (user_id <> creator_id)
);

CREATE INDEX IF NOT EXISTS user_hidden_creators_creator_id_idx
  ON public.user_hidden_creators (creator_id);

ALTER TABLE public.user_hidden_creators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_hidden_creators_owner ON public.user_hidden_creators;
CREATE POLICY user_hidden_creators_owner
  ON public.user_hidden_creators
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_hidden_creators TO authenticated;
GRANT ALL ON public.user_hidden_creators TO service_role;

CREATE TABLE IF NOT EXISTS public.user_close_friends (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS user_close_friends_friend_id_idx
  ON public.user_close_friends (friend_id);

ALTER TABLE public.user_close_friends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_close_friends_owner ON public.user_close_friends;
CREATE POLICY user_close_friends_owner
  ON public.user_close_friends
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_close_friends TO authenticated;
GRANT ALL ON public.user_close_friends TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_user_close_friends_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  selected_count integer;
  actor_id uuid := auth.uid();
BEGIN
  IF actor_id IS NOT NULL AND NEW.user_id <> actor_id THEN
    RAISE EXCEPTION 'Cannot change another user''s close friends'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.user_id = NEW.user_id
     AND OLD.friend_id = NEW.friend_id THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));

  IF EXISTS (
    SELECT 1
    FROM public.user_close_friends
    WHERE user_id = NEW.user_id
      AND friend_id = NEW.friend_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO selected_count
  FROM public.user_close_friends
  WHERE user_id = NEW.user_id;

  IF selected_count >= 15 THEN
    RAISE EXCEPTION 'Maximum 15 Close Friends allowed'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_user_close_friends_limit() FROM PUBLIC;
DROP TRIGGER IF EXISTS user_close_friends_limit ON public.user_close_friends;
CREATE TRIGGER user_close_friends_limit
  BEFORE INSERT OR UPDATE OF user_id, friend_id
  ON public.user_close_friends
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_close_friends_limit();
