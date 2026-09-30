---
name: Watermarked video downloads
description: Preserves creator attribution across Reel and long-video download surfaces.
---

Web downloads for Reels and long videos use the same creator-watermarked export. Burn the creator attribution into rendered frames and preserve source audio. On Android, offline-library downloads are the explicit exception: stream the selected source URL directly to app-private storage without browser fetch, Blob, or base64 handling for video bytes. Do not register `.m3u8` playlists as playable offline videos; fail visibly until playlist downloads are supported.

**Why:** The user requested watermarked web downloads but selected original-file streaming for Android offline copies, with those copies appearing in Profile > Downloads.

**How to apply:** Keep web Reels and long-video downloads on the watermarked pipeline after quality selection. For Android offline saves, use native streaming and verify the completed file size before registering its path and metadata. Test on a real Android device before calling playback and offline availability device-verified.