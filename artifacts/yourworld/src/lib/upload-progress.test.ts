import assert from "node:assert/strict";
import { test } from "node:test";
import {
  arePendingVideoUploadSummariesEqual,
  selectPendingVideoUploadSummary,
  type UploadTask,
} from "./upload-progress";

function videoTask(overrides: Partial<UploadTask> = {}): UploadTask {
  return {
    id: "video-1",
    kind: "video",
    label: "New video",
    viewTo: "/video/video-1",
    progress: 10,
    status: "uploading",
    ownerId: "owner-1",
    ...overrides,
  };
}

test("upload progress changes do not change the pending-video summary", () => {
  const first = selectPendingVideoUploadSummary([videoTask()]);
  const progressUpdate = selectPendingVideoUploadSummary([
    videoTask({ progress: 72, detail: "Uploading" }),
  ]);

  assert.deepEqual(progressUpdate, first);
  assert.equal(arePendingVideoUploadSummariesEqual(first, progressUpdate), true);
});

test("pending-video summary changes when an upload starts, finishes, or changes owner", () => {
  const empty = selectPendingVideoUploadSummary([]);
  const pending = selectPendingVideoUploadSummary([videoTask()]);
  const finished = selectPendingVideoUploadSummary([
    videoTask({ status: "done", progress: 100 }),
  ]);
  const transferred = selectPendingVideoUploadSummary([
    videoTask({ ownerId: "owner-2" }),
  ]);

  assert.equal(arePendingVideoUploadSummariesEqual(empty, pending), false);
  assert.equal(arePendingVideoUploadSummariesEqual(pending, finished), false);
  assert.equal(arePendingVideoUploadSummariesEqual(pending, transferred), false);
});