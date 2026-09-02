# YourWorld

YourWorld is a TanStack Start social and creator platform running on Replit with Supabase for authentication, data, realtime, and storage.

## Replit configuration

- Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Replit Secrets.
- Build with `pnpm --filter @workspace/yourworld run build`.
- Run locally with `pnpm --filter @workspace/yourworld run dev`.

## Development

Use Node.js and pnpm.

```sh
git clone <this-repository-url>
cd <repository-name>
pnpm install
pnpm --filter @workspace/yourworld run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
