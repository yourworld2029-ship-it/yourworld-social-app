---
name: Native media API routing
description: Why packaged Android media API requests must use the hosted application origin.
---

In a packaged Capacitor app, relative media API requests target the bundled WebView asset server, not the hosted backend. Use the configured hosted API origin for native media requests; retain relative artifact-aware paths in the browser. For cross-origin TUS creation, expose `Location` and `Stream-Media-Id` on the actual response so WebView JavaScript can continue the upload and retain its Cloudflare ID.

**Why:** The asset server can return a successful HTML shell for an API URL, producing an incomplete-response error instead of reaching the authenticated media service. Separately, browsers hide non-safelisted response headers from cross-origin JavaScript unless they are explicitly exposed; TUS needs `Location` to continue, and the app needs `Stream-Media-Id` to identify the uploaded video. A publish record can also disagree with the live service after a transient readiness error.

**How to apply:** When adding a media API caller, check native URL resolution explicitly. Never derive the hosted backend from the WebView's location origin. Also verify the specific route on the published API: a healthy deployment and a working local route do not prove that a newly added route has been published. If build status conflicts with logs, check the live root and exact route before changing code. Cross-origin upload authentication must validate the actual hosted endpoint origin before forwarding an access token. Test the cross-origin TUS response contract, including its exposed continuation and media-ID headers.