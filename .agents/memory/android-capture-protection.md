---
name: Android capture protection
description: Keep chat windows free from local screenshot detection and capture blocking.
---

Do not set `FLAG_SECURE` or attach `useCaptureDetect` to Social or Orbit chat routes. Chat windows must not install local blur, visibility, or native capture listeners or change screenshot behavior. Remote capture-alert broadcasts may remain as received system notices; they are separate from local detection or blocking. Keep per-call media and WebRTC setup user-initiated while preserving app-wide incoming-call discovery.

**Why:** The latest user request explicitly supersedes the earlier block-first preference; chat must remain screenshot-accessible and avoid attaching capture hooks during chat entry.

**How to apply:** Keep remote alert-channel handling separate from OS/window capture listeners. Do not reintroduce chat-local screenshot or recording detection, and do not set a secure flag from `MainActivity`.