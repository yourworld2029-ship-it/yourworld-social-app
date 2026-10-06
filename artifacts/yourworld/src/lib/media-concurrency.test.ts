import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acquireMediaDownloadLock,
  acquireMediaUploadLock,
  getMediaConcurrencySnapshot,
  releaseMediaDownloadLock,
  releaseMediaUploadLock,
  withMediaDownloadLock,
} from "./media-concurrency";

test("media upload and download locks are app-wide and independent", async () => {
  assert.equal(acquireMediaUploadLock("upload-1"), true);
  assert.equal(acquireMediaUploadLock("upload-2"), false);
  assert.deepEqual(getMediaConcurrencySnapshot(), {
    isMediaUploadInProgress: true,
    isMediaDownloadInProgress: false,
  });

  const lease = acquireMediaDownloadLock();
  assert.ok(lease);
  assert.equal(acquireMediaDownloadLock(), null);
  assert.deepEqual(getMediaConcurrencySnapshot(), {
    isMediaUploadInProgress: true,
    isMediaDownloadInProgress: true,
  });

  let nestedDownloadRan = false;
  assert.equal(
    await withMediaDownloadLock(() => {
      nestedDownloadRan = true;
      return "completed";
    }, lease),
    "completed",
  );
  assert.equal(nestedDownloadRan, true);

  let blockedDownloadRan = false;
  assert.equal(
    await withMediaDownloadLock(() => {
      blockedDownloadRan = true;
    }),
    null,
  );
  assert.equal(blockedDownloadRan, false);

  releaseMediaDownloadLock({ token: Symbol("not-owner") });
  assert.equal(getMediaConcurrencySnapshot().isMediaDownloadInProgress, true);
  releaseMediaDownloadLock(lease);
  releaseMediaUploadLock("upload-1");
  assert.deepEqual(getMediaConcurrencySnapshot(), {
    isMediaUploadInProgress: false,
    isMediaDownloadInProgress: false,
  });
});
