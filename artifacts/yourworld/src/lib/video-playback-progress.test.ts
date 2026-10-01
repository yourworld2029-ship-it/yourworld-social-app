import assert from "node:assert/strict";
import test from "node:test";
import { createVideoPlaybackProgressStore } from "./video-playback-progress";

test("video progress store only notifies subscribers when the snapshot changes", () => {
  const store = createVideoPlaybackProgressStore();
  let notifications = 0;
  const unsubscribe = store.subscribe(() => {
    notifications += 1;
  });

  store.setProgress(2.5, 30);
  assert.deepEqual(store.getSnapshot(), { currentTime: 2.5, duration: 30 });
  assert.equal(notifications, 1);

  store.setProgress(2.5, 30);
  assert.equal(notifications, 1);

  store.setCurrentTime(4);
  assert.deepEqual(store.getSnapshot(), { currentTime: 4, duration: 30 });
  assert.equal(notifications, 2);

  store.setDuration(60);
  assert.deepEqual(store.getSnapshot(), { currentTime: 4, duration: 60 });
  assert.equal(notifications, 3);

  unsubscribe();
  store.setProgress(5, 60);
  assert.equal(notifications, 3);
});

test("video progress store clamps invalid and negative values", () => {
  const store = createVideoPlaybackProgressStore();
  store.setProgress(-1, Number.NaN);
  assert.deepEqual(store.getSnapshot(), { currentTime: 0, duration: 0 });

  store.setProgress(Number.POSITIVE_INFINITY, 10);
  assert.deepEqual(store.getSnapshot(), { currentTime: 0, duration: 10 });
});