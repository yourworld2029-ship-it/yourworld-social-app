---
name: Social Chat preferences
description: Distinguish participant-private chat options from settings shared by both conversation members.
---

Social Chat stores private controls and secret-lock material in each participant's conversation preference row. Auto-delete and capture protection are shared conversation settings so both participants follow the same policy. The participant who enables capture protection owns its off-switch.

**Why:** Auto-delete must not diverge between participants, and the user explicitly requires chat capture protection enabled by either participant to apply on both devices.

**How to apply:** Keep unrelated controls participant-scoped. Persist shared policy on the conversation row, deliver it through realtime, and enforce any owner-only switch behavior in a database trigger rather than relying on UI state alone.