---
name: Moment profile joins
description: Keep Moment author avatars available across current and legacy Supabase schemas.
---

Moment loading should request the profile relation with the Moment row, while retaining a non-joined query fallback and the public-profile RPC fallback.

**Why:** The avatar UI can be correct while still receiving no `author.avatar` when Moments are loaded without profile data or when the generated Supabase relation type differs from the deployed schema.

**How to apply:** Normalize embedded `profiles`/`user` rows into `author.avatar`, prefer a non-empty embedded URL, then fall back to the public-profile result and the signed-in user metadata for the current user's Moment.