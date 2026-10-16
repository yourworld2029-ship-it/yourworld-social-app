---
name: Chat message visibility and reactions
description: Preserve per-user delete-for-me behavior and shared chat-message hearts without mutating message content.
---

Store message hiding as a user-owned record so a participant can remove any message from their own view without deleting the other participant's copy. Store each heart reaction separately by message and reacting user so either participant can see it and each can toggle their own reaction.

**Why:** A message-row delete affects both participants, while message metadata updates can overwrite unrelated chat state. The managed Supabase Realtime publication is not owned by feature migrations, so clients refresh shared reactions through a bounded chat-only poll instead of modifying that publication.

**How to apply:** Keep “delete for me” and “clear for everyone” separate. Use participant-checked RLS for hide/reaction tables and verify the app's Supabase project identity before applying schema changes remotely.
