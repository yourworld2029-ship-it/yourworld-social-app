import assert from "node:assert/strict";
import test from "node:test";
import { executeAdminRead } from "./admin-console-read";

test("uses the public callable, not the empty internal SSR executor", async () => {
  const payload = {
    pendingVerificationCount: 2,
    pendingUserReportsCount: 1,
    pendingCopyrightReportsCount: 0,
    userReports: [{ id: "report-1" }],
    copyrightReports: [],
    loadErrors: { userReports: null },
  };
  const handler = Object.assign(async () => payload, {
    __executeServer: async () => {
      throw new Error("The private SSR executor must not be used");
    },
  });
  const result = await executeAdminRead(handler);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { data: payload });
});

test("preserves empty payout request arrays", async () => {
  assert.deepEqual(await executeAdminRead(async () => ({ requests: [] })), {
    data: { requests: [] },
  });
});

test("does not suppress authentication, authorization or MFA failures", async () => {
  for (const message of ["Unauthorized", "Forbidden", "Admin MFA is required"]) {
    await assert.rejects(
      executeAdminRead(async () => { throw new Error(message); }),
      { message },
    );
  }
});

test("rejects missing data rather than serializing a successful empty object", async () => {
  await assert.rejects(executeAdminRead(async () => undefined), /empty response/);
  await assert.rejects(executeAdminRead(async () => null), /empty response/);
});
