-- One authenticated view per user, content, and content type.
-- Content IDs stay text so this works with both UUID-backed tables and
-- older deployments that used text identifiers.
CREATE TABLE IF NOT EXISTS public.unique_views (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('post', 'reel', 'video', 'moment')),
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id, content_type)
);

CREATE INDEX IF NOT EXISTS unique_views_content_idx
  ON public.unique_views (content_id, content_type);

ALTER TABLE public.unique_views ENABLE ROW LEVEL SECURITY;

-- Keep the policy valid for both schemas: some installations have standalone
-- Moments while older ones use posts.kind = 'moment'.
CREATE OR REPLACE FUNCTION public.can_read_unique_moment_view(_content_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  owner_match boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  IF to_regclass('public.moments') IS NOT NULL THEN
    EXECUTE
      'SELECT EXISTS (
         SELECT 1 FROM public.moments
         WHERE id::text = $1 AND user_id = auth.uid()
       )'
    INTO owner_match
    USING _content_id;
    IF owner_match THEN
      RETURN true;
    END IF;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.posts
    WHERE id::text = _content_id
      AND kind = 'moment'
      AND user_id = auth.uid()
  );
END;
$$;

DROP POLICY IF EXISTS unique_views_read_own ON public.unique_views;
CREATE POLICY unique_views_read_own
  ON public.unique_views FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (content_type = 'moment' AND public.can_read_unique_moment_view(content_id))
  );

DROP POLICY IF EXISTS unique_views_insert_own ON public.unique_views;
CREATE POLICY unique_views_insert_own
  ON public.unique_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS unique_views_delete_own ON public.unique_views;
CREATE POLICY unique_views_delete_own
  ON public.unique_views FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.unique_views TO authenticated;
GRANT ALL ON public.unique_views TO service_role;

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS public.moments ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Backfill the new source of truth from existing authenticated view rows.
INSERT INTO public.unique_views (user_id, content_id, content_type, viewed_at)
SELECT viewer_id, post_id::text,
       CASE
         WHEN p.kind = 'reel' THEN 'reel'
         WHEN p.kind = 'video' THEN 'video'
         ELSE 'post'
       END,
       min(v.created_at)
FROM public.post_views v
JOIN public.posts p ON p.id = v.post_id
WHERE v.viewer_id IS NOT NULL
GROUP BY viewer_id, post_id, p.kind
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF to_regclass('public.moment_views') IS NOT NULL THEN
    INSERT INTO public.unique_views (user_id, content_id, content_type, viewed_at)
    SELECT viewer_id, moment_id::text, 'moment', min(created_at)
    FROM public.moment_views
    GROUP BY viewer_id, moment_id
    ON CONFLICT DO NOTHING;
  END IF;
END
$$;

