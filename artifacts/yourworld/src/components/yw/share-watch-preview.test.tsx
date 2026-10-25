import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShareWatchPreview } from "./ShareWatchPreview";

const previewProps = {
  mediaUrl: "https://media.example/video.mp4",
  title: "Reported Reel",
  creatorName: "Creator",
  apkUrl: "/download-apk",
};

test("report review preview keeps playback but hides social actions and native overflow options", () => {
  const markup = renderToStaticMarkup(
    createElement(ShareWatchPreview, { ...previewProps, reportReview: true }),
  );

  assert.match(markup, /data-testid="video-share-watch"/);
  assert.match(markup, /controlsList="nodownload noremoteplayback noplaybackrate"/);
  assert.match(markup, /disablePictureInPicture=""/);
  assert.match(markup, /disableRemotePlayback=""/);
  assert.match(markup, /report-review-video/);
  assert.doesNotMatch(markup, /button-share-like|button-share-comment|button-share-follow/);
});

test("regular shared watch previews keep their existing interaction buttons", () => {
  const markup = renderToStaticMarkup(createElement(ShareWatchPreview, previewProps));

  assert.match(markup, /button-share-like/);
  assert.match(markup, /button-share-comment/);
  assert.match(markup, /button-share-follow/);
  assert.doesNotMatch(markup, /report-review-video/);
});
