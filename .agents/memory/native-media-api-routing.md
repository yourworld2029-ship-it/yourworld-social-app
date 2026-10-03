---
name: Native media API routing
description: Why packaged Android media API requests must use the hosted application origin.
---

In a packaged Capacitor app, relative media API requests target the bundled WebView asset server, not the hosted backend. Use the configured hosted API origin for native media requests; retain relative artifact-aware paths in the browser.

**Why:** The asset server can return a successful HTML shell for an API URL, producing an incomplete-response error instead of reaching the authenticated media service. This affected native playback, downloads, and upload orchestration.

**How to apply:** When adding a media API caller, check native URL resolution explicitly. Never derive the hosted backend from the WebView's location origin. Cross-origin upload authentication must also validate the actual hosted endpoint origin before forwarding an access token.