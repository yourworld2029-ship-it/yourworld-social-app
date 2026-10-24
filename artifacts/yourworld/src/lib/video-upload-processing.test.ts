import assert from "node:assert/strict";
import test from "node:test";
import { shouldRunServerFastStart } from "./video-upload-processing";

test("Cloudflare Long Videos skip the synchronous API fast-start pass", () => {
  assert.equal(
    shouldRunServerFastStart({
      bucket: "videos",
      contentType: "video/mp4",
      cloudflareStream: true,
    }),
    false,
  );
});

test("Reels and Moments retain their existing server fast-start behavior", () => {
  for (const bucket of ["reels", "moments"]) {
    assert.equal(
      shouldRunServerFastStart({
        bucket,
        contentType: "video/mp4",
        cloudflareStream: true,
      }),
      true,
    );
  }
});

test("non-video files and unsupported buckets never request fast-start", () => {
  assert.equal(
    shouldRunServerFastStart({
      bucket: "videos",
      contentType: "image/jpeg",
      cloudflareStream: true,
    }),
    false,
  );
  assert.equal(
    shouldRunServerFastStart({
      bucket: "live-replays",
      contentType: "video/mp4",
      cloudflareStream: true,
    }),
    false,
  );
});
