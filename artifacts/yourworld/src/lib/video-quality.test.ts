import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDownloadQualityTiers,
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

test("2K downloads are offered for a 2K source or an explicit 2K stream", () => {
  assert.ok(availableDownloadQualityTiers("1440p").some((tier) => tier.id === "1440p"));
  assert.ok(!availableDownloadQualityTiers("2160p").some((tier) => tier.id === "1440p"));
  assert.ok(
    availableDownloadQualityTiers("1080p", { "1440p": "https://media.example/2k.mp4" })
      .some((tier) => tier.id === "1440p"),
  );
});