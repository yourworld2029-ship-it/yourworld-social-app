---
name: Destructive list mutations
description: Keeping deleted records from reappearing after successful client-side mutations.
---

After a destructive mutation is confirmed by the server, update the local collection directly and avoid an immediate uncoordinated refresh that can reintroduce a stale copy.

**Why:** A fetch started before or near the delete can resolve afterward with the old row still present, visually resurrecting the item even though the database deletion succeeded.

**How to apply:** Filter the confirmed record from local state after the mutation succeeds. If a refresh is required, coordinate it with mutation generations or reconcile its result so older data cannot overwrite the confirmed deletion.