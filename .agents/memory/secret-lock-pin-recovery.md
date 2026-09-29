---
name: Secret Lock PIN recovery
description: Security invariants for Secret Lock PIN hashes and account-password recovery.
---

New PINs use a versioned PBKDF2 hash. Keep legacy salted SHA-256 verification for locks that have not yet been reset or changed.

Password recovery must verify the currently signed-in user's password in an isolated, non-persistent Supabase auth client. Do not send the password through chat, persist it, or replace/broadcast the app's active session.

Recovery clears only the signed-in user's current chat lock fields; it must not affect other chats or unrelated protection settings.

**Why:** Four-to-eight digit PINs are vulnerable to offline guessing when stored with a fast digest, and password verification through the primary auth client can trigger unrelated session listeners.

**How to apply:** Keep PIN format/version handling and recovery mutations confined to Secret Lock. Preserve legacy verification until old rows are migrated by their owners, and test both hash formats.