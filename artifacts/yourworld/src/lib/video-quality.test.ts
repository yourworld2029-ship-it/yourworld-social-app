import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDownloadQualityTiers,
  capQualityTierToSource,
  downloadFileSizeBytesFromHeaders,
  estimateDownloadSizeMb,
  estimateDownloadSizeMbFromSourceFile,
  formatDownloadSizeMb,
  hasExactVideoDownload,
  qualityTierFromDimensions,
  qualityTierFromMetadata,
  qualityTierFromSourceMetadata,
  resolveVideoDownloadSelection,
  requireDownloadVariantUrl,
  sourceQualityTierFromDimensions,
  VIDEO_DOWNLOAD_PICKER_TIERS,
} from "./video-quality";

test("video download picker tiers are Full HD, High, Medium, and Low in order", () => {
  assert.deepEqual(VIDEO_DOWNLOAD_PICKER_TIERS, ["1080p", "720p", "480p", "360p"]);
});

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

test("download quality is capped at the source tier when the source is smaller", () => {
  assert.equal(capQualityTierToSource("1080p", "720p"), "720p");
  assert.equal(capQualityTierToSource("480p", "720p"), "480p");
  assert.equal(capQualityTierToSource("480p", null), "480p");
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

test("quality downloads require their own media URL instead of falling back to Original", () => {
  assert.equal(
    requireDownloadVariantUrl("720p", {
      "720p": " https://media.example/720.mp4 ",
    }),
    "https://media.example/720.mp4",
  );
  assert.throws(
    () =>
      requireDownloadVariantUrl("720p", {
        "720p": " ",
        "1080p": "https://media.example/1080.mp4",
      }),
    /720p/,
  );
});

test("quality choices fall back to the direct source without claiming a different tier", () => {
  const sourceUrl = "https://media.example/source.mp4";
  assert.deepEqual(
    resolveVideoDownloadSelection("720p", sourceUrl, null, "720p"),
    {
      url: sourceUrl,
      actualQuality: "720p",
      usesVariant: false,
      isSourceFallback: false,
    },
  );
  for (const tier of VIDEO_DOWNLOAD_PICKER_TIERS.filter((tier) => tier !== "720p")) {
    assert.deepEqual(resolveVideoDownloadSelection(tier, sourceUrl, null, "720p"), {
      url: sourceUrl,
      actualQuality: "720p",
      usesVariant: false,
      isSourceFallback: true,
    });
  }

  assert.deepEqual(
    resolveVideoDownloadSelection(
      "1080p",
      sourceUrl,
      { "1080p": " https://media.example/1080.mp4 " },
      "720p",
    ),
    {
      url: sourceUrl,
      actualQuality: "720p",
      usesVariant: false,
      isSourceFallback: true,
    },
  );
  assert.deepEqual(
    resolveVideoDownloadSelection(
      "720p",
      sourceUrl,
      { "720p": "https://media.example/720.mp4" },
      "1080p",
    ),
    {
      url: "https://media.example/720.mp4",
      actualQuality: "720p",
      usesVariant: true,
      isSourceFallback: false,
    },
  );
  assert.deepEqual(
    resolveVideoDownloadSelection("original", sourceUrl, null, "720p"),
    {
      url: sourceUrl,
      actualQuality: "original",
      usesVariant: false,
      isSourceFallback: false,
    },
  );
  assert.equal(resolveVideoDownloadSelection("720p", null, null), null);
  assert.deepEqual(resolveVideoDownloadSelection("480p", sourceUrl, null, null), {
    url: sourceUrl,
    actualQuality: "original",
    usesVariant: false,
    isSourceFallback: true,
  });
  assert.equal(
    resolveVideoDownloadSelection(
      "480p",
      sourceUrl,
      { "480p": "https://media.example/480.mp4" },
      null,
    )?.usesVariant,
    true,
  );
  assert.equal(hasExactVideoDownload("480p", sourceUrl, null, "1080p"), true);
  assert.equal(hasExactVideoDownload("480p", null, null, "1080p"), false);
  assert.equal(
    hasExactVideoDownload("480p", sourceUrl, { "480p": "https://media.example/480.mp4" }, "1080p"),
    true,
  );
  assert.equal(
    resolveVideoDownloadSelection("1080p", sourceUrl, null, "2160p", "cloudflare-stream-id")
      ?.actualQuality,
    "2160p",
  );
  assert.equal(
    resolveVideoDownloadSelection("1080p", sourceUrl, null, "2160p")?.isSourceFallback,
    true,
  );
});

test("range size probes require the total Content-Range size for partial responses", () => {
  assert.equal(downloadFileSizeBytesFromHeaders(206, "bytes 0-0/1000", "1"), 1000);
  assert.equal(downloadFileSizeBytesFromHeaders(206, null, "1"), null);
  assert.equal(downloadFileSizeBytesFromHeaders(200, null, "1000"), 1000);
});

test("quality sizes are duration-based estimates while original source sizes are exact", () => {
  assert.equal(estimateDownloadSizeMb(60, "360p"), 6);
  assert.equal(formatDownloadSizeMb(20), "≈ 20 MB");
  assert.equal(formatDownloadSizeMb(6.41, true), "6.41 MB");
  assert.equal(formatDownloadSizeMb(1_200, true), "1,200 MB");
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