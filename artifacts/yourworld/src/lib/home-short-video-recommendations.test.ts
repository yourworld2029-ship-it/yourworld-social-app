import assert from "node:assert/strict";
import test from "node:test";
import type { LongVideo } from "./video-data";
import {
  buildHomeVerticalVideoShelfBatches,
  getHomeShortVideoSeriesBadge,
  rankHomeVerticalVideos,
} from "./home-short-video-recommendations";

function video(
  id: string,
  options: Partial<LongVideo> = {},
): LongVideo {
  return {
    id,
    userId: `creator-${id}`,
    title: id,
    caption: "",
    mediaUrl: "",
    thumbnailUrl: null,
    orientation: "portrait",
    durationSeconds: 20,
    views: 0,
    hashtags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    scheduledAt: null,
    author: { name: "Creator", username: "creator", letter: "C" },
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    ...options,
  };
}

test("prioritizes interacted topics and keeps series episodes in ascending order", () => {
  const interactions = [video("liked-cooking", { hashtags: ["cooking"] })];
  const ranked = rankHomeVerticalVideos(
    [
      video("sports-trending", { hashtags: ["sports"], views: 100_000 }),
      video("dinner-part-2", {
        seriesTitle: "Sunday Dinner",
        episodeNumber: "Part 2",
        hashtags: ["cooking"],
      }),
      video("dinner-part-1", {
        seriesTitle: "Sunday Dinner",
        episodeNumber: "Part 1",
        hashtags: ["cooking"],
      }),
    ],
    interactions,
  );

  assert.deepEqual(
    ranked[0].map((entry) => entry.id),
    ["dinner-part-1", "dinner-part-2"],
  );
  assert.equal(getHomeShortVideoSeriesBadge(ranked[0][0]), "Part 1");
});

test("falls back to trending and recent videos when there are no interest tags", () => {
  const ranked = rankHomeVerticalVideos(
    [
      video("recent", { views: 100, createdAt: "2026-02-01T00:00:00.000Z" }),
      video("popular", { views: 500, createdAt: "2026-01-01T00:00:00.000Z" }),
    ],
    [],
  );

  assert.deepEqual(ranked.map((group) => group[0].id), ["popular", "recent"]);
});

test("keeps complete series groups together across carousel batches without duplicates", () => {
  const series = [
    video("part-1", { seriesTitle: "A Series", episodeNumber: "1" }),
    video("part-2", { seriesTitle: "A Series", episodeNumber: "2" }),
  ];
  const groups = [
    series,
    ...Array.from({ length: 8 }, (_, index) => [video(`single-${index}`)]),
  ];

  const batches = buildHomeVerticalVideoShelfBatches(groups, 14, true);
  const ids = batches.flat().map((entry) => entry.id);

  assert.equal(batches.length, 2);
  assert.deepEqual(batches[0].slice(0, 2).map((entry) => entry.id), ["part-1", "part-2"]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 10);
});

test("shows all remaining shorts in the final shelf when no more standard videos remain", () => {
  const groups = Array.from({ length: 10 }, (_, index) => [video(`short-${index}`)]);

  const batches = buildHomeVerticalVideoShelfBatches(groups, 7, false);

  assert.equal(batches.length, 1);
  assert.equal(batches[0].length, 10);
});
