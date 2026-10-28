import assert from "node:assert/strict";
import { test } from "node:test";
import { withSupabaseQueryResilience } from "./supabase-query-fetch";

test("PostgREST reads retry network and temporary server failures", async () => {
  let attempts = 0;
  const resilientFetch = withSupabaseQueryResilience(
    async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("offline");
      if (attempts === 2) return new Response(null, { status: 503 });
      return new Response("ok", { status: 200 });
    },
    { timeoutMs: 100, baseDelayMs: 0 },
  );

  const response = await resilientFetch(
    "https://example.supabase.co/rest/v1/posts?select=id",
  );

  assert.equal(response.status, 200);
  assert.equal(attempts, 3);
});

test("PostgREST read attempts time out at the configured limit", async () => {
  const resilientFetch = withSupabaseQueryResilience(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      }),
    { timeoutMs: 5, maxAttempts: 1 },
  );

  await assert.rejects(
    resilientFetch("https://example.supabase.co/rest/v1/posts?select=id"),
    { name: "TimeoutError" },
  );
});

test("PostgREST read timeout also covers a response body that stalls", async () => {
  const resilientFetch = withSupabaseQueryResilience(
    async (_input, init) =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            init?.signal?.addEventListener("abort", () => {
              const error = new Error("aborted");
              error.name = "AbortError";
              controller.error(error);
            });
          },
        }),
      ),
    { timeoutMs: 5, maxAttempts: 1 },
  );

  await assert.rejects(
    resilientFetch("https://example.supabase.co/rest/v1/posts?select=id"),
    { name: "TimeoutError" },
  );
});

test("mutations, Storage, and non-Supabase requests are not retried", async () => {
  let attempts = 0;
  const resilientFetch = withSupabaseQueryResilience(async () => {
    attempts += 1;
    throw new TypeError("offline");
  });

  await assert.rejects(
    resilientFetch("https://example.supabase.co/rest/v1/posts", {
      method: "POST",
    }),
  );
  await assert.rejects(
    resilientFetch("https://example.supabase.co/storage/v1/object/videos/a.mp4"),
  );
  await assert.rejects(resilientFetch("https://api.example.com/data"));

  assert.equal(attempts, 3);
});
