import assert from "node:assert/strict";
import test from "node:test";
import { resolveTabSwipeDestination } from "./tab-swipe";

test("a left swipe from Home opens Chat", () => {
  assert.equal(resolveTabSwipeDestination("/", -120, 8), "/chat");
});

test("a right swipe from Chat returns Home, including the trailing-slash route", () => {
  assert.equal(resolveTabSwipeDestination("/chat", 120, 8), "/");
  assert.equal(resolveTabSwipeDestination("/chat/", 120, 8), "/");
});

test("swipes in the opposite direction do not change tabs", () => {
  assert.equal(resolveTabSwipeDestination("/", 120, 0), null);
  assert.equal(resolveTabSwipeDestination("/chat", -120, 0), null);
});

test("short, vertical, and diagonal drags do not change tabs", () => {
  assert.equal(resolveTabSwipeDestination("/", -40, 0), null);
  assert.equal(resolveTabSwipeDestination("/", -120, 90), null);
  assert.equal(resolveTabSwipeDestination("/chat", 120, -100), null);
});

test("other routes do not participate in tab swiping", () => {
  assert.equal(resolveTabSwipeDestination("/reels", -120, 0), null);
  assert.equal(resolveTabSwipeDestination("/chat/thread-123", 120, 0), null);
});
