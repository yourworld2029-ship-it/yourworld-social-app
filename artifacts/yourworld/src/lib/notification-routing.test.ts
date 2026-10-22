import assert from "node:assert/strict";
import test from "node:test";
import { resolveNotificationDestination } from "@/lib/notification-routing";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const contentId = "33333333-3333-4333-8333-333333333333";
const commentId = "44444444-4444-4444-8444-444444444444";

test("message notification opens its canonical direct conversation", () => {
  assert.deepEqual(
    resolveNotificationDestination(`/chat/dm_${[userA, userB].sort().join("_")}`),
    { kind: "chat", threadId: `dm_${[userA, userB].sort().join("_")}` },
  );
});

test("like and comment notification destinations open the exact reel or video", () => {
  assert.deepEqual(
    resolveNotificationDestination(
      `/reels?initialVideoId=${contentId}&focusComments=true&commentId=${commentId}`,
    ),
    { kind: "reels", initialVideoId: contentId, focusComments: true, commentId },
  );
  assert.deepEqual(
    resolveNotificationDestination(`/video/${contentId}?focusComments=true&commentId=${commentId}`),
    { kind: "video", videoId: contentId, focusComments: true, commentId },
  );
});

test("follow notification opens the actor profile", () => {
  assert.deepEqual(resolveNotificationDestination(`/u/${userA}`), {
    kind: "profile",
    userId: userA,
  });
});

test("external and malformed notification URLs are rejected", () => {
  assert.equal(resolveNotificationDestination("https://outside.example/u/123"), null);
  assert.equal(resolveNotificationDestination("//outside.example/u/123"), null);
  assert.equal(resolveNotificationDestination("/chat/not-a-thread"), null);
  assert.equal(resolveNotificationDestination("/reels"), null);
});
