---
name: TanStack Start publishing
description: Deployment constraints for imported TanStack Start apps using Nitro output.
---

Imported TanStack Start apps that use SSR or server functions must publish the Nitro Node server bundle as a runnable HTTP service. A static artifact configuration cannot serve the generated output because the build may contain assets under `.output/public` but no static `index.html`; the actual route handler lives in `.output/server`. Do not leave a Vite SPA `index.html` at the artifact root: Nitro can auto-detect it as a renderer template and serve its source-only `/src/...` entry unchanged instead of invoking TanStack SSR.

**Why:** Static output mismatches can produce a successful build followed by healthcheck failures; a root SPA template can also produce HTTP 200 with a visually blank page because the production browser cannot run the unbuilt TypeScript source entry.

**How to apply:** Configure the production build with `NITRO_PRESET=node-server`, run `.output/server/index.mjs` with the deployment `PORT`, and healthcheck `/`. Validate that the local production response contains SSR markup and hashed assets—not `/src/...` module URLs—before republishing.

For a custom Nitro wrapper, statically import the default export from `@tanstack/react-start/server-entry` instead of dynamically importing its module namespace. A production SSR bundle can fail at namespace construction with `TypeError: i is not a function`; selecting the default export directly avoids that generated namespace path.

**Why:** This import shape reproduced as a local production `GET /` 500 after the build itself succeeded; the direct default import restored a 200 response without changing route behavior.

**How to apply:** When deployment logs show a namespace-construction error in the generated SSR entry, inspect custom server wrappers for dynamic namespace imports of `server-entry` and test a direct default import with the local Nitro server before changing routes or deployment settings.