ALTER TABLE public.moments
  DROP CONSTRAINT IF EXISTS moments_duration_check;

ALTER TABLE public.moments
  ADD CONSTRAINT moments_duration_check
  CHECK (duration = ANY (ARRAY[12, 24, 48]));

CREATE TABLE IF NOT EXISTS public.moment_poll_votes (
  moment_id uuid NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  choice_index smallint NOT NULL CHECK (choice_index IN (0, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (moment_id, user_id)
);

ALTER TABLE public.moment_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moment_poll_votes_select_own
  ON public.moment_poll_votes;

CREATE POLICY moment_poll_votes_select_own
  ON public.moment_poll_votes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.moment_poll_votes FROM anon, authenticated;
GRANT SELECT ON TABLE public.moment_poll_votes TO authenticated;

CREATE OR REPLACE FUNCTION public.cast_moment_poll_vote(
  p_moment_id uuid,
  p_choice_index smallint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_poll jsonb;
  v_vote_0 integer;
  v_vote_1 integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to vote';
  END IF;
  IF p_choice_index NOT IN (0, 1) THEN
    RAISE EXCEPTION 'Invalid poll choice';
  END IF;

  SELECT user_id, poll
    INTO v_owner_id, v_poll
    FROM public.moments
   WHERE id = p_moment_id
     AND expires_at > clock_timestamp()
   FOR UPDATE;

  IF NOT FOUND OR v_poll IS NULL THEN
    RAISE EXCEPTION 'This poll is no longer available';
  END IF;
  IF v_owner_id = v_user_id THEN
    RAISE EXCEPTION 'You cannot vote on your own poll';
  END IF;
  IF jsonb_typeof(v_poll->'options') IS DISTINCT FROM 'array'
     OR jsonb_array_length(v_poll->'options') <> 2 THEN
    RAISE EXCEPTION 'This poll is invalid';
  END IF;

  INSERT INTO public.moment_poll_votes (moment_id, user_id, choice_index)
  VALUES (p_moment_id, v_user_id, p_choice_index);

  v_vote_0 := COALESCE((v_poll #>> '{votes,0}')::integer, 0);
  v_vote_1 := COALESCE((v_poll #>> '{votes,1}')::integer, 0);
  IF p_choice_index = 0 THEN
    v_vote_0 := v_vote_0 + 1;
  ELSE
    v_vote_1 := v_vote_1 + 1;
  END IF;

  UPDATE public.moments
     SET poll = jsonb_set(v_poll, '{votes}', to_jsonb(ARRAY[v_vote_0, v_vote_1]), true)
   WHERE id = p_moment_id;

  RETURN jsonb_build_object(
    'votes', jsonb_build_array(v_vote_0, v_vote_1),
    'myVote', p_choice_index
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'You have already voted on this poll';
END;
$function$;

REVOKE ALL ON FUNCTION public.cast_moment_poll_vote(uuid, smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cast_moment_poll_vote(uuid, smallint) TO authenticated;
