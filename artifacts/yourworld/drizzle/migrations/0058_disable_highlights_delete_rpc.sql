-- The Highlights UI and server endpoint have been removed from the app.
-- Keep existing rows for data retention, but disable the old destructive RPC.

DROP FUNCTION IF EXISTS public.delete_highlight_hard(uuid, uuid);