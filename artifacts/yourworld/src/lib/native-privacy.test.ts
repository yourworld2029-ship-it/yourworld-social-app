import assert from "node:assert/strict";
import test from "node:test";
import {
  isChatProtectionDecisionReady,
  shouldHideAndroidChatUntilSecure,
} from "./native-privacy";

test("does not resolve protection until the real conversation ID and settings are loaded", () => {
  assert.equal(isChatProtectionDecisionReady("user-a", "user-b", null, true), false);
  assert.equal(isChatProtectionDecisionReady("user-a", "user-b", "conversation-1", false), false);
  assert.equal(isChatProtectionDecisionReady("user-a", "user-b", "conversation-1", true), true);
});

test("Android protected chat stays black until its setting and FLAG_SECURE are ready", () => {
  assert.equal(shouldHideAndroidChatUntilSecure(true, false, false, false), true);
  assert.equal(shouldHideAndroidChatUntilSecure(true, true, true, false), true);
  assert.equal(shouldHideAndroidChatUntilSecure(true, true, true, true), false);
});

test("Android unprotected chats and non-Android chats do not wait for FLAG_SECURE", () => {
  assert.equal(shouldHideAndroidChatUntilSecure(true, true, false, false), false);
  assert.equal(shouldHideAndroidChatUntilSecure(false, false, true, false), false);
});
