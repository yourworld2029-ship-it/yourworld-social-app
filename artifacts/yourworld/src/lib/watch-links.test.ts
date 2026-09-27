import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWatchShareUrl, parseWatchShareUrl } from "./watch-links";

test("watch links preserve IDs and content kind", () => {
  const videoId = "8d07ab4e-98d9-4c71-bba7-772313481aea";
  const videoUrl = buildWatchShareUrl(videoId, "video");
  const reelUrl = buildWatchShareUrl(videoId, "reel");

  assert.equal(videoUrl, `/watch/${videoId}?type=video`);
  assert.deepEqual(parseWatchShareUrl(`https://example.com${videoUrl}`), {
    id: videoId,
    kind: "video",
  });
  assert.deepEqual(parseWatchShareUrl(`https://example.com${reelUrl}`), {
    id: videoId,
    kind: "reel",
  });
});

test("watch link parser rejects unrelated and malformed links", () => {
  assert.equal(parseWatchShareUrl("https://example.com/profile"), null);
  assert.deepEqual(parseWatchShareUrl("https://example.com/watch/not-a-uuid?type=video"), {
    id: "not-a-uuid",
    kind: "video",
  });
});