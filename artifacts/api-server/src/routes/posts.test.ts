import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import postsRouter from "./posts";

const nativeFetch = globalThis.fetch.bind(globalThis);
const testSupabaseUrl = "https://supabase.test";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function startServer(t: TestContext) {
  const app = express();
  app.use(pinoHttp({ logger: pino({ level: "silent" }) }));
  app.use(express.json());
  app.use(postsRouter);

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

function setFakeSupabaseEnvironment(t: TestContext) {
  const keys = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  const previousValues = new Map(keys.map((key) => [key, process.env[key]]));

  process.env.SUPABASE_URL = testSupabaseUrl;
  process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

  t.after(() => {
    for (const key of keys) {
      const value = previousValues.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("pin endpoint returns the persisted state as JSON", async (t) => {
  setFakeSupabaseEnvironment(t);
  const captured: {
    updateRequest?: { url: URL; body: unknown; authorization: string | null };
  } = {};
  t.mock.method(
    globalThis,
    "fetch",
      async (
        input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
      ) => {
        const url = new URL(String(input));
        if (url.pathname === "/auth/v1/user") {
          return jsonResponse({ id: "owner-1" });
        }
        if (url.pathname === "/rest/v1/posts" && init?.method !== "PATCH") {
          return url.searchParams.has("pinned")
            ? jsonResponse([])
            : jsonResponse([{ id: "post-1", pinned: false }]);
        }
        if (url.pathname === "/rest/v1/posts" && init?.method === "PATCH") {
          const headers = new Headers(init.headers);
          captured.updateRequest = {
            url,
            body: JSON.parse(String(init.body)),
            authorization: headers.get("authorization"),
          };
          return jsonResponse([{ id: "post-1", pinned: true }]);
        }
        return jsonResponse({ error: "Unexpected mocked request" }, 500);
    },
  );

  const baseUrl = await startServer(t);
  const response = await nativeFetch(`${baseUrl}/posts/post-1/pin`, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer test-user-access-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pinned: true }),
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/i);
  assert.deepEqual(await response.json(), { postId: "post-1", pinned: true });
  assert.ok(captured.updateRequest);
  assert.equal(captured.updateRequest.url.searchParams.get("id"), "eq.post-1");
  assert.equal(captured.updateRequest.url.searchParams.get("user_id"), "eq.owner-1");
  assert.deepEqual(captured.updateRequest.body, { pinned: true });
  assert.equal(
    captured.updateRequest.authorization,
    "Bearer test-service-role-key",
  );
});

test("pin endpoint reports a missing pinned column instead of claiming success", async (t) => {
  setFakeSupabaseEnvironment(t);
  t.mock.method(globalThis, "fetch", async (input: Parameters<typeof fetch>[0]) => {
    const url = new URL(String(input));
    if (url.pathname === "/auth/v1/user") {
      return jsonResponse({ id: "owner-1" });
    }
    return jsonResponse(
      {
        code: "PGRST204",
        message: "Could not find the 'pinned' column of 'posts' in the schema cache",
      },
      400,
    );
  });

  const baseUrl = await startServer(t);
  const response = await nativeFetch(`${baseUrl}/posts/post-1/pin`, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer test-user-access-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pinned: true }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error:
      "Post pinning is unavailable until the posts.pinned database migration is applied.",
  });
});

test("pin endpoint rejects an unauthenticated request without contacting Supabase", async (t) => {
  let upstreamCalls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    upstreamCalls += 1;
    return jsonResponse({});
  });

  const baseUrl = await startServer(t);
  const response = await nativeFetch(`${baseUrl}/posts/post-1/pin`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pinned: true }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication is required." });
  assert.equal(upstreamCalls, 0);
});