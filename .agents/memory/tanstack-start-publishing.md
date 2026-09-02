---
name: TanStack Start publishing
description: Deployment constraints for imported TanStack Start apps using Nitro output.
---

Imported TanStack Start apps that use SSR or server functions must publish the Nitro Node server bundle as a runnable HTTP service. A static artifact configuration cannot serve the generated output because the build may contain assets under `.output/public` but no static `index.html`; the actual route handler lives in `.output/server`. Do not leave a Vite SPA `index.html` at the artifact root: Nitro can auto-detect it as a renderer template and serve its source-only `/src/...` entry unchanged instead of invoking TanStack SSR.

**Why:** Static output mismatches can produce a successful build followed by healthcheck failures; a root SPA template can also produce HTTP 200 with a visually blank page because the production browser cannot run the unbuilt TypeScript source entry.

**How to apply:** Configure the production build with `NITRO_PRESET=node-server`, run `.output/server/index.mjs` with the deployment `PORT`, and healthcheck `/`. Validate that the local production response contains SSR markup and hashed assets—not `/src/...` module URLs—before republishing.