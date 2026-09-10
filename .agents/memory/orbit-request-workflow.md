---
name: Orbit request workflow
description: Rules for pending Orbit chat requests, their server enforcement, and acceptance behavior.
---

Pending Orbit requests use one combined cap of three sender-authored text/photo messages. The cap is enforced by a serialized database trigger and sender-only RPC, not only by the UI. Only the addressee can accept or decline; acceptance creates the canonical requester-to-addressee connection, while realtime request/connection refreshes unlock the accepted chat.

**Why:** Client-only counters allowed concurrent sends and the previous status update let either participant accept a request. Orbit request state must stay isolated from Social chat and shared call UI.

**How to apply:** Keep pending voice notes and calls gated in the Orbit route, use the request RPCs for mutations, and preserve user_blocks as the enforcement source for blocked participants.