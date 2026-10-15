---
name: Social Chat preferences
description: Distinguish participant-private chat options from settings shared by both conversation members.
---

Social Chat stores private controls and secret-lock material in each participant's conversation preference row. Auto-delete and capture protection are shared conversation settings so both participants follow the same policy. The participant who enables capture protection owns its off-switch.

**Why:** Auto-delete must not diverge between participants, and the user explicitly requires chat capture protection enabled by either participant to apply on both devices.

**How to apply:** Keep unrelated controls participant-scoped. Persist shared policy on the conversation row, deliver it through realtime, and enforce any owner-only switch behavior in a database trigger rather than relying on UI state alone.

Settings-level "Who can message you" and ordinary read-receipt choices are a separate, user-scoped local preference. Do not present the message-access choice as server-enforced or move it into auth/schema without explicit approval. Disabling read receipts skips ordinary `is_read` writes; View Once and after-view messages still record opens so their expiry behavior remains intact.

**Why:** The user explicitly requested these Settings modules without database/auth changes and accepted local preference persistence.

**How to apply:** Keep these choices in user-keyed local storage. If cross-device or server-enforced message access is later required, get approval before adding a schema, RLS, or API policy.