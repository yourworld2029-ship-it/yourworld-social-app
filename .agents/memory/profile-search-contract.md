---
name: Profile search contract
description: User search should use the secured profile RPC and preserve display name plus unique username.
---

User search is a profile lookup, not a replacement for profile identity: query the secured database search function with one normalized term, then map both `display_name` and `username` into the existing result/navigation shape.

**Why:** Direct table queries can diverge from the app’s security rules, and treating the display name as the username makes searches or profile labels fail when those values differ.

**How to apply:** Strip leading `@` (and optional search decoration) before the RPC call; let the database match username, display name, and legacy full name while returning the same profile ID for navigation.