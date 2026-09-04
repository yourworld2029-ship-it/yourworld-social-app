-- Keep canonical chat message metadata optional at the database boundary while
-- defaulting omitted inserts to an empty JSON object.
ALTER TABLE IF EXISTS public.messages
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN metadata DROP NOT NULL;