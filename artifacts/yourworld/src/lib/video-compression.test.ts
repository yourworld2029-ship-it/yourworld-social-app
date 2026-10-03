import assert from "node:assert/strict";
import { test } from "node:test";
import { selectSupportedRecorderMimeType } from "./video-compression";

test("prefers compatible MP4 recording and falls back to AV1 or WebM", () => {
  assert.equal(
    selectSupportedRecorderMimeType((mimeType) => mimeType.includes("avc1.4D401F")),
    'video/mp4;codecs="avc1.4D401F"',
  );
  assert.equal(
    selectSupportedRecorderMimeType((mimeType) => mimeType.includes("av01")),
    'video/mp4;codecs="av01.0.08M.08"',
  );
  assert.equal(
    selectSupportedRecorderMimeType((mimeType) => mimeType.includes("vp9")),
    'video/webm;codecs="vp9,opus"',
  );
  assert.equal(selectSupportedRecorderMimeType(() => false), null);
});