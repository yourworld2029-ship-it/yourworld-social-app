---
name: Moment profile joins
description: Keep Moment author avatars available across current and legacy Supabase schemas.
---

Moment loading should request the profile relation with the Moment row, while retaining a non-joined query fallback and the public-profile RPC fallback.

**Why:** The avatar UI can be correct while still receiving no `author.avatar` when Moments are loaded without profile data or when the generated Supabase relation type differs from the deployed schema.

**How to apply:** Normalize embedded `profiles`/`user` rows into `author.avatar`, prefer a non-empty embedded URL, then fall back to the public-profile result and the signed-in user metadata for the current user's Moment. Profile image normalization should check `avatar_url`, `profile_pic`, and `profile_image`, and avatar rendering should fall back to one initial after image errors.

Request alternate profile-image fields in the explicit profile relation when available, but treat missing legacy columns as a relation-query fallback rather than letting the entire feed fail.

**Why:** Deployments can expose different profile column sets; a single `avatar_url` assumption or an unhandled missing-column error can make both real photos and the feed disappear.

**How to apply:** Keep the relation select and non-joined fallback paired, then pass normalized profile data through one reusable image-or-initial avatar component.

Profile avatar values can be bare Storage object paths rather than browser-loadable URLs; resolve them with the existing media URL helper and the `avatars` bucket before rendering.

**Why:** Passing a stored object path directly to `<img>` causes a failed request and the shared avatar component correctly falls back to an initial.

**How to apply:** Resolve avatar paths in each existing Moment/chat data flow; do not change the profile field or create a second URL resolver.