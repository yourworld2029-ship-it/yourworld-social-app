import assert from "node:assert/strict";
import test from "node:test";
import { cloudflareStreamPosterUrl, cloudflareStreamUidFromUrl } from "./cloudflare-stream-media";
import {
  createVideoHlsConfig,
  hlsLevelResolution,
  selectHlsLevelAtOrBelow,
  selectHlsLevelIndex,
} from "./video-hls-config";

test("HLS playback starts on automatic quality with bounded 3/6-second buffers", () => {
  const config = createVideoHlsConfig();
  assert.equal(config.autoStartLoad, true);
  assert.equal(config.startLevel, -1);
  assert.equal(config.maxBufferLength, 3);
  assert.equal(config.maxMaxBufferLength, 6);
});

test("HLS resume starts directly at the saved position", () => {
  assert.equal(createVideoHlsConfig(87).startPosition, 87);
  assert.equal(createVideoHlsConfig().startPosition, -1);
});

test("HLS quality resolution uses the short side for landscape and portrait levels", () => {
  assert.equal(hlsLevelResolution({ width: 1920, height: 1080 }), 1080);
  assert.equal(hlsLevelResolution({ width: 1080, height: 1920 }), 1080);
  assert.equal(hlsLevelResolution({ width: 720, height: 1280 }), 720);
});

test("manual quality selection chooses the highest matching portrait or landscape level", () => {
  const levels = [
    { width: 640, height: 360, bitrate: 500_000 },
    { width: 1280, height: 720, bitrate: 1_400_000 },
    { width: 720, height: 1280, bitrate: 1_200_000 },
    { width: 1920, height: 1080, bitrate: 3_000_000 },
    { width: 1080, height: 1920, bitrate: 2_800_000 },
  ];

  assert.equal(selectHlsLevelAtOrBelow(levels, 360), 0);
  assert.equal(selectHlsLevelAtOrBelow(levels, 720), 1);
  assert.equal(selectHlsLevelAtOrBelow(levels, 1080), 3);
  assert.equal(selectHlsLevelAtOrBelow(levels, 300), -1);
});

test("automatic HLS caps use portrait short-side resolution", () => {
  const portraitLevels = [
    { width: 360, height: 640, bitrate: 400_000 },
    { width: 720, height: 1280, bitrate: 1_200_000 },
    { width: 1080, height: 1920, bitrate: 2_800_000 },
  ];

  assert.equal(selectHlsLevelIndex(portraitLevels, 720), 1);
  assert.equal(selectHlsLevelIndex(portraitLevels, 300), 0);
});

test("Cloudflare Stream poster uses the first-second thumbnail", () => {
  const manifest = "https://videodelivery.net/Abcd1234Efgh5678/manifest/video.m3u8";
  assert.equal(
    cloudflareStreamPosterUrl(manifest),
    "https://videodelivery.net/Abcd1234Efgh5678/thumbnails/thumbnail.jpg?time=1s&height=720",
  );
  assert.equal(cloudflareStreamUidFromUrl(manifest), "Abcd1234Efgh5678");
});

test("Cloudflare Stream resume poster uses the saved playback time", () => {
  const manifest = "https://videodelivery.net/Abcd1234Efgh5678/manifest/video.m3u8";
  assert.equal(
    cloudflareStreamPosterUrl(manifest, undefined, 87.9),
    "https://videodelivery.net/Abcd1234Efgh5678/thumbnails/thumbnail.jpg?time=87s&height=720",
  );
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