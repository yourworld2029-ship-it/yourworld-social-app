---
name: Orbit runtime schema
description: Runtime requirements for Orbit profile discovery, public visibility, and profile fallback.
---

The deployed Supabase project must contain `orbit_profiles`, its public-read/owner-write RLS policies, and the `discover_orbit_profiles(uuid[])` RPC before Orbit discovery can work. Client discovery should retain a direct-table fallback for deployments where the RPC is temporarily absent.

**Why:** The generated client types previously described Orbit objects that were missing from the runtime project, so Orbit profile creation, search, and deep links silently had no usable data source.

**How to apply:** Treat the live schema as authoritative, keep the additive Orbit migration in the repository, filter discovery by `orbit_enabled` and `visible`, and let the public profile route fall back to Orbit metadata when a standard profile row is absent.