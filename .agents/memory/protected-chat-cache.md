---
name: Protected chat cache
description: Requirements for encrypted chat caches and clearing threads without stale async restoration.
---

When Protect Chat is enabled, persist thread messages only as AES-GCM ciphertext in IndexedDB. Keep the non-extractable per-user CryptoKey on the same device, bind ciphertext to its owner and thread with authenticated additional data, migrate and remove legacy plaintext copies, and suppress plaintext writes while the setting is unresolved or transitioning. Runtime memory may still hold rows for rendering; do not add a chat loading gate for cache encryption.

**Why:** Protect Chat must cover local message caches without changing server payloads or the existing UI/security-toggle behavior. If browser data is cleared, both the device-local key and protected offline cache may be lost; the server conversation remains the source for reloading messages.

**How to apply:** Gate both localStorage and IndexedDB thread-cache reads/writes on the resolved setting, finish cache migration before switching the policy to its final state, and fail closed by removing legacy plaintext if encryption cannot be completed.

When “Clear for Everyone” succeeds, clear in-memory and browser-storage copies and invalidate pending cache reads and writes for that thread. Serialize cache writes with the clear so stale work cannot restore pre-clear messages; in protected mode, remove any legacy plaintext copy as well. Persist a clear-time tombstone so a legacy sender/receiver-pair fallback cannot revive rows when the canonical conversation query is empty; messages created after the clear time remain visible.

**Why:** Deleting server rows alone is insufficient when an older asynchronous cache read or write can repopulate the conversation after navigation or re-entry. Merging an empty server response or falling back to legacy pair-only rows also leaves old messages visible.

**How to apply:** Any shared thread-purge path should advance a per-thread cache generation before clearing rows, guard late hydration and state updates, ensure queued old writes cannot persist after the cleared state is established, and apply the clear-time boundary to later server reads on every participant device that receives the clear event.