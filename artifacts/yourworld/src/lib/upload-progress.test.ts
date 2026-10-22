import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyUploadTaskPatch,
  arePendingVideoUploadSummariesEqual,
  formatUploadByteProgress,
  formatUploadBytes,
  selectPendingVideoUploadSummary,
  selectVisibleUploadTask,
  type UploadTask,
} from "./upload-progress";
import { shouldUseNativeUploadGuard } from "./upload-background";

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

test("upload UI formats byte-accurate transfer progress in decimal MB", () => {
  assert.equal(formatUploadBytes(560_000_000), "560 MB");
  assert.equal(
    formatUploadByteProgress(56_000_000, 560_000_000),
    "56 MB of 560 MB uploaded",
  );
  assert.equal(formatUploadByteProgress(20, null), null);
});

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

test("only the latest active upload is selected for the top progress card", () => {
  const older = videoTask({ id: "older" });
  const latest = videoTask({ id: "latest", progress: 34, kind: "post" });

  assert.equal(selectVisibleUploadTask([older, latest]), latest);
});

test("an earlier active upload remains visible when the latest task has finished", () => {
  const active = videoTask({ id: "active", progress: 62 });
  const completed = videoTask({ id: "completed", status: "done", progress: 100 });

  assert.equal(selectVisibleUploadTask([active, completed]), active);
});

test("the latest finished upload is selected when there are no active uploads", () => {
  const failed = videoTask({ id: "failed", status: "error" });
  const completed = videoTask({ id: "completed", status: "done", progress: 100 });

  assert.equal(selectVisibleUploadTask([failed, completed]), completed);
});

test("upload task patches preserve identity when the task is no longer present", () => {
  const tasks = [videoTask()];

  assert.equal(applyUploadTaskPatch(tasks, "dismissed-video", { progress: 72 }), tasks);
});

test("upload task patches preserve identity when progress values are unchanged", () => {
  const tasks = [videoTask()];

  assert.equal(
    applyUploadTaskPatch(tasks, "video-1", { progress: 10, status: "uploading" }),
    tasks,
  );
});

test("upload task patches create a new list only when a value changes", () => {
  const tasks = [videoTask()];
  const updated = applyUploadTaskPatch(tasks, "video-1", { progress: 72 });

  assert.notEqual(updated, tasks);
  assert.equal(updated[0]?.progress, 72);
  assert.equal(tasks[0]?.progress, 10);
});

test("native background upload guard covers videos, reels, and moments", () => {
  assert.equal(shouldUseNativeUploadGuard("video"), true);
  assert.equal(shouldUseNativeUploadGuard("reel"), true);
  assert.equal(shouldUseNativeUploadGuard("moment"), true);
  assert.equal(shouldUseNativeUploadGuard("post"), false);
  assert.equal(shouldUseNativeUploadGuard("post", true), true);
});