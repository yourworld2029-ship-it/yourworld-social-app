-- Legacy Highlight child tables are optional because current Highlights store
-- their items inline as JSONB. If an older deployment still has a child table,
-- make deleting the parent safe even when the server fallback is bypassed.

DO $$
DECLARE
  child_table text;
  constraint_name text;
BEGIN
  FOREACH child_table IN ARRAY ARRAY['highlight_items', 'highlight_media', 'highlight_stories']
  LOOP
    IF to_regclass(format('public.%I', child_table)) IS NULL THEN
      CONTINUE;
    END IF;

    SELECT con.conname
      INTO constraint_name
      FROM pg_constraint AS con
      JOIN pg_class AS child ON child.oid = con.conrelid
      JOIN pg_class AS parent ON parent.oid = con.confrelid
      JOIN pg_namespace AS child_schema ON child_schema.oid = child.relnamespace
      JOIN pg_namespace AS parent_schema ON parent_schema.oid = parent.relnamespace
     WHERE con.contype = 'f'
       AND child_schema.nspname = 'public'
       AND child.relname = child_table
       AND parent_schema.nspname = 'public'
       AND parent.relname = 'highlights'
       AND EXISTS (
         SELECT 1
           FROM unnest(con.conkey) AS key(attnum)
           JOIN pg_attribute AS attr
             ON attr.attrelid = child.oid
            AND attr.attnum = key.attnum
          WHERE attr.attname = 'highlight_id'
       )
     LIMIT 1;

    IF constraint_name IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE public.%I DROP CONSTRAINT %I',
        child_table,
        constraint_name
      );
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I
         ADD CONSTRAINT %I
         FOREIGN KEY (highlight_id)
         REFERENCES public.highlights(id)
         ON DELETE CASCADE',
      child_table,
      child_table || '_highlight_id_fkey'
    );
  END LOOP;
END
$$;