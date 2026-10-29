import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesNotificationFilter,
  type NotificationFilter,
} from "./notification-filters";
import type { NotificationKind } from "./notifications-store";

const following = { followed: true };
const item = (kind: NotificationKind, actorId?: string) => ({ kind, actorId });

test("All includes every notification type", () => {
  const kinds: NotificationKind[] = [
    "like",
    "comment",
    "mention",
    "follower",
    "message",
    "collaboration",
    "channel",
    "verification",
    "monetization",
    "system",
  ];
  for (const kind of kinds) {
    assert.equal(matchesNotificationFilter(item(kind), "all", following), true);
  }
});

test("each category chip filters its real notification types", () => {
  const cases: Array<[NotificationFilter, NotificationKind, boolean]> = [
    ["likes", "like", true],
    ["likes", "comment", false],
    ["followers", "follower", true],
    ["followers", "like", false],
    ["comments", "comment", true],
    ["comments", "mention", false],
    ["mentions", "mention", true],
    ["mentions", "collaboration", true],
    ["mentions", "comment", false],
    ["monetization", "monetization", true],
    ["monetization", "channel", true],
    ["monetization", "verification", false],
    ["verified", "verification", true],
    ["verified", "system", false],
  ];

  for (const [filter, kind, expected] of cases) {
    assert.equal(
      matchesNotificationFilter(item(kind), filter, following),
      expected,
      `${filter} / ${kind}`,
    );
  }
});

test("People you follow uses the live followed-user IDs", () => {
  assert.equal(matchesNotificationFilter(item("comment", "followed"), "following", following), true);
  assert.equal(matchesNotificationFilter(item("comment", "other"), "following", following), false);
  assert.equal(matchesNotificationFilter(item("system"), "following", following), false);
});
