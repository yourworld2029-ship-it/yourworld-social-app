---
name: Protected chat cache
description: Local persistence requirements for conversations whose existing Protect Chat setting is enabled.
---

When Protect Chat is enabled, persist thread messages only as AES-GCM ciphertext in IndexedDB. Keep the non-extractable per-user CryptoKey on the same device, bind ciphertext to its owner and thread with authenticated additional data, migrate and remove legacy plaintext copies, and suppress plaintext writes while the setting is unresolved or transitioning. Runtime memory may still hold rows for rendering; do not add a chat loading gate for cache encryption.

**Why:** Protect Chat must cover local message caches without changing server payloads or the existing UI/security-toggle behavior. If browser data is cleared, both the device-local key and protected offline cache may be lost; the server conversation remains the source for reloading messages.

**How to apply:** Gate both localStorage and IndexedDB thread-cache reads/writes on the resolved setting, finish cache migration before switching the policy to its final state, and fail closed by removing legacy plaintext if encryption cannot be completed.