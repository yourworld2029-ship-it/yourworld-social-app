import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attemptVideoPlay,
  isAutoplayPolicyError,
  canAutoplayPublicVideo,
  isHlsMediaUrl,
  isPlayableMediaUrl,
  supportsNativeHls,
} from "./video-playback-engine";

test("identifies HLS manifests with query strings and fragments", () => {
  assert.equal(isHlsMediaUrl("https://media.example/stream.m3u8?token=abc"), true);
  assert.equal(isHlsMediaUrl("https://media.example/STREAM.M3U8#t=2"), true);
  assert.equal(isHlsMediaUrl("https://media.example/video.mp4"), false);
});

test("recognizes browser-playable media URLs", () => {
  assert.equal(isPlayableMediaUrl("https://media.example/video.mp4"), true);
  assert.equal(isPlayableMediaUrl("blob:https://app.example/video-id"), true);
  assert.equal(isPlayableMediaUrl("data:video/mp4;base64,AAAA"), true);
  assert.equal(isPlayableMediaUrl("videos/user/video.mp4"), false);
});

test("only public videos without a price autoplay in feed previews", () => {
  assert.equal(canAutoplayPublicVideo("public"), true);
  assert.equal(canAutoplayPublicVideo("public", 0), true);
  assert.equal(canAutoplayPublicVideo("public", 2), false);
  assert.equal(canAutoplayPublicVideo("paid"), false);
  assert.equal(canAutoplayPublicVideo("vip"), false);
  assert.equal(canAutoplayPublicVideo(undefined), false);
});

test("detects native HLS support", () => {
  assert.equal(supportsNativeHls({ canPlayType: () => "maybe" }), true);
  assert.equal(supportsNativeHls({ canPlayType: () => "" }), false);
});

test("converts synchronous and asynchronous play failures to handled promises", async () => {
  const blocked = Object.assign(new Error("gesture required"), {
    name: "NotAllowedError",
  });
  assert.equal(isAutoplayPolicyError(blocked), true);
  assert.equal(isAutoplayPolicyError(new Error("decode failed")), false);

  await assert.rejects(
    attemptVideoPlay({ play: () => Promise.reject(blocked) }),
    (error: unknown) => error === blocked,
  );
  await assert.rejects(
    attemptVideoPlay({ play: () => { throw blocked; } }),
    (error: unknown) => error === blocked,
  );
});