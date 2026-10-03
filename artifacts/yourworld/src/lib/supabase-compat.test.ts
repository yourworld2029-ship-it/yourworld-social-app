import assert from "node:assert/strict";
import test from "node:test";
import { writeCompat } from "./supabase-compat";

test("writeCompat does not retry without a required video source column", async () => {
  let attempts = 0;
  const result = await writeCompat(
    async () => {
      attempts += 1;
      return {
        error: {
          message: "Could not find the 'video_url' column of 'posts' in the schema cache",
        },
      };
    },
    { media_url: "https://stream.example/video.m3u8", video_url: "videos/user/source.mp4" },
    { kind: "type" },
    ["video_url"],
  );

  assert.equal(attempts, 1);
  assert.equal(Boolean(result.error?.message?.includes("video_url")), true);
  assert.deepEqual(result.removedColumns, []);
});

test("writeCompat still removes optional columns reported missing by PostgREST", async () => {
  const attempts: Record<string, unknown>[] = [];
  const result = await writeCompat(
    async (payload) => {
      attempts.push({ ...payload });
      return "caption" in payload
        ? { error: { message: "Could not find the 'caption' column of 'posts'" } }
        : { error: null };
    },
    { caption: "A video", video_url: "videos/user/source.mp4" },
    {},
    ["video_url"],
  );

  assert.equal(result.error, null);
  assert.deepEqual(result.removedColumns, ["caption"]);
  assert.equal(attempts.length, 2);
  assert.equal("video_url" in attempts[1], true);
});