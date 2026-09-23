-- Remove persisted screenshot-alert system pills created by the noisy
-- blur/visibility/touch detector. Normal messages, timestamps, and recording
-- alerts are intentionally left untouched.

delete from public.messages
where is_system_message = true
  and (
    coalesce(metadata ->> 'capture_kind', '') = 'screenshot'
    or content ilike '%took a screenshot%'
  );

delete from public.orbit_messages
where kind = 'system'
  and coalesce(text, '') like '%took a screenshot%';