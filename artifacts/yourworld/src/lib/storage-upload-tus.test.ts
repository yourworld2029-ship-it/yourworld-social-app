import assert from "node:assert/strict";
import test from "node:test";
import {
  getStorageResumableUploadEndpoint,
  CLOUDFLARE_TUS_CHUNK_SIZE,
  getTusRetryDelayMs,
  isRetryableTusError,
  RESUMABLE_UPLOAD_CHUNK_SIZE,
  canFallbackAfterCloudflareTusFailure,
  shouldUseStoragePlaybackFallback,
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

test("TUS retries transient failures but stops on app-level dependency or auth denials", () => {
  assert.equal(isRetryableTusError({ causingNetworkError: new Error("offline") }, true), true);
  assert.equal(
    isRetryableTusError({ originalResponse: { getStatus: () => 503 } }, true),
    true,
  );
  assert.equal(
    isRetryableTusError({ originalResponse: { getStatus: () => 401 } }, true),
    false,
  );
  assert.equal(
    isRetryableTusError({ originalResponse: { getStatus: () => 424 } }, true),
    false,
  );
  assert.equal(isRetryableTusError(new Error("offline"), false), true);
  assert.equal(isRetryableTusError(new Error("expired session"), true), false);
});

test("Cloudflare 424 is eligible for the public Storage fallback, but app auth denials are not", () => {
  assert.equal(
    canFallbackAfterCloudflareTusFailure({ originalResponse: { getStatus: () => 424 } }),
    true,
  );
  assert.equal(
    canFallbackAfterCloudflareTusFailure({ originalResponse: { getStatus: () => 401 } }),
    false,
  );
  assert.equal(
    canFallbackAfterCloudflareTusFailure({ originalResponse: { getStatus: () => 403 } }),
    false,
  );
});

test("Storage playback fallback is explicit, public-only, and available for videos and reels", () => {
  assert.equal(
    shouldUseStoragePlaybackFallback({
      bucket: "reels",
      fallbackToStorage: true,
      requireSignedURLs: false,
    }),
    true,
  );
  assert.equal(
    shouldUseStoragePlaybackFallback({
      bucket: "reels",
      fallbackToStorage: true,
      requireSignedURLs: true,
    }),
    false,
  );
  assert.equal(
    shouldUseStoragePlaybackFallback({
      bucket: "videos",
      fallbackToStorage: false,
      requireSignedURLs: false,
    }),
    false,
  );
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