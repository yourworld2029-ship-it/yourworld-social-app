---
name: Follow and view schema
description: Live YourWorld follow relationships and unique media views are database-backed and use profile follow counters plus posts.views_count.
---

The live social database is the source of truth for follow relationships and unique authenticated media views. Follow mutations must go through an atomic database operation that maintains profile counters; view mutations must use the composite user/content/type uniqueness key and increment the existing posts view counter.

**Why:** The deployed project initially had neither relationship/view table nor RPC, and its posts counter is named `views_count`; assuming a different generated schema silently made follow buttons unavailable and view counts unreliable.

**How to apply:** Keep future follow/view changes additive and live-schema-aware. Never rebuild legacy view counters from the unique-view table unless the old counter has been explicitly migrated or backed up.