import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";
import {
  decryptProtectedChatPayload,
  encryptProtectedChatPayload,
} from "./chat-cache-security";

if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

test("AES-GCM chat cache payloads round-trip and authenticate their thread scope", async () => {
  const key = await globalThis.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const rows = [
    { id: "message-1", text: "local-only cache", created_at: "2026-10-03T00:00:00Z" },
  ];
  const envelope = await encryptProtectedChatPayload(
    rows,
    key,
    "yourworld-chat-cache:v1:user-1:thread-1",
  );

  assert.equal(envelope.version, 1);
  assert.notEqual(envelope.ciphertext.byteLength, 0);
  assert.deepEqual(
    await decryptProtectedChatPayload(
      envelope,
      key,
      "yourworld-chat-cache:v1:user-1:thread-1",
    ),
    rows,
  );
  await assert.rejects(
    decryptProtectedChatPayload(
      envelope,
      key,
      "yourworld-chat-cache:v1:user-2:thread-1",
    ),
  );
});