-- The live schema uses public.highlights. Keep the conditional branch for
-- older environments that used public.profile_highlights.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['highlights', 'profile_highlights']
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        'Users can delete their own highlights',
        table_name
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        'Users can delete own highlights',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)',
        'Users can delete own highlights',
        table_name
      );
      EXECUTE format('GRANT DELETE ON TABLE public.%I TO authenticated', table_name);
    END IF;
  END LOOP;
END
$$;