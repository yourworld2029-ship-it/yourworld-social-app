---
name: Live participant identity
description: Keep Live viewer lists, join notices, and comments tied to the correct public profile.
---

For Live display, treat Supabase presence metadata as a session signal, not the authoritative source for a person's name or avatar. Resolve viewer and commenter identity from the public profile keyed by `user_id`. Group displayed viewer rows/counts by `user_id`, while retaining each `peer_id` for WebRTC signaling.

**Why:** The Live route previously advertised the broadcaster's profile from every viewer session, and auth metadata can be stale or incomplete. Multiple sessions for one account can also look like duplicate people.

**How to apply:** Use profile-backed identity for viewer rows, join notices, and comments; deduplicate only presentation/counts, never the peer connections. Confirm hardware torch behavior on a physical Android device because browser capability reports vary by WebView and camera.
