import assert from "node:assert/strict";
import { test } from "node:test";
import { formatVideoDuration, readVideoDurationSeconds } from "./video-duration";

test("reads the stored duration_seconds value first", () => {
  assert.equal(
    readVideoDurationSeconds({ duration_seconds: 139, metadata: { duration: 201 } }),
    139,
  );
});

test("reads numeric and mm:ss durations from metadata when the column is empty", () => {
  assert.equal(
    readVideoDurationSeconds({ duration_seconds: 0, metadata: { duration: "2:19" } }),
    139,
  );
  assert.equal(
    readVideoDurationSeconds({ video_metadata: { durationSeconds: "88.5" } }),
    88.5,
  );
});

test("formats positive lengths as m:ss and h:mm:ss without fabricating zero labels", () => {
  assert.equal(formatVideoDuration(139), "2:19");
  assert.equal(formatVideoDuration(3723), "1:02:03");
  assert.equal(formatVideoDuration(0), null);
  assert.equal(formatVideoDuration(null), null);
});