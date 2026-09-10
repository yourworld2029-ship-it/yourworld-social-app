---
name: WebRTC call signaling
description: Negotiation and fallback signaling constraints for YourWorld calls.
---

The initial caller offer is created before the ringing row is inserted and must remain the durable offer reused after acceptance. Treat Supabase Broadcast as an acceleration path only; the receiver must be able to answer the stored offer when the accept event is delayed or missed.

**Why:** A second offer triggered only by a single realtime accept broadcast can race the first offer, while receiver-side ICE writes can overwrite an incompletely hydrated fallback signal. The call can ring and appear accepted without negotiating usable media.

**How to apply:** Hydrate fallback signal state from the ringing row before opening the call channel, serialize SDP/ICE signal handling, queue ICE until `remoteDescription` exists, and mark the call active only after the local RTCPeerConnection reaches `connected`.