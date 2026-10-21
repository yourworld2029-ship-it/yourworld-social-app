---
name: Live replay deletion
description: Keep replay deletion owner-authorized while allowing metadata cleanup when storage objects are missing or detached.
---

Authorize replay deletion from the owner-scoped replay row. Delete only storage objects whose bucket and path remain inside the owner's live-replay folder, but treat object cleanup as best-effort: a missing, detached, or temporarily unreachable file must not block deletion of the replay record and its linked backing post. Remove the Live-tab card after the server confirms metadata deletion.

**Why:** generic post deletion can reject a live-replay bucket/path, while requiring storage deletion first leaves dead replay cards when media has moved or already disappeared.

**How to apply:** route Live-tab deletion through the authenticated replay endpoint, keep the storage bucket allowlist aligned across media helpers, and never broaden a detached path into an unowned delete target.
