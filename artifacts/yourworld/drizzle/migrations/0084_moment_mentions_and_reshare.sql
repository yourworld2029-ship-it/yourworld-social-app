ALTER TABLE public.moments
  ADD COLUMN IF NOT EXISTS mentioned_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS mentioned_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.moments'::regclass
      AND conname = 'moments_mentioned_user_ids_limit'
  ) THEN
    ALTER TABLE public.moments
      ADD CONSTRAINT moments_mentioned_user_ids_limit
      CHECK (cardinality(mentioned_user_ids) <= 20);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.posts'::regclass
      AND conname = 'posts_mentioned_user_ids_limit'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_mentioned_user_ids_limit
      CHECK (cardinality(mentioned_user_ids) <= 20);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.notify_moment_mentions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_row jsonb := to_jsonb(NEW);
  actor_id uuid;
  moment_id uuid;
  author_username text;
  recipient_id uuid;
  mentioned_ids jsonb;
  body_text text;
BEGIN
  IF TG_TABLE_NAME = 'posts'
     AND lower(coalesce(new_row ->> 'kind', '')) <> 'moment' THEN
    RETURN NEW;
  END IF;

  actor_id := nullif(new_row ->> 'user_id', '')::uuid;
  moment_id := nullif(new_row ->> 'id', '')::uuid;
  mentioned_ids := new_row -> 'mentioned_user_ids';

  IF actor_id IS NULL
     OR moment_id IS NULL
     OR jsonb_typeof(mentioned_ids) IS DISTINCT FROM 'array' THEN
    RETURN NEW;
  END IF;

  SELECT nullif(ltrim(coalesce(p.username, ''), '@'), '')
    INTO author_username
  FROM public.profiles p
  WHERE p.id = actor_id
  LIMIT 1;

  body_text := '@' || coalesce(author_username, 'someone') || ' mentioned you in their moment';

  FOR recipient_id IN
    SELECT DISTINCT mention.value::uuid
    FROM jsonb_array_elements_text(mentioned_ids) AS mention(value)
  LOOP
    IF recipient_id <> actor_id
       AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = recipient_id) THEN
      INSERT INTO public.notifications (
        recipient_id,
        actor_id,
        kind,
        title,
        body,
        entity_type,
        entity_id,
        metadata
      )
      VALUES (
        recipient_id,
        actor_id,
        'mention',
        body_text,
        body_text,
        'moment',
        moment_id,
        jsonb_build_object(
          'source', 'moment_mention',
          'moment_id', moment_id,
          'action', 'add_to_moment'
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS moments_mention_notification ON public.moments;
CREATE TRIGGER moments_mention_notification
  AFTER INSERT ON public.moments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_moment_mentions();

DROP TRIGGER IF EXISTS posts_moment_mention_notification ON public.posts;
CREATE TRIGGER posts_moment_mention_notification
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_moment_mentions();
