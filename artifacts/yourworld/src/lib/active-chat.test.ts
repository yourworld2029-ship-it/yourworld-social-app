import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isActiveChatFocusedForCall,
  registerActiveChatView,
} from "./active-chat";

const ownerId = "10000000-0000-4000-8000-000000000001";
const peerId = "20000000-0000-4000-8000-000000000002";
const otherPeerId = "30000000-0000-4000-8000-000000000003";

function withDocumentFocus(
  visibilityState: DocumentVisibilityState,
  hasFocus: boolean,
  run: () => void,
) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { visibilityState, hasFocus: () => hasFocus },
  });
  try {
    run();
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  }
}

test("only the focused active conversation can accept a locked-chat call", () => {
  const threadId = `dm_${[ownerId, peerId].sort().join("_")}`;
  const unregister = registerActiveChatView(ownerId, threadId);
  try {
    withDocumentFocus("visible", true, () => {
      assert.equal(isActiveChatFocusedForCall(ownerId, peerId), true);
      assert.equal(isActiveChatFocusedForCall(ownerId, otherPeerId), false);
      assert.equal(isActiveChatFocusedForCall(otherPeerId, peerId), false);
    });
    withDocumentFocus("hidden", true, () => {
      assert.equal(isActiveChatFocusedForCall(ownerId, peerId), false);
    });
    withDocumentFocus("visible", false, () => {
      assert.equal(isActiveChatFocusedForCall(ownerId, peerId), false);
    });
  } finally {
    unregister();
  }
});

test("legacy peer-ID chat routes are recognized only while focused", () => {
  const unregister = registerActiveChatView(ownerId, peerId);
  try {
    withDocumentFocus("visible", true, () => {
      assert.equal(isActiveChatFocusedForCall(ownerId, peerId), true);
    });
  } finally {
    unregister();
  }
});

test("stale route cleanup cannot clear a newer active chat", () => {
  const oldRegistration = registerActiveChatView(ownerId, peerId);
  const newThreadId = `dm_${[ownerId, otherPeerId].sort().join("_")}`;
  const newRegistration = registerActiveChatView(ownerId, newThreadId);
  oldRegistration();
  try {
    withDocumentFocus("visible", true, () => {
      assert.equal(isActiveChatFocusedForCall(ownerId, peerId), false);
      assert.equal(isActiveChatFocusedForCall(ownerId, otherPeerId), true);
    });
  } finally {
    newRegistration();
  }
});