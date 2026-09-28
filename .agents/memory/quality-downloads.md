---
name: Quality-specific downloads
description: Constraints and fallback behavior for source-quality downloads and browser-side exports.
---

Quality-aware downloads should preserve the existing full-file path for the original source tier and only process smaller tiers after the viewer explicitly chooses them. Uploads without stored dimensions need an original-file fallback rather than being treated as a known 480p source.

**Why:** Private Supabase media already has a reliable signed-URL and service-worker download flow, while the web client cannot guarantee server-side transcoding or MP3 encoding on every device.

**How to apply:** Keep source quality metadata optional for legacy rows, derive tiers from native dimensions for new uploads, estimate sizes from duration and bitrate, and treat browser export capability as a runtime constraint.

Keep quality/audio labels and selection behavior in the shared download sheet; route-specific code should only resolve the media URL and dispatch the selected choice.

**Why:** Multiple video surfaces use the same browser export helpers, so duplicated sheets can drift in available tiers, source fallbacks, or extension messaging.

**How to apply:** When adding a new download entry point, pass its source tier, duration, title, and download callback into the shared sheet instead of rebuilding the option list.

Offline library surfaces must pair cached video bytes with an IndexedDB metadata record scoped to the downloading user. CacheStorage alone can play a file but cannot populate a reliable Downloads list or support safe deletion.

**Why:** Browser downloads previously had no searchable catalog, and signed-in users sharing a device must not see another account's offline records.

**How to apply:** Write metadata only after the selected video bytes are cached, resolve playback from the cache record, and delete both the cache entry and metadata row together.

Offline downloads are user-retained media, not a temporary cache: keep web copies in persistent IndexedDB and Android copies in app-private files with recoverable metadata. Never expire or purge them automatically; a manual delete must remove the media and every registry or recovery record. Temporary playback-range caches remain separate.

**Why:** Users expect downloaded videos to remain playable offline until they choose to delete them; cache eviction or stale native snapshots can otherwise make files disappear from the library or reappear after deletion.

**How to apply:** Keep persistence requests ahead of IndexedDB use, restore Android entries from native transfer metadata, and make explicit deletion clear IndexedDB, legacy copies, native files, and native snapshots without adding a TTL.

Reel playback metadata may use a `poster` field for the media source, so download catalog metadata must use the explicit thumbnail reference instead of assuming `poster` is an image.

**Why:** A video URL is not a valid `<img>` source; older download rows can also have expired or missing remote thumbnails.

**How to apply:** Persist a resolved thumbnail when available, and fall back to a poster frame generated from the cached video bytes before showing a gradient placeholder.

Upload size must not be coupled to compression success. Resumable TUS should receive the original File when browser metadata, codecs, or device memory make adaptive compression unavailable.

**Why:** A client-side compression ceiling turns large uploads into hard failures and defeats resumable storage; preserving the source keeps multi-gigabyte uploads possible.

**How to apply:** Use compression only as a best-effort optimization, retain native dimensions through 4K, and report progress at the chunk level while the upload continues independently of route navigation.