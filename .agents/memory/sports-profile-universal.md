---
name: Universal Sports Profile entry
description: Boundary between detected sports profiles and universal owner access to the existing Sports Profile editor
---

The public/admin parser should remain strict so only profiles with an explicit Player or Coach identity enter sports review. The signed-in owner Profile may use an empty Player draft fallback solely to expose the existing Sports Profile editor; the user can switch the existing Role field to Coach before saving.

**Why:** Universal editor access is required without making every generic profile look like a submitted sports identity or adding a second storage/schema path.

**How to apply:** Keep the existing Sports Profile card, details panel, serializer, verification handlers, and owner-scoped storage unchanged. Apply the fallback at the owner Profile entry point, not by weakening the parser used for badges or admin review.