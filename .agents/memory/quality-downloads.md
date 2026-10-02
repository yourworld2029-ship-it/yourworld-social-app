---
name: Quality-specific downloads
description: Constraints and fallback behavior for source-quality downloads and browser-side exports.
---

When a source URL exists, always let users select 1080p, 720p, 480p, 360p, and Original. Use an exact quality-specific URL when one exists. If it does not, keep the tier selectable but clearly label that it downloads the direct source; record the actual source tier in offline metadata (or Original when unknown) and show the source size or “Size unavailable,” never a smaller-tier estimate.

**Why:** The product requires every quality choice to remain selectable even when a video has no transcoded variants. Silently calling the source file a different resolution or estimating a smaller download would mislead users.

**How to apply:** Resolve downloads to a matching variant URL when present and otherwise use the authorized direct source URL. Make source fallback visible in the picker, retain the source’s real quality label, and estimate a smaller size only for an actual variant asset. Keep source quality metadata optional for legacy rows.

Keep quality/audio labels and selection behavior in the shared download sheet; route-specific code should only resolve the media URL and dispatch the selected choice.

**Why:** Multiple video surfaces use the same browser export helpers, so duplicated sheets can drift in available tiers, source fallbacks, or extension messaging.

**How to apply:** When adding a new download entry point, pass its source tier, duration, title, and download callback into the shared sheet instead of rebuilding the option list.

Offline library surfaces must pair cached video bytes with an IndexedDB metadata record scoped to the downloading user. CacheStorage alone can play a file but cannot populate a reliable Downloads list or support safe deletion.

**Why:** Browser downloads previously had no searchable catalog, and signed-in users sharing a device must not see another account's offline records.

**How to apply:** Write metadata only after the selected video bytes are cached, resolve playback from the cache record, and delete both the cache entry and metadata row together.

Offline downloads are user-retained media, not a temporary cache: keep web copies in persistent IndexedDB and Android copies in app-private files with recoverable metadata. Never expire or purge them automatically; a manual delete must remove the media and every registry or recovery record. Temporary playback-range caches remain separate.

**Why:** Users expect downloaded videos to remain playable offline until they choose to delete them; cache eviction or stale native snapshots can otherwise make files disappear from the library or reappear after deletion.

**How to apply:** Keep persistence requests ahead of IndexedDB use, restore Android entries from native transfer metadata, and make explicit deletion clear IndexedDB, legacy copies, native files, and native snapshots without adding a TTL.

The owner-scoped Downloads view must remain usable from local storage while profile data is still loading or unavailable. Sign-out and session refresh may clear in-memory account state, but must not purge or replace saved media; only the user's explicit delete action removes a download.

**Why:** Offline users need to reach their saved library after an app restart even when the remote profile cannot load, and transient auth changes must not destroy device copies.

**How to apply:** Render the Downloads tab from the locally restored authenticated owner and local download registry independently of profile fetch completion. Preserve existing records on refresh failures, and scope every displayed row to the current owner.

Reel playback metadata may use a `poster` field for the media source, so download catalog metadata must use the explicit thumbnail reference instead of assuming `poster` is an image.

**Why:** A video URL is not a valid `<img>` source; older download rows can also have expired or missing remote thumbnails.

**How to apply:** Persist a resolved thumbnail when available, and fall back to a poster frame generated from the cached video bytes before showing a gradient placeholder.
