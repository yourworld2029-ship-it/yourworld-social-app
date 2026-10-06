import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWatchShareUrl, parseWatchShareUrl } from "./watch-links";
import { DEFAULT_PUBLIC_APP_URL } from "./public-app-url";

test("watch links preserve IDs and content kind", () => {
  const videoId = "8d07ab4e-98d9-4c71-bba7-772313481aea";
  const videoUrl = buildWatchShareUrl(videoId, "video");
  const reelUrl = buildWatchShareUrl(videoId, "reel");

  assert.equal(videoUrl, `${DEFAULT_PUBLIC_APP_URL}/watch/${videoId}?type=video`);
  assert.equal(reelUrl, `${DEFAULT_PUBLIC_APP_URL}/watch/${videoId}?type=reel`);
  assert.deepEqual(parseWatchShareUrl(videoUrl), {
    id: videoId,
    kind: "video",
  });
  assert.deepEqual(parseWatchShareUrl(reelUrl), {
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