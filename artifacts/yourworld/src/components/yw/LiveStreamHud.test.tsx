import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getLiveBeautyFilter,
  LIVE_BEAUTY_EFFECTS,
} from "../../lib/live-video-effects";
import {
  LiveStreamHud,
  supportsLiveCameraTorch,
  type LiveStreamHudProps,
} from "./LiveStreamHud";

function makeProps(mode: LiveStreamHudProps["mode"]): LiveStreamHudProps {
  return {
    mode,
    stream: null,
    cameraTrack: null,
    beautySettings: { effect: "off", intensity: 60 },
    title: "Evening live",
    broadcasterName: "YourWorld",
    broadcasterAvatarUrl: null,
    durationSeconds: 15,
    viewerCount: 12,
    isFrontCamera: true,
    cameraBusy: false,
    comments: [],
    commentText: "",
    sendingComment: false,
    reactions: [],
    onCommentTextChange: () => {},
    onSendComment: () => {},
    onFlipCamera: () => {},
    onEnd: () => {},
    onReact: () => {},
    onBeautySettingsChange: async () => true,
  };
}

test("Live beauty offers six outgoing effects with an intensity filter and Off", () => {
  assert.deepEqual(
    LIVE_BEAUTY_EFFECTS.map(({ label }) => label),
    ["Natural", "Smooth", "Bright", "Glow", "Soft Beauty", "Warm Tone"],
  );
  assert.equal(getLiveBeautyFilter("off", 60), "none");
  assert.equal(getLiveBeautyFilter("smooth", 0), "none");
  assert.notEqual(getLiveBeautyFilter("smooth", 50), getLiveBeautyFilter("bright", 50));
  assert.notEqual(getLiveBeautyFilter("glow", 75), getLiveBeautyFilter("warm-tone", 75));
  for (const effect of LIVE_BEAUTY_EFFECTS) {
    assert.notEqual(getLiveBeautyFilter(effect.value, 60), "none");
  }
});

test("Broadcaster live HUD renders camera, mute, flash, beauty, comment, send, and heart controls", () => {
  const markup = renderToStaticMarkup(
    createElement(LiveStreamHud, makeProps("broadcaster")),
  );

  for (const testId of [
    "button-live-flip-camera",
    "button-live-end",
    "button-live-beauty",
    "button-live-microphone",
    "button-live-flash",
    "button-live-share",
    "button-live-copy-link",
    "input-live-comment",
    "button-live-send-comment",
    "button-live-react",
  ]) {
    assert.match(markup, new RegExp(`data-testid="${testId}"`));
  }
  assert.doesNotMatch(markup, /button-live-more/);
  assert.match(markup, /max\(env\(safe-area-inset-top,0px\),2\.25rem\)/);
});

test("Live torch detection accepts Android ImageCapture capability reports", async () => {
  type ImageCaptureStub = new (track: MediaStreamTrack) => {
    getPhotoCapabilities: () => Promise<{ torch?: boolean }>;
  };
  const runtime = globalThis as unknown as Record<string, unknown>;
  const originalImageCapture = runtime.ImageCapture;
  Object.defineProperty(globalThis, "ImageCapture", {
    configurable: true,
    writable: true,
    value: class {
    constructor(_track: MediaStreamTrack) {}
    getPhotoCapabilities = async () => ({ torch: true });
    } satisfies ImageCaptureStub,
  });
  try {
    const track = {
      getCapabilities: () => ({ torch: false }),
    } as unknown as MediaStreamTrack;
    assert.equal(await supportsLiveCameraTorch(track), true);
  } finally {
    if (originalImageCapture) {
      Object.defineProperty(globalThis, "ImageCapture", {
        configurable: true,
        writable: true,
        value: originalImageCapture,
      });
    } else {
      delete runtime.ImageCapture;
    }
  }
});

test("Front camera keeps flash available as a screen-flash fallback", () => {
  const props = {
    ...makeProps("broadcaster"),
    cameraTrack: { getCapabilities: () => ({}) } as unknown as MediaStreamTrack,
    isFrontCamera: true,
  };
  const markup = renderToStaticMarkup(createElement(LiveStreamHud, props));
  assert.match(markup, /aria-label="Turn screen flash on"/);
  assert.match(markup, /title="Front camera screen flash"/);
  const flashButton = markup.match(/<button[^>]*aria-label="Turn screen flash on"[^>]*>/)?.[0];
  assert.ok(flashButton);
  assert.doesNotMatch(flashButton, /\sdisabled(?:=|\s|>)/);
});

test("Viewers get share options without broadcaster-only beauty or camera controls", () => {
  const markup = renderToStaticMarkup(
    createElement(LiveStreamHud, makeProps("viewer")),
  );

  assert.match(markup, /data-testid="button-live-share"/);
  assert.match(markup, /data-testid="button-live-copy-link"/);
  assert.doesNotMatch(markup, /button-live-more/);
  assert.doesNotMatch(markup, /button-live-microphone/);
  assert.doesNotMatch(markup, /button-live-flash/);
  assert.doesNotMatch(markup, /data-testid="button-live-beauty"/);
  assert.doesNotMatch(markup, /data-testid="button-live-flip-camera"/);
  assert.doesNotMatch(markup, /data-testid="button-live-end"/);
});
