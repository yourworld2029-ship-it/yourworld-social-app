import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPin, isValidSecretCode, randomPinSalt, verifyPin } from "./secret-pin";

test("Secret Codes accept only 4-8 ASCII letters and numbers", () => {
  assert.equal(isValidSecretCode("A1b2"), true);
  assert.equal(isValidSecretCode("12345678"), true);
  assert.equal(isValidSecretCode("abc"), false);
  assert.equal(isValidSecretCode("abcdefghi"), false);
  assert.equal(isValidSecretCode("ab-12"), false);
  assert.equal(isValidSecretCode("ébc1"), false);
});

test("new Secret Codes are 4-8 character alphanumeric PBKDF2 hashes", async () => {
  const salt = randomPinSalt();
  const hash = await hashPin(salt, "A7c204");

  assert.match(hash, /^pbkdf2-sha256\$310000\$[a-f\d]{64}$/);
  assert.equal(await verifyPin(salt, "A7c204", hash), true);
  assert.equal(await verifyPin(salt, "A7c205", hash), false);
  assert.equal(await verifyPin(salt, "a7c204", hash), false);
});

test("legacy numeric Secret Lock hashes remain verifiable", async () => {
  const salt = "legacy-salt";
  const bytes = new TextEncoder().encode(`${salt}:2468`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const legacyHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  assert.equal(await verifyPin(salt, "2468", legacyHash), true);
  assert.equal(await verifyPin(salt, "2469", legacyHash), false);
});

test("invalid Secret Codes and malformed hashes are rejected", async () => {
  await assert.rejects(() => hashPin("salt", "abc"));
  await assert.rejects(() => hashPin("salt", "too-long9"));
  await assert.rejects(() => hashPin("salt", "code!"));
  assert.equal(await verifyPin("salt", "abc", "not-a-hash"), false);
  assert.equal(await verifyPin("salt", "1234", "not-a-hash"), false);
  assert.equal(
    await verifyPin("salt", "1234", `pbkdf2-sha256$1$${"a".repeat(64)}`),
    false,
  );
});