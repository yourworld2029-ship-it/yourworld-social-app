import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDownloadQualityTiers,
  estimateDownloadSizeMb,
  estimateDownloadSizeMbFromSourceFile,
  formatDownloadSizeMb,
  qualityTierFromDimensions,
  qualityTierFromMetadata,
  qualityTierFromSourceMetadata,
  sourceQualityTierFromDimensions,
} from "./video-quality";

test("stores 1440p and 2160p source dimensions using 2K and 4K aliases", () => {
  assert.equal(sourceQualityTierFromDimensions(2560, 1440), "2k");
  assert.equal(sourceQualityTierFromDimensions(3840, 2160), "4k");
  assert.equal(sourceQualityTierFromDimensions(7680, 4320), "4320p");
  assert.equal(sourceQualityTierFromDimensions(1920, 1080), "1080p");
});

test("normalizes stored 2K and 4K aliases for existing download tiers", () => {
  assert.equal(qualityTierFromSourceMetadata("2k"), "1440p");
  assert.equal(qualityTierFromSourceMetadata("4k"), "2160p");
  assert.equal(qualityTierFromSourceMetadata("1440p"), "1440p");
  assert.equal(qualityTierFromSourceMetadata("2160p"), "2160p");
  assert.equal(qualityTierFromMetadata("2k", null, null), "1440p");
  assert.equal(qualityTierFromMetadata("4k", null, null), "2160p");
});

test("dimension quality tiers keep their existing values", () => {
  assert.equal(qualityTierFromDimensions(2560, 1440), "1440p");
  assert.equal(qualityTierFromDimensions(3840, 2160), "2160p");
});

test("requested download qualities are offered only when an actual quality media URL exists", () => {
  assert.deepEqual(availableDownloadQualityTiers().map((tier) => tier.id), []);
  assert.deepEqual(
    availableDownloadQualityTiers({
      "360p": "https://media.example/360.mp4",
      "480p": "  ",
      "720p": "https://media.example/720.mp4",
      "1080p": "https://media.example/1080.mp4",
      "1440p": "https://media.example/2k.mp4",
    }).map((tier) => tier.id),
    ["360p", "720p", "1080p", "1440p"],
  );
  assert.deepEqual(
    availableDownloadQualityTiers({
      "360p": "https://media.example/360.mp4",
      "480p": "https://media.example/480.mp4",
      "720p": "https://media.example/720.mp4",
      "1080p": "https://media.example/1080.mp4",
      "1440p": "https://media.example/2k.mp4",
    }).map((tier) => tier.id),
    ["360p", "480p", "720p", "1080p", "1440p"],
  );
});

test("quality sizes are duration-based estimates while original source sizes are exact", () => {
  assert.equal(estimateDownloadSizeMb(60, "360p"), 6);
  assert.equal(formatDownloadSizeMb(20), "≈ 20 MB");
  assert.equal(formatDownloadSizeMb(6.41, true), "6.4 MB");
});

test("estimates quality sizes from the source file when duration is missing", () => {
  assert.equal(
    estimateDownloadSizeMbFromSourceFile(6_410_000, "1080p", "720p"),
    4,
  );
  assert.equal(
    estimateDownloadSizeMbFromSourceFile(6_410_000, "1080p", "original"),
    6.41,
  );
  assert.equal(
    estimateDownloadSizeMbFromSourceFile(6_410_000, null, "720p"),
    null,
  );
});