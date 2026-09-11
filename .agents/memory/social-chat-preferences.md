---
name: Social Chat preferences
description: Social Chat settings use participant-scoped conversation preferences while auto-delete remains a shared conversation policy.
---

Social Chat stores per-user toggles and secret-lock material in a participant-scoped conversation preference row. The effective auto-delete mode is still written to and read from the shared conversation so both participants use the same message-expiry behavior.

**Why:** Legacy peer-scoped Orbit settings could not reliably represent settings for a specific Social Chat conversation, while auto-delete must not diverge between participants.

**How to apply:** Keep Social Chat writes conversation-scoped and preserve compatibility writes only where Orbit or display-name code still depends on the legacy settings table. Enforce block behavior in database policies/triggers, not only in the UI.