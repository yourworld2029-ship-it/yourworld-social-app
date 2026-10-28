---
name: WebRTC call signaling
description: Negotiation and fallback signaling constraints for YourWorld calls.
---

The initial caller offer is created before the ringing row is inserted and must remain the durable offer reused after acceptance. Treat Supabase Broadcast as an acceleration path only; the receiver must be able to answer the stored offer when the accept event is delayed or missed.

**Why:** A second offer triggered only by a single realtime accept broadcast can race the first offer, while receiver-side ICE writes can overwrite an incompletely hydrated fallback signal. The call can ring and appear accepted without negotiating usable media.

**How to apply:** Hydrate fallback signal state from the ringing row before opening the call channel, serialize SDP/ICE signal handling, queue ICE until `remoteDescription` exists, and mark the call active only after the local RTCPeerConnection reaches `connected`.

For call-camera acquisition, request 2K at 30 fps first with HD/SD fallbacks for both initial setup and camera replacement; keep the adaptive sender bitrate and scaling policy separate.

**Why:** The user wants a clearer, smooth call-camera preview, while lower-end devices and network adaptation must remain supported.

**How to apply:** Change capture constraints without silently removing the existing sender/network safeguards or changing signaling behavior.

Keep transient call bandwidth controls separate from the durable SDP/ICE fallback, and give remote video-pause requests an expiry.

**Why:** Saving a bandwidth-control message over the negotiation fallback can prevent reconnection; a lost resume message must not leave the other participant's camera transmission paused indefinitely. Pausing the whole remote media element also pauses its audio.

**How to apply:** Use short-lived, renewable video-only control messages, preserve audio tracks and playback, and leave stored offers/answers intact during quality adaptation.