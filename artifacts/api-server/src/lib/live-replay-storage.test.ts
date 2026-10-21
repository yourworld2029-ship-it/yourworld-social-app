import assert from "node:assert/strict";
import test from "node:test";
import { getLiveReplayStorageObjects } from "./live-replay-storage";

const ownerId = "7f1fa8f7-5a8b-45af-8d46-6f8c9f35e125";
const streamId = "179d682f-5f82-48dc-bfce-7d42d4bec789";

test("resolves an owner-scoped live replay source and poster", () => {
  assert.deepEqual(
    getLiveReplayStorageObjects({
      ownerId,
      storageBucket: "live-replays",
      sourcePath: `${ownerId}/live-replays/${streamId}.mp4`,
      streamId,
    }),
    [
      {
        bucket: "live-replays",
        path: `${ownerId}/live-replays/${streamId}.mp4`,
      },
      {
        bucket: "live-replays",
        path: `${ownerId}/live-replays/${streamId}-poster.jpg`,
      },
    ],
  );
});

test("recognizes a bucket-prefixed source path", () => {
  assert.deepEqual(
    getLiveReplayStorageObjects({
      ownerId,
      storageBucket: "videos",
      sourcePath: `videos/${ownerId}/live-replays/${streamId}.mp4`,
      streamId,
    })[0],
    {
      bucket: "videos",
      path: `${ownerId}/live-replays/${streamId}.mp4`,
    },
  );
});

test("skips detached or unsafe source paths without creating an unsafe delete target", () => {
  assert.deepEqual(
    getLiveReplayStorageObjects({
      ownerId,
      storageBucket: "live-replays",
      sourcePath: `another-user/live-replays/${streamId}.mp4`,
      streamId,
    }),
    [
      {
        bucket: "live-replays",
        path: `${ownerId}/live-replays/${streamId}-poster.jpg`,
      },
    ],
  );
  assert.deepEqual(
    getLiveReplayStorageObjects({
      ownerId,
      storageBucket: "videos",
      sourcePath: `${ownerId}/live-replays/../private.mp4`,
      streamId: "not-a-uuid",
    }),
    [],
  );
});
