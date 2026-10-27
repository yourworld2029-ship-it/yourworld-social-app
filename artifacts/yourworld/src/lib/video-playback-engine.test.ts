import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attemptVideoPlay,
  isAutoplayPolicyError,
  canAutoplayPublicVideo,
  detectNativeVideoSupport,
  firstPlayablePlaybackFallback,
  isHlsMediaUrl,
  isPlayableMediaUrl,
  isValidMp4RangeResponse,
  reelPlaybackSource,
  safeMediaUrlForLog,
  supportsNativeHls,
} from "./video-playback-engine";
import { verifyRangedMp4PlaybackUrl } from "./video-range-probe";

test("identifies HLS manifests with query strings and fragments", () => {
  assert.equal(isHlsMediaUrl("https://media.example/stream.m3u8?token=abc"), true);
  assert.equal(isHlsMediaUrl("https://media.example/STREAM.M3U8#t=2"), true);
  assert.equal(
    isHlsMediaUrl(
      "https://media.example/manifest/abc?token=private",
      "application/vnd.apple.mpegurl; charset=utf-8",
    ),
    true,
  );
  assert.equal(isHlsMediaUrl("https://media.example/video.mp4"), false);
});

test("shared Moment Reels prefer playable media over the retained source path", () => {
  const playbackUrl = "https://media.example/reel/manifest/video.m3u8";
  const retainedSource = "reels/user-id/original.mp4";
  assert.equal(reelPlaybackSource(playbackUrl, retainedSource), playbackUrl);
  assert.equal(reelPlaybackSource("", retainedSource), "user-id/original.mp4");
  assert.equal(reelPlaybackSource(null, "https://media.example/reel.mp4"), "https://media.example/reel.mp4");
  assert.equal(reelPlaybackSource(null, null), null);
});

test("accepts only MP4 partial-content responses for storage playback fallbacks", () => {
  assert.equal(isValidMp4RangeResponse(206, "video/mp4", "bytes 0-1/5000"), true);
  assert.equal(isValidMp4RangeResponse(206, "video/mp4; charset=binary", null), true);
  assert.equal(isValidMp4RangeResponse(200, "video/mp4", "bytes 0-1/5000"), false);
  assert.equal(isValidMp4RangeResponse(206, "application/json", "bytes 0-1/5000"), false);
  assert.equal(isValidMp4RangeResponse(206, "video/mp4", "bytes 1-2/5000"), false);
});

test("strips signed query strings from playback diagnostic URLs", () => {
  assert.equal(
    safeMediaUrlForLog("https://media.example/videos/abc.mp4?token=secret#frame=2"),
    "https://media.example/videos/abc.mp4",
  );
  assert.equal(safeMediaUrlForLog("data:video/mp4;base64,private-bytes"), "data:");
});

test("probes only a tiny byte range and accepts a correctly typed partial response", async () => {
  const request: typeof fetch = async (_input, init) => {
    assert.equal(new Headers(init?.headers).get("range"), "bytes=0-1");
    return new Response(new Uint8Array([0, 1]), {
      status: 206,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": "bytes 0-1/2000",
      },
    });
  };
  const url = "https://storage.example/signed/video.mp4?token=hidden";
  assert.equal(await verifyRangedMp4PlaybackUrl(url, request), url);
});

test("rejects storage playback responses without partial-content MP4 headers", async () => {
  const request: typeof fetch = async () =>
    new Response("not a video", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  await assert.rejects(
    verifyRangedMp4PlaybackUrl("https://storage.example/video.mp4", request),
    /video\/mp4 and byte-range support/,
  );
});

test("recognizes browser-playable media URLs", () => {
  assert.equal(isPlayableMediaUrl("https://media.example/video.mp4"), true);
  assert.equal(isPlayableMediaUrl("blob:https://app.example/video-id"), true);
  assert.equal(isPlayableMediaUrl("data:video/mp4;base64,AAAA"), true);
  assert.equal(isPlayableMediaUrl("videos/user/video.mp4"), false);
});

test("selects the direct signed Supabase MP4 fallback without altering its range URL", () => {
  const primary = "https://stream.example/manifest/video.m3u8?token=stream";
  const directMp4 =
    "https://project.supabase.co/storage/v1/object/sign/videos/user/video.mp4?token=storage";
  assert.equal(
    firstPlayablePlaybackFallback(primary, [primary, directMp4]),
    directMp4,
  );
  assert.equal(firstPlayablePlaybackFallback(directMp4, [directMp4]), null);
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

test("detects native H.264, AV1, WebM, and HLS playback support", () => {
  const h264 = detectNativeVideoSupport(
    { canPlayType: (type) => type.includes("avc1") ? "probably" : "" },
    "https://media.example/video.mp4",
  );
  const av1 = detectNativeVideoSupport(
    { canPlayType: (type) => type.includes("av01") ? "probably" : "" },
    "https://media.example/video.mp4?token=abc",
  );
  const webm = detectNativeVideoSupport(
    { canPlayType: (type) => type.includes("vp9") ? "maybe" : "" },
    "https://media.example/video.webm",
  );
  const hls = detectNativeVideoSupport(
    { canPlayType: (type) => type.includes("mpegurl") ? "maybe" : "" },
    "https://media.example/stream.m3u8",
  );
  const unknown = detectNativeVideoSupport(
    { canPlayType: () => "" },
    "https://media.example/stream",
  );

  assert.equal(h264, "probably");
  assert.equal(av1, "probably");
  assert.equal(webm, "maybe");
  assert.equal(hls, "maybe");
  assert.equal(unknown, "unknown");
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