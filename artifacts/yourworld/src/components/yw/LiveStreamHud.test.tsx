import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getLiveBeautyEffectFilter,
  LIVE_BEAUTY_EFFECTS,
  LiveStreamHud,
  type LiveStreamHudProps,
} from "./LiveStreamHud";

function makeProps(mode: LiveStreamHudProps["mode"]): LiveStreamHudProps {
  return {
    mode,
    stream: null,
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
  };
}

test("Live beauty offers four distinct preview effects", () => {
  assert.deepEqual(
    LIVE_BEAUTY_EFFECTS.map(({ label }) => label),
    ["Natural", "Smooth", "Bright", "Clear"],
  );
  assert.equal(getLiveBeautyEffectFilter("natural"), "none");
  assert.notEqual(
    getLiveBeautyEffectFilter("smooth"),
    getLiveBeautyEffectFilter("bright"),
  );
  assert.notEqual(
    getLiveBeautyEffectFilter("bright"),
    getLiveBeautyEffectFilter("clear"),
  );
});

test("Broadcaster live HUD renders aligned camera, side, comment, send, and heart controls", () => {
  const markup = renderToStaticMarkup(
    createElement(LiveStreamHud, makeProps("broadcaster")),
  );

  for (const testId of [
    "button-live-flip-camera",
    "button-live-end",
    "button-live-beauty",
    "button-live-share",
    "button-live-copy-link",
    "button-live-more",
    "input-live-comment",
    "button-live-send-comment",
    "button-live-react",
  ]) {
    assert.match(markup, new RegExp(`data-testid="${testId}"`));
  }
});

test("Viewers get share options without broadcaster-only beauty or camera controls", () => {
  const markup = renderToStaticMarkup(
    createElement(LiveStreamHud, makeProps("viewer")),
  );

  assert.match(markup, /data-testid="button-live-share"/);
  assert.match(markup, /data-testid="button-live-copy-link"/);
  assert.match(markup, /data-testid="button-live-more"/);
  assert.doesNotMatch(markup, /data-testid="button-live-beauty"/);
  assert.doesNotMatch(markup, /data-testid="button-live-flip-camera"/);
  assert.doesNotMatch(markup, /data-testid="button-live-end"/);
});
