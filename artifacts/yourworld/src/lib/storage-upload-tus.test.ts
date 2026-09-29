import assert from "node:assert/strict";
import test from "node:test";
import {
  getStorageResumableUploadEndpoint,
  RESUMABLE_UPLOAD_CHUNK_SIZE,
  shouldUseResumableStorageUpload,
} from "./storage-upload-tus-utils";

test("large uploads use the documented resumable chunk size threshold", () => {
  assert.equal(shouldUseResumableStorageUpload(RESUMABLE_UPLOAD_CHUNK_SIZE), false);
  assert.equal(shouldUseResumableStorageUpload(RESUMABLE_UPLOAD_CHUNK_SIZE + 1), true);
  assert.equal(shouldUseResumableStorageUpload(Number.POSITIVE_INFINITY), false);
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