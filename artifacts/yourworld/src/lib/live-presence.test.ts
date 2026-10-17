import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveLiveViewerIdentities, type LivePresenceMeta } from "./live-presence";

test("Live viewers use their public profile and duplicate sessions count once", () => {
  const presence: LivePresenceMeta[] = [
    {
      user_id: "host",
      peer_id: "host-peer",
      role: "broadcaster",
      username: "host",
      avatar_url: null,
    },
    {
      user_id: "viewer-a",
      peer_id: "viewer-a-phone",
      role: "viewer",
      username: "host",
      avatar_url: "/host.png",
    },
    {
      user_id: "viewer-a",
      peer_id: "viewer-a-tablet",
      role: "viewer",
      username: "host",
      avatar_url: "/host.png",
    },
    {
      user_id: "viewer-b",
      peer_id: "viewer-b-phone",
      role: "viewer",
      username: "host",
      avatar_url: "/host.png",
    },
  ];
  const profiles = new Map([
    ["viewer-a", {
      id: "viewer-a",
      username: "malwa",
      display_name: "Malwa",
      avatar_url: "/malwa.png",
    }],
    ["viewer-b", {
      id: "viewer-b",
      username: "vikas",
      display_name: "Vikas",
      avatar_url: "/vikas.png",
    }],
  ]);

  assert.deepEqual(
    resolveLiveViewerIdentities(presence, profiles).map((viewer) => ({
      userId: viewer.userId,
      username: viewer.username,
      avatarUrl: viewer.avatarUrl,
    })),
    [
      { userId: "viewer-a", username: "malwa", avatarUrl: "/malwa.png" },
      { userId: "viewer-b", username: "vikas", avatarUrl: "/vikas.png" },
    ],
  );
});
