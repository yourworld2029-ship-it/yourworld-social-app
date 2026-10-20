import assert from "node:assert/strict";
import test from "node:test";
import { isOwnerAdminEmail } from "./admin-routing";

test("owner admin email comparison trims whitespace and ignores case", () => {
  assert.equal(isOwnerAdminEmail("  YourWorld2029@Gmail.com "), true);
});

test("owner admin allowlist rejects other or missing identities", () => {
  assert.equal(isOwnerAdminEmail("yourworldadmin3@gmail.com"), false);
  assert.equal(isOwnerAdminEmail(null), false);
  assert.equal(isOwnerAdminEmail(undefined), false);
});
