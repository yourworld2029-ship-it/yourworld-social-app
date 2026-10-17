---
name: Watermarked video downloads
description: Preserves creator attribution across Reel and long-video download surfaces.
---

Web downloads for Reels and long videos use the same creator-watermarked export. Burn the creator attribution into rendered frames and preserve source audio. For Reel downloads, periodically move the watermark between corners with a generous edge inset to deter simple crops; do not claim that any watermark prevents deliberate editing. On Android, offline-library downloads are the explicit exception: stream the selected source URL directly to app-private storage without browser fetch, Blob, or base64 handling for video bytes. Do not register `.m3u8` playlists as playable offline videos; fail visibly until playlist downloads are supported.

**Why:** The user requested creator attribution that is harder to remove by cropping while keeping watermarked web downloads and original-file Android offline copies.

**How to apply:** Keep web Reels and long-video downloads on the watermarked pipeline after quality selection. For Reels, move the stamp periodically among corners and keep it inset from edges. For Android offline saves, use native streaming and verify the completed file size before registering its path and metadata. Test on a real Android device before calling playback and offline availability device-verified.