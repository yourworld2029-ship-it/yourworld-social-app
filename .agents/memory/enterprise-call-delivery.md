---
name: Enterprise call delivery
description: Constraints and deployment boundaries for background calling, Web Push, TURN, and native VoIP.
---

The web app can wake a signed-in browser with Web Push and pass the call action back through the service worker. The sender must stay server-side behind a JWT-protected Supabase Edge Function; browser code may only store public subscription material.

**Why:** Browsers cannot receive APNs PushKit VoIP events or provide native Android full-screen call behavior. Application-level E2EE also requires a separately authenticated key exchange and should not be claimed from baseline DTLS-SRTP.

**How to apply:** Configure VAPID secrets in the Supabase function environment and inject the public key into the web build. Use expiring managed TURN credentials for production. Treat a native iOS/Android companion as a separate deliverable for PushKit/FCM full-screen calls.