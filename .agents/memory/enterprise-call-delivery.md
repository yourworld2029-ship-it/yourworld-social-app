---
name: Enterprise call delivery
description: Constraints and deployment boundaries for background calling, Web Push, TURN, and native VoIP.
---

Use provider-specific, server-authorized push paths: browser Web Push stays in the JWT-protected Supabase Edge Function, while Capacitor Android uses data-only FCM through the JWT-protected API server. Before either path wakes a device, the server must verify the ringing call belongs to the caller and recheck the recipient's Secret Lock. Each sender must query only its own provider's subscriptions.

**Why:** Web Push cannot provide Android full-screen call behavior, and mixing FCM tokens into Web Push delivery causes the wrong provider to handle or delete them. FCM service-account credentials must remain server-side; the Android client config is not a sender credential.

**How to apply:** Keep FCM and Web Push rows distinct in `call_push_subscriptions`, transfer an FCM token to the currently authenticated account on registration, and keep the service-account JSON in Replit Secrets. Preserve the Secret Lock check before recipient/device lookup. Native iOS still needs its own PushKit/VoIP delivery path; do not claim application-level E2EE from baseline DTLS-SRTP.