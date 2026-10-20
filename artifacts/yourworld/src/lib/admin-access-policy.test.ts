import assert from "node:assert/strict";
import test from "node:test";
import { hasAdminConsoleAccess } from "./admin-access-policy";

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
