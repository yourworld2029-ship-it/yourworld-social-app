import assert from "node:assert/strict";
import test from "node:test";
import { cloudflareStreamPosterUrl, cloudflareStreamUidFromUrl } from "./cloudflare-stream-media";
import { createVideoHlsConfig } from "./video-hls-config";

test("HLS playback starts on automatic quality with bounded 3/6-second buffers", () => {
  const config = createVideoHlsConfig();
  assert.equal(config.autoStartLoad, true);
  assert.equal(config.startLevel, -1);
  assert.equal(config.maxBufferLength, 3);
  assert.equal(config.maxMaxBufferLength, 6);
});

test("Cloudflare Stream poster uses the first-second thumbnail", () => {
  const manifest = "https://videodelivery.net/Abcd1234Efgh5678/manifest/video.m3u8";
  assert.equal(
    cloudflareStreamPosterUrl(manifest),
    "https://videodelivery.net/Abcd1234Efgh5678/thumbnails/thumbnail.jpg?time=1s",
  );
  assert.equal(cloudflareStreamUidFromUrl(manifest), "Abcd1234Efgh5678");
});

test("Cloudflare Stream poster rejects unrelated or malformed manifests", () => {
  assert.equal(
    cloudflareStreamPosterUrl("https://example.com/Abcd1234Efgh5678/manifest/video.m3u8"),
    null,
  );
  assert.equal(
    cloudflareStreamPosterUrl("https://videodelivery.net/short/manifest/video.m3u8"),
    null,
  );
});