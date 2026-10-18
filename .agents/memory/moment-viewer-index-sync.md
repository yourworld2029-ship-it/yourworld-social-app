---
name: Moment viewer index sync
description: Keep Moment viewer navigation stable when its shared data store refreshes.
---

When a Moment viewer navigates among multiple segments in one author group, synchronize the visible segment from the route-selected Moment only when that route ID changes. Store refreshes can replace item object and array references without changing the route; they must not reset the viewer index.

**Why:** Registering a view or receiving a realtime update can refresh the Moment list while the viewer route still points at the first segment, which otherwise sends next/previous navigation back to that segment.

**How to apply:** When changing Moment viewer routing, segment navigation, or store refresh behavior, keep route synchronization keyed to the selected Moment ID and verify that refreshing views does not interrupt next/previous navigation.
