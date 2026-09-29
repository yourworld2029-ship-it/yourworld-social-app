import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPin, randomPinSalt, verifyPin } from "./secret-pin";

test("new Secret Lock PIN hashes are versioned PBKDF2 hashes", async () => {
  const salt = randomPinSalt();
  const hash = await hashPin(salt, "3814");

  assert.match(hash, /^pbkdf2-sha256\$310000\$[a-f\d]{64}$/);
  assert.equal(await verifyPin(salt, "3814", hash), true);
  assert.equal(await verifyPin(salt, "3815", hash), false);
});

test("legacy salted SHA-256 Secret Lock hashes remain verifiable", async () => {
  const salt = "legacy-salt";
  const bytes = new TextEncoder().encode(`${salt}:2468`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const legacyHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  assert.equal(await verifyPin(salt, "2468", legacyHash), true);
  assert.equal(await verifyPin(salt, "2469", legacyHash), false);
});

test("malformed or unsupported PIN hashes are rejected", async () => {
  assert.equal(await verifyPin("salt", "1234", "not-a-hash"), false);
  assert.equal(
    await verifyPin("salt", "1234", `pbkdf2-sha256$1$${"a".repeat(64)}`),
    false,
  );
});