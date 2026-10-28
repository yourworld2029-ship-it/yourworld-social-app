---
name: Social Chat preferences
description: Distinguish participant-private chat options from settings shared by both conversation members.
---

Social Chat stores private controls and secret-lock material in each participant's conversation preference row. Auto-delete and capture protection are shared conversation settings so both participants follow the same policy. The participant who enables capture protection owns its off-switch.

**Why:** Auto-delete must not diverge between participants, and the user explicitly requires chat capture protection enabled by either participant to apply on both devices.

**How to apply:** Keep unrelated controls participant-scoped. Persist shared policy on the conversation row, deliver it through realtime, and enforce any owner-only switch behavior in a database trigger rather than relying on UI state alone.

Settings-level message access, read receipts, daily app usage/limits, and notification categories are user-scoped Supabase preferences. “Only People You Follow” blocks new direct-message threads from people the recipient does not follow, while existing conversations remain usable. Read-receipt enforcement must not block View Once/after-view open tracking. Notification categories filter in-app events and message/call pushes; unrelated device-local preferences stay local.

**Why:** The user explicitly requested these settings be persisted and enforced across the backend, not just stored on one device.

**How to apply:** Keep these controls user-scoped, enforce message access and read receipts at the database boundary, and suppress pushes before delivery. Preserve the distinction between incoming-message access and shared conversation controls.