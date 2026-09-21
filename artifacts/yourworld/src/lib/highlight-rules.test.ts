import assert from "node:assert/strict";
import test from "node:test";
import {
  isHighlightVideoType,
  MAX_HIGHLIGHTS,
  MAX_HIGHLIGHTS_MESSAGE,
  videoPreviewUrl,
} from "./highlight-rules";

test("Highlights accept video media types and reject static media", () => {
  assert.equal(isHighlightVideoType("video"), true);
  assert.equal(isHighlightVideoType("video/mp4"), true);
  assert.equal(isHighlightVideoType("image/jpeg"), false);
  assert.equal(isHighlightVideoType("text"), false);
  assert.equal(isHighlightVideoType(null), false);
});

test("video highlight previews seek past the black first frame", () => {
  assert.equal(videoPreviewUrl("https://cdn.example/video.mp4"), "https://cdn.example/video.mp4#t=0.001");
  assert.equal(videoPreviewUrl("https://cdn.example/video.mp4#foo"), "https://cdn.example/video.mp4#t=0.001");
  assert.equal(videoPreviewUrl(undefined), undefined);
  assert.equal(MAX_HIGHLIGHTS, 10);
  assert.equal(
    MAX_HIGHLIGHTS_MESSAGE,
    "Limit Reached: You can create a maximum of 10 highlights. Please delete an existing highlight to add a new one.",
  );
});