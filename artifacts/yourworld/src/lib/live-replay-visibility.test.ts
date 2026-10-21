import assert from "node:assert/strict";
import test from "node:test";
import { excludeIdsFromLiveReplayPosts } from "./live-replay-visibility.utils";

test("live replay backing posts are excluded from regular video lists", () => {
  const posts = [{ id: "regular-1" }, { id: "live-post" }, { id: "regular-2" }];
  assert.deepEqual(
    excludeIdsFromLiveReplayPosts(posts, new Set(["live-post"])),
    [{ id: "regular-1" }, { id: "regular-2" }],
  );
});

test("regular posts remain visible when there are no linked live replays", () => {
  const posts = [{ id: "regular-1" }];
  assert.deepEqual(excludeIdsFromLiveReplayPosts(posts, new Set()), posts);
});
