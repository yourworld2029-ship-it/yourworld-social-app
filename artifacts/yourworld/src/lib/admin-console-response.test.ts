import assert from "node:assert/strict";
import test from "node:test";
import { describeAdminResponseShape, findAdminConsolePayload } from "./admin-console-response";

const payload = {
  pendingVerificationCount: 1,
  pendingUserReportsCount: 7,
  pendingCopyrightReportsCount: 0,
  loadErrors: {
    overview: null,
    userReports: null,
    copyrightReports: null,
    other: null,
    profileLookup: null,
  },
  userReports: [],
  copyrightReports: [],
  monetization: [],
  restrictions: [],
  payoutHolds: [],
  audit: [],
};

test("finds Admin Console data in the direct server-function response", () => {
  assert.deepEqual(findAdminConsolePayload(payload), payload);
});

test("finds Admin Console data in deeply nested server-function envelopes", () => {
  const wrapped = {
    result: {
      data: {
        response: {
          payload: {
            result: payload,
          },
        },
      },
    },
  };
  assert.deepEqual(findAdminConsolePayload(wrapped), payload);
});

test("returns null for a response without report arrays and describes its safe shape", () => {
  const response = { result: { error: "Unavailable" } };
  assert.equal(findAdminConsolePayload(response), null);
  assert.equal(describeAdminResponseShape(response), "error");
});
