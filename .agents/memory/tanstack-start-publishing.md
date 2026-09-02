---
name: TanStack Start publishing
description: Deployment constraints for imported TanStack Start apps using Nitro output.
---

Imported TanStack Start apps that use SSR or server functions must publish the Nitro Node server bundle as a runnable HTTP service. A static artifact configuration cannot serve the generated output because the build may contain assets under `.output/public` but no static `index.html`; the actual route handler lives in `.output/server`.

**Why:** A static `publicDir` mismatch can produce a successful build followed by production healthcheck 500s and “static handler not found” responses, while the same app works in the development workflow.

**How to apply:** Configure the production build with `NITRO_PRESET=node-server`, run `.output/server/index.mjs` with the deployment `PORT`, and healthcheck `/`. Validate the generated preset and a local production process before republishing.