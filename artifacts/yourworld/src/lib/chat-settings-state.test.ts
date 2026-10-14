import assert from "node:assert/strict";
import test from "node:test";
import { shouldHydrateChatSettings } from "./chat-settings-state";

test("hydrates shared protection even without a private preference or auto-delete mode", () => {
  assert.equal(
    shouldHydrateChatSettings({
      participantPreference: null,
      conversationAutoDeleteSetting: null,
      conversationProtection: { protect_chat_enabled: true },
    }),
    true,
  );
});

test("does not treat a conversation with no settings as a settings snapshot", () => {
  assert.equal(
    shouldHydrateChatSettings({
      participantPreference: null,
      conversationAutoDeleteSetting: null,
      conversationProtection: null,
    }),
    false,
  );
});
