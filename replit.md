# YourWorld

YourWorld is a social and creator platform for sharing posts, moments, reels, messages, and community experiences.

## Run & Operate

- `pnpm --filter @workspace/yourworld run dev` — run the YourWorld web app
- `pnpm --filter @workspace/api-server run dev` — run the starter API server when API work is needed
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/yourworld run build` — build the imported TanStack Start app
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Supabase configuration is loaded from the `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` Replit Secrets. The build exposes only these public client values.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: TanStack Start + React 19 + TypeScript
- Styling: Tailwind CSS v4 with Radix UI primitives
- Auth & data: Supabase Auth, Postgres, Storage, and Realtime
- Routing: TanStack Router with generated file-based route tree
- Build: Vite + Nitro

## Where things live

- `artifacts/yourworld/src/routes/` — product routes for feed, profiles, channels, moments, reels, chat, notifications, settings, uploads, and wallet
- `artifacts/yourworld/src/components/` — shared app and Radix UI components
- `artifacts/yourworld/src/lib/` — state stores, Supabase data access, uploads, media helpers, and server functions
- `artifacts/yourworld/src/styles.css` — YourWorld theme and global styles
- `artifacts/yourworld/src/integrations/supabase/` — browser/server Supabase clients and auth helpers

## Architecture decisions

- The imported TanStack route tree remains the source of truth for navigation; the artifact shell mounts it through `RouterProvider`.
- The app is mobile-first and intentionally constrains the primary surface to a centered narrow viewport with persistent bottom navigation.
- Supabase remains the backing service because it is part of the imported application contract and its public configuration is bundled with the source.

## Product

Users can discover and publish social content, manage profiles and creator channels, share moments and reels, message other people, receive notifications, upload videos, and view creator earnings.

## User preferences

No additional preferences have been provided.

## Gotchas

- Keep the YourWorld web workflow as the preview entry point; the starter API and mockup services are separate artifacts.
- Run the web package typecheck after changing imported dependencies or route code.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
