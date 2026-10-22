import assert from "node:assert/strict";
import { test } from "node:test";
import { retryLongVideoUploadWithCompression } from "./long-video-storage-retry";
import { isStorageSizeLimitError } from "./storage-upload-request";

type MockUploadResult = { error: string | null };

const makeCompressedResult = (blob: Blob, compressed = true) => ({
  blob,
  width: 1280,
  height: 720,
  tier: "aggressive" as const,
  compressed,
});

test("classifies storage size-limit responses without treating network errors as size failures", () => {
  assert.equal(isStorageSizeLimitError("Storage upload failed (413 Payload Too Large)."), true);
  assert.equal(isStorageSizeLimitError("The object exceeded the maximum allowed size."), true);
  assert.equal(isStorageSizeLimitError("Network request failed."), false);
});

test("retries a storage size rejection with a smaller compressed Long Video blob", async () => {
  const source = new Blob(["uncompressed video"], { type: "video/mp4" });
  const compressed = new Blob(["compressed"], { type: "video/mp4" });
  const progress: Array<{ percent: number; detail?: string; bytes?: unknown }> = [];
  let compressedSource: Blob | null = null;
  let retrySource: Blob | null = null;
  const initialResult: MockUploadResult = {
    error: "Storage upload failed (413 Payload Too Large).",
  };

  const retry = await retryLongVideoUploadWithCompression({
    source,
    initialResult,
    maxBytes: 500,
    compress: async (file) => {
      compressedSource = file;
      return makeCompressedResult(compressed);
    },
    upload: async (file) => {
      retrySource = file;
      return { error: null };
    },
    onProgress: (percent, detail, byteProgress) => {
      progress.push({ percent, detail, bytes: byteProgress });
    },
  });

  assert.equal(compressedSource, source);
  assert.equal(retrySource, compressed);
  assert.equal(retry.result.error, null);
  assert.equal(retry.compressionResult?.blob, compressed);
  assert.equal(progress[0]?.detail, "Optimizing video for storage retry");
  assert.equal(progress[0]?.bytes, null);
  assert.equal(progress[1]?.detail, "Retrying upload with compressed video");
});

test("does not compress or retry errors unrelated to the storage size limit", async () => {
  let compressionCalls = 0;
  let uploadCalls = 0;
  const initialResult: MockUploadResult = { error: "Your sign-in expired." };

  const retry = await retryLongVideoUploadWithCompression({
    source: new Blob(["video"], { type: "video/mp4" }),
    initialResult,
    maxBytes: 500,
    compress: async (file) => {
      compressionCalls += 1;
      return makeCompressedResult(file);
    },
    upload: async () => {
      uploadCalls += 1;
      return { error: null };
    },
  });

  assert.equal(retry.result, initialResult);
  assert.equal(compressionCalls, 0);
  assert.equal(uploadCalls, 0);
});

test("never retries with an unchanged or still-oversized Long Video file", async () => {
  const source = new Blob(["uncompressed video"], { type: "video/mp4" });
  let uploadCalls = 0;
  const initialResult: MockUploadResult = {
    error: "The object exceeded the maximum allowed size.",
  };
  const retry = await retryLongVideoUploadWithCompression({
    source,
    initialResult,
    maxBytes: source.size,
    compress: async (file) => makeCompressedResult(file),
    upload: async () => {
      uploadCalls += 1;
      return { error: null };
    },
  });

  assert.equal(uploadCalls, 0);
  assert.match(retry.result.error ?? "", /2 GB storage limit/i);
});
