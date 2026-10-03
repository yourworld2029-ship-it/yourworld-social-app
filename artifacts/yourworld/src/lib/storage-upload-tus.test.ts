import assert from "node:assert/strict";
import test from "node:test";
import {
  getStorageResumableUploadEndpoint,
  CLOUDFLARE_TUS_CHUNK_SIZE,
  getTusRetryDelayMs,
  isRetryableTusError,
  RESUMABLE_UPLOAD_CHUNK_SIZE,
  shouldUseResumableStorageUpload,
} from "./storage-upload-tus-utils";

test("large uploads use the documented resumable chunk size threshold", () => {
  assert.equal(shouldUseResumableStorageUpload(RESUMABLE_UPLOAD_CHUNK_SIZE), false);
  assert.equal(shouldUseResumableStorageUpload(RESUMABLE_UPLOAD_CHUNK_SIZE + 1), true);
  assert.equal(shouldUseResumableStorageUpload(Number.POSITIVE_INFINITY), false);
});

test("TUS uploads use 6 MiB chunks and keep retrying with a bounded backoff", () => {
  assert.equal(RESUMABLE_UPLOAD_CHUNK_SIZE, 6 * 1024 * 1024);
  assert.equal(CLOUDFLARE_TUS_CHUNK_SIZE, 6 * 1024 * 1024);
  assert.equal(getTusRetryDelayMs(0), 1_000);
  assert.equal(getTusRetryDelayMs(4), 16_000);
  assert.equal(getTusRetryDelayMs(20), 60_000);
});

test("only transient TUS failures retry indefinitely", () => {
  assert.equal(isRetryableTusError({ causingNetworkError: new Error("offline") }, true), true);
  assert.equal(
    isRetryableTusError({ originalResponse: { getStatus: () => 503 } }, true),
    true,
  );
  assert.equal(
    isRetryableTusError({ originalResponse: { getStatus: () => 401 } }, true),
    false,
  );
  assert.equal(isRetryableTusError(new Error("offline"), false), true);
  assert.equal(isRetryableTusError(new Error("expired session"), true), false);
});

test("resumable upload endpoint uses Supabase's direct storage hostname", () => {
  assert.equal(
    getStorageResumableUploadEndpoint("https://project-ref.supabase.co/rest/v1?x=1"),
    "https://project-ref.storage.supabase.co/storage/v1/upload/resumable",
  );
});

test("resumable upload endpoint rejects non-Supabase or non-HTTPS URLs", () => {
  assert.throws(() => getStorageResumableUploadEndpoint("http://project-ref.supabase.co"));
  assert.throws(() => getStorageResumableUploadEndpoint("https://example.com"));
});