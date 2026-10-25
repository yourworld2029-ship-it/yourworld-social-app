import assert from "node:assert/strict";
import test from "node:test";
import {
  canReadSportsVerificationWithoutStepUp,
  hasAdminConsoleAccess,
} from "./admin-access-policy";

test("the owner email grants Admin Console access regardless of casing or whitespace", () => {
  assert.equal(hasAdminConsoleAccess(" YourWorld2029@Gmail.com ", null), true);
});

test("the admin role grants Admin Console access", () => {
  assert.equal(hasAdminConsoleAccess("another@example.com", "admin"), true);
});

test("other emails and roles do not grant Admin Console access", () => {
  assert.equal(hasAdminConsoleAccess("another@example.com", "moderator"), false);
  assert.equal(hasAdminConsoleAccess("another@example.com", null), false);
});

test("only the configured owner can read Sports Verification without another step-up", () => {
  assert.equal(canReadSportsVerificationWithoutStepUp(" YourWorld2029@Gmail.com "), true);
  assert.equal(canReadSportsVerificationWithoutStepUp("another@example.com"), false);
  assert.equal(canReadSportsVerificationWithoutStepUp(null), false);
});
