import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canReadProfileVideoPreview,
  canReadPublicVideoPreview,
} from "./video-preview-access";

test("profile grid allows first-frame previews for public videos", () => {
  const post = { user_id: "creator-id", video_access: "public" };

  assert.equal(canReadPublicVideoPreview(post), true);
  assert.equal(canReadProfileVideoPreview(post, "creator-id", false), true);
});

test("only the profile owner can generate previews for their restricted upload", () => {
  const post = {
    user_id: "creator-id",
    video_access: "private",
    is_paid: true,
    price: 99,
  };

  assert.equal(canReadProfileVideoPreview(post, "creator-id", true), true);
  assert.equal(canReadProfileVideoPreview(post, "creator-id", false), false);
  assert.equal(canReadProfileVideoPreview(post, "someone-else", true), false);
});
