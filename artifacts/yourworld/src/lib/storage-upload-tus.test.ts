import assert from "node:assert/strict";
import test from "node:test";
import {
  createTusFileFingerprint,
  getStorageResumableUploadEndpoint,
  CLOUDFLARE_TUS_CHUNK_SIZE,
  CLOUDFLARE_TUS_MAX_CHUNK_SIZE,
  CLOUDFLARE_TUS_MIN_CHUNK_SIZE,
  getCloudflareTusChunkSize,
  getTusChunkSize,
  getTusRetryDelayMs,
  isRetryableTusError,
  RESUMABLE_UPLOAD_CHUNK_SIZE,
  RESUMABLE_UPLOAD_THRESHOLD,
  TUS_RETRY_DELAYS,
  canFallbackAfterCloudflareTusFailure,
  createTusProgressReporter,
  shouldUseMicroTusChunks,
  shouldUseStoragePlaybackFallback,
  shouldUseResumableStorageUpload,
  WEAK_NETWORK_TUS_CHUNK_SIZE,
} from "./storage-upload-tus-utils";

test("large uploads use the documented resumable chunk size threshold", () => {
  assert.equal(shouldUseResumableStorageUpload(RESUMABLE_UPLOAD_THRESHOLD), false);
  assert.equal(shouldUseResumableStorageUpload(RESUMABLE_UPLOAD_THRESHOLD + 1), true);
  assert.equal(shouldUseResumableStorageUpload(Number.POSITIVE_INFINITY), false);
});

test("Supabase Storage and Cloudflare use their valid TUS chunk sizes", () => {
  assert.equal(RESUMABLE_UPLOAD_CHUNK_SIZE, 3 * 1024 * 1024);
  assert.equal(CLOUDFLARE_TUS_CHUNK_SIZE, 5 * 1024 * 1024);
  assert.equal(CLOUDFLARE_TUS_MIN_CHUNK_SIZE, 5 * 1024 * 1024);
  assert.equal(CLOUDFLARE_TUS_MAX_CHUNK_SIZE, 200 * 1024 * 1024);
  assert.deepEqual(TUS_RETRY_DELAYS, [0, 1_000, 3_000, 5_000, 10_000]);
  assert.equal(getTusRetryDelayMs(0), 1_000);
  assert.equal(getTusRetryDelayMs(4), 16_000);
  assert.equal(getTusRetryDelayMs(20), 60_000);
  assert.equal(getTusRetryDelayMs(10_000), 60_000);
});

test("Cloudflare Stream TUS enforces its minimum and 256 KiB chunk multiple", () => {
  const minimumMultiple = 256 * 1024;
  assert.equal(getCloudflareTusChunkSize(WEAK_NETWORK_TUS_CHUNK_SIZE), CLOUDFLARE_TUS_MIN_CHUNK_SIZE);
  assert.equal(getCloudflareTusChunkSize(RESUMABLE_UPLOAD_CHUNK_SIZE), CLOUDFLARE_TUS_MIN_CHUNK_SIZE);
  assert.equal(getCloudflareTusChunkSize(50 * 1024 * 1024), 50 * 1024 * 1024);
  assert.equal(getCloudflareTusChunkSize(500 * 1024 * 1024), CLOUDFLARE_TUS_MAX_CHUNK_SIZE);
  for (const size of [
    getCloudflareTusChunkSize(WEAK_NETWORK_TUS_CHUNK_SIZE),
    getCloudflareTusChunkSize(50 * 1024 * 1024),
    getCloudflareTusChunkSize(500 * 1024 * 1024),
  ]) {
    assert.equal(size % minimumMultiple, 0);
    assert.ok(size >= CLOUDFLARE_TUS_MIN_CHUNK_SIZE);
    assert.ok(size <= CLOUDFLARE_TUS_MAX_CHUNK_SIZE);
  }
});

test("weak 4G and slower links use 1 MiB resumable chunks", () => {
  const weak4g = {
    networkQuality: "normal",
    effectiveType: "4g",
    downlinkMbps: 1.2,
    rttMs: 220,
  };
  assert.equal(shouldUseMicroTusChunks(weak4g), true);
  assert.equal(getTusChunkSize(weak4g), WEAK_NETWORK_TUS_CHUNK_SIZE);
  assert.equal(shouldUseMicroTusChunks({
    networkQuality: "normal",
    effectiveType: "4g",
    downlinkMbps: 8,
    rttMs: 80,
  }), false);
  assert.equal(getTusChunkSize({ networkQuality: "weak" }), WEAK_NETWORK_TUS_CHUNK_SIZE);
  assert.equal(getTusChunkSize({ networkQuality: "normal" }), RESUMABLE_UPLOAD_CHUNK_SIZE);
});

test("weak connections use resumable storage for files above one micro-chunk", () => {
  assert.equal(shouldUseResumableStorageUpload(WEAK_NETWORK_TUS_CHUNK_SIZE, true), false);
  assert.equal(shouldUseResumableStorageUpload(WEAK_NETWORK_TUS_CHUNK_SIZE + 1, true), true);
  assert.equal(
    shouldUseResumableStorageUpload(WEAK_NETWORK_TUS_CHUNK_SIZE + 1),
    false,
  );
});

test("TUS fingerprints include filename, size, and last-modified time", () => {
  const file = Object.assign(new Blob(["video"]), {
    name: "my video.mp4",
    lastModified: 1_700_000_000_000,
  });

  assert.equal(
    createTusFileFingerprint("videos/path-1", file, "fallback.mp4"),
    "videos/path-1:my%20video.mp4:5:1700000000000",
  );
  assert.notEqual(
    createTusFileFingerprint(
      "videos/path-1",
      Object.assign(new Blob(["video"]), {
        name: "my video.mp4",
        lastModified: 1_700_000_000_001,
      }),
      "fallback.mp4",
    ),
    "videos/path-1:my%20video.mp4:5:1700000000000",
  );
});

test("TUS progress reports byte counts and can clear them at a transfer boundary", () => {
  const events: Array<{
    percent: number;
    detail?: string;
    byteProgress?: { bytesUploaded: number; bytesTotal: number } | null;
  }> = [];
  const report = createTusProgressReporter(
    (percent, detail, byteProgress) => events.push({ percent, detail, byteProgress }),
    1000,
  );

  report(0, "Connecting", null);
  report(14, "Uploading", { bytesUploaded: 80_000_000, bytesTotal: 560_000_000 });
  report.flush();

  assert.deepEqual(events, [
    { percent: 0, detail: "Connecting", byteProgress: null },
    {
      percent: 14,
      detail: "Uploading",
      byteProgress: { bytesUploaded: 80_000_000, bytesTotal: 560_000_000 },
    },
  ]);
  report.cancel();
});

test("TUS retries transient failures but stops on app-level dependency or auth denials", () => {
  assert.equal(isRetryableTusError({ causingNetworkError: new Error("offline") }, true), true);
  assert.equal(
    isRetryableTusError({ originalResponse: { getStatus: () => 409 } }, true),
    true,
  );
  assert.equal(
    isRetryableTusError({ originalResponse: { getStatus: () => 423 } }, true),
    true,
  );
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
  assert.equal(
    isRetryableTusError({ originalResponse: { getStatus: () => 413 } }, true),
    false,
  );
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