-- The RPC is the only counter-mutating path used by the client. It inserts
-- first, so a concurrent replay can never increment a counter twice.
CREATE OR REPLACE FUNCTION public.register_unique_view(
  _content_id text,
  _content_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_found boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _content_type NOT IN ('post', 'reel', 'video', 'moment') THEN
    RAISE EXCEPTION 'Unsupported content type';
  END IF;

  INSERT INTO public.unique_views (user_id, content_id, content_type)
  VALUES (auth.uid(), _content_id, _content_type)
  ON CONFLICT (user_id, content_id, content_type) DO NOTHING;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF _content_type = 'moment' THEN
    -- New deployments store Moments in their own table.
    IF to_regclass('public.moments') IS NOT NULL THEN
      EXECUTE
        'UPDATE public.moments
            SET views = COALESCE(views, 0) + 1
          WHERE id::text = $1'
      USING _content_id;
      target_found := FOUND;
    END IF;

    -- Older deployments store Moments as posts.kind = moment.
    IF NOT target_found THEN
      UPDATE public.posts
         SET views = COALESCE(views, 0) + 1
       WHERE id::text = _content_id
         AND kind = 'moment';
      target_found := FOUND;
    END IF;

    -- Keep the existing owner viewer list populated when that table exists.
    IF target_found AND to_regclass('public.moment_views') IS NOT NULL THEN
      BEGIN
        EXECUTE
          'INSERT INTO public.moment_views (moment_id, viewer_id)
           VALUES ($1, auth.uid())
           ON CONFLICT DO NOTHING'
        USING _content_id;
      EXCEPTION
        WHEN foreign_key_violation OR undefined_column OR undefined_table THEN
          NULL;
      END;
    END IF;
  ELSE
    UPDATE public.posts
       SET views = COALESCE(views, 0) + 1
     WHERE id::text = _content_id
       AND kind = _content_type;
    target_found := FOUND;
  END IF;

  IF NOT target_found THEN
    DELETE FROM public.unique_views
     WHERE user_id = auth.uid()
       AND content_id = _content_id
       AND content_type = _content_type;
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.register_unique_view(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_unique_view(text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.can_read_unique_moment_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_unique_moment_view(text) TO authenticated;

-- Repair the missing write policies on the long-video like table.
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS post_likes_insert_own ON public.post_likes;
CREATE POLICY post_likes_insert_own
  ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS post_likes_delete_own ON public.post_likes;
CREATE POLICY post_likes_delete_own
  ON public.post_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;

-- The main social table is present in the original live schema, but use a
-- guarded block so older installations without it can still apply the rest.
DO $$
BEGIN
  IF to_regclass('public.likes') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS likes_insert_own ON public.likes';
    EXECUTE 'CREATE POLICY likes_insert_own ON public.likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    EXECUTE 'DROP POLICY IF EXISTS likes_delete_own ON public.likes';
    EXECUTE 'CREATE POLICY likes_delete_own ON public.likes FOR DELETE TO authenticated USING (user_id = auth.uid())';
    EXECUTE 'DROP POLICY IF EXISTS likes_read_viewable ON public.likes';
    EXECUTE $policy$
      CREATE POLICY likes_read_viewable ON public.likes FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = likes.post_id
          AND (p.audience = 'everyone' OR p.user_id = auth.uid() OR auth.uid() = ANY(p.viewer_user_ids))
      ))
    $policy$;
    EXECUTE 'GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated';
  END IF;
END
$$;

-- Upsert-based clients require these uniqueness guarantees.
DO $$
BEGIN
  IF to_regclass('public.likes') IS NOT NULL THEN
    EXECUTE $dedupe$
      DELETE FROM public.likes a
      USING public.likes b
      WHERE a.ctid > b.ctid
        AND a.post_id = b.post_id
        AND a.user_id = b.user_id
    $dedupe$;
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS likes_post_user_unique ON public.likes (post_id, user_id)';
  END IF;

  IF to_regclass('public.post_likes') IS NOT NULL THEN
    EXECUTE $dedupe$
      DELETE FROM public.post_likes a
      USING public.post_likes b
      WHERE a.ctid > b.ctid
        AND a.post_id = b.post_id
        AND a.user_id = b.user_id
    $dedupe$;
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS post_likes_post_user_unique ON public.post_likes (post_id, user_id)';
  END IF;
END
$$;

-- Recalculate counters from unique authenticated views, excluding legacy
-- anonymous rows that cannot satisfy the one-user-one-view rule.
UPDATE public.posts p
SET views = COALESCE((
  SELECT count(*)::integer
  FROM public.unique_views v
  WHERE v.content_id = p.id::text
    AND v.content_type IN ('post', 'reel', 'video')
), 0);

DO $$
BEGIN
  IF to_regclass('public.moments') IS NOT NULL THEN
    EXECUTE $update$
      UPDATE public.moments m
         SET views = COALESCE((
           SELECT count(*)::integer
           FROM public.unique_views v
           WHERE v.content_id = m.id::text
             AND v.content_type = 'moment'
         ), 0)
    $update$;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER TABLE public.unique_views REPLICA IDENTITY FULL;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'unique_views'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.unique_views;
    END IF;
    IF to_regclass('public.likes') IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'likes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
    END IF;
    IF to_regclass('public.post_likes') IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_likes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
    END IF;
  END IF;
END
$$;