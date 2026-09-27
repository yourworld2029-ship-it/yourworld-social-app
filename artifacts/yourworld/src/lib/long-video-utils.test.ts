import assert from "node:assert/strict";
import test from "node:test";
import {
  episodeOrdinal,
  isLongVideoRow,
  isNextSeriesEpisode,
  isPublishedLongVideoRow,
  sortSeriesEpisodes,
} from "./long-video-utils";

test("published long-video eligibility rejects reels and unpublished rows", () => {
  assert.equal(isPublishedLongVideoRow({ kind: "video", status: "published" }), true);
  assert.equal(isPublishedLongVideoRow({ kind: "video", review_status: "approved" }), true);
  assert.equal(isPublishedLongVideoRow({ kind: "video", status: "draft" }), false);
  assert.equal(isPublishedLongVideoRow({ kind: "video", review_status: "pending_review" }), false);
  assert.equal(isPublishedLongVideoRow({ kind: "video", archived: true }), false);
  assert.equal(isPublishedLongVideoRow({ kind: "reel", media_type: "video" }), false);
  assert.equal(isPublishedLongVideoRow({ kind: "moment", media_type: "video" }), false);
});

test("legacy rows without publication columns remain visible when their kind is video", () => {
  assert.equal(isPublishedLongVideoRow({ kind: "video", media_type: "video" }), true);
  assert.equal(
    isPublishedLongVideoRow(
      { kind: "video", scheduled_at: "2026-09-28T00:00:00.000Z" },
      Date.parse("2026-09-27T00:00:00.000Z"),
    ),
    false,
  );
  assert.equal(
    isLongVideoRow({ kind: null, media_type: "video/mp4", duration_seconds: 120 }),
    true,
  );
  assert.equal(
    isLongVideoRow({ kind: null, media_type: "video/mp4", duration_seconds: 30 }),
    false,
  );
});

test("series episode labels sort naturally and advance after the current part", () => {
  const ordered = sortSeriesEpisodes([
    { id: "episode-10", episode_number: "Episode 10", created_at: "2026-01-01" },
    { id: "episode-2", episode_number: "Episode 2", created_at: "2026-01-02" },
    { id: "part-3", episode_number: "Part 3", created_at: "2026-01-03" },
  ]);
  assert.deepEqual(ordered.map((episode) => episode.id), [
    "episode-2",
    "part-3",
    "episode-10",
  ]);
  assert.equal(episodeOrdinal("Season 1 · Episode 4"), 4);
  assert.equal(isNextSeriesEpisode("Episode 2", "Part 3"), true);
  assert.equal(isNextSeriesEpisode("Episode 2", "Episode 1"), false);
});