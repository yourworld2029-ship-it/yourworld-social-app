---
name: Quality-specific downloads
description: Constraints and fallback behavior for source-quality downloads and browser-side exports.
---

When a source URL exists, keep 1080p, 720p, 480p, 360p, and Original selectable. Use an exact quality-specific URL when available. Otherwise, an authorized server may create a genuinely lower-resolution rendition from a permitted source and cache it privately. If conversion is not available, never label direct-source bytes as a smaller tier: deliver the authorized source with its actual quality and measured size, or “Size unavailable,” when appropriate; fail rather than silently treating it as a conversion.

Show a size estimate only when the picker has confirmed that the selected choice will use an on-demand conversion. Direct-source downloads use their measured size, and unknown source quality must not receive a smaller-tier estimate.

**Why:** Users need every tier to remain selectable, but a tier label or estimate must never imply smaller bytes when the server is actually returning the original source.

**How to apply:** Prefer exact variants. For a lower requested tier without a variant, call an access-checked conversion endpoint and require its returned rendition to be verified and stored before displaying a conversion estimate. Otherwise use only the authorized direct source, retain its actual tier (or Original when unknown), and keep legacy source-quality metadata optional.

Keep quality/audio labels and selection behavior in the shared download sheet; route-specific code should only resolve the media URL and dispatch the selected choice.

**Why:** Multiple video surfaces use the same browser export helpers, so duplicated sheets can drift in available tiers, source fallbacks, or extension messaging.

**How to apply:** When adding a new download entry point, pass its source tier, duration, title, and download callback into the shared sheet instead of rebuilding the option list.

The Downloads tab is a device-wide library: never filter its rows by the signed-in user's ID. Keep the metadata index under the stable `device_offline_videos` key, with video bytes in IndexedDB or Android app-private storage.

**Why:** the user explicitly requires downloaded media to remain visible across logout, account changes, and auth-token removal on the same device.

**How to apply:** list every saved device record regardless of current auth state, update the device index after saves/deletes, and keep sign-out/account cleanup away from that key and the media stores.

Offline downloads are user-retained media, not a temporary cache: keep web copies in persistent IndexedDB and Android copies in app-private files with recoverable metadata. Never expire or purge them automatically; a manual delete must remove the media and every registry or recovery record. Temporary playback-range caches remain separate.

**Why:** Users expect downloaded videos to remain playable offline until they choose to delete them; cache eviction or stale native snapshots can otherwise make files disappear from the library or reappear after deletion.

**How to apply:** Keep persistence requests ahead of IndexedDB use, restore Android entries from native transfer metadata, and make explicit deletion clear IndexedDB, legacy copies, native files, and native snapshots without adding a TTL.

The device-scoped Downloads view must remain usable while auth/profile state is loading or unavailable. Sign-out and session refresh may clear in-memory account state, but must not purge or replace saved media; only an explicit download-delete action removes a download.

**Why:** Offline users need to reach their saved library after an app restart even when the remote profile cannot load, and transient auth changes must not destroy device copies.

**How to apply:** Render the Downloads tab directly from the persistent device library independently of profile fetch completion. Preserve existing records on refresh failures and never narrow the list when the current user changes.

Reel playback metadata may use a `poster` field for the media source, so download catalog metadata must use the explicit thumbnail reference instead of assuming `poster` is an image.

**Why:** A video URL is not a valid `<img>` source; older download rows can also have expired or missing remote thumbnails.

**How to apply:** Persist a resolved thumbnail when available, and fall back to a poster frame generated from the cached video bytes before showing a gradient placeholder.
