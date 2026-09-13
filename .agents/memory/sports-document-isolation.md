---
name: Sports document isolation
description: Security boundary for private sports verification files in Supabase Storage
---

Sports verification files must use the private `documents` bucket with the first path segment equal to the owner user ID. Only an authenticated session whose `auth.uid()` matches that segment may insert, list, or create signed download URLs.

**Why:** the project had a broad public storage policy that would have made an owner-only policy ineffective. The policy must preserve existing public behavior for unrelated media buckets while excluding `documents`.

**How to apply:** never expose document object paths or public URLs in profile data. Keep upload, listing, and signed URL creation behind an owner-session check in the client and matching Storage RLS policies.