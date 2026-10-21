import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import test from "node:test";
import express, { type Request } from "express";
import liveRouter from "./live";

const ownerId = "7f1fa8f7-5a8b-45af-8d46-6f8c9f35e125";
const replayId = "5e3e9bd4-cad8-4bc3-91e0-f46df9cb362e";
const streamId = "179d682f-5f82-48dc-bfce-7d42d4bec789";
const postId = "d74aa229-d798-4a5f-87ee-28b5942168ba";

test("deletes replay records and the linked post even when the source path is detached", async () => {
  const previousFetch = globalThis.fetch;
  const previousEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_STREAM_API_TOKEN: process.env.CLOUDFLARE_STREAM_API_TOKEN,
  };
  const calls: Array<{ method: string; pathname: string }> = [];
  process.env.SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_STREAM_API_TOKEN;

  globalThis.fetch = (async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const method = init?.method ?? "GET";
    calls.push({ method, pathname: url.pathname });

    if (url.pathname === "/auth/v1/user") {
      return Response.json({ id: ownerId });
    }
    if (url.pathname === "/rest/v1/live_replays" && method === "GET") {
      return Response.json([
        {
          id: replayId,
          broadcaster_id: ownerId,
          stream_id: streamId,
          post_id: postId,
          stream_uid: null,
          storage_bucket: "live-replays",
          source_path: "detached/moved-live-file.mp4",
        },
      ]);
    }
    if (
      url.pathname === "/rest/v1/posts" ||
      (url.pathname === "/rest/v1/live_replays" && method === "DELETE")
    ) {
      return new Response(null, { status: 204 });
    }
    if (url.pathname.startsWith("/storage/v1/object/")) {
      return new Response(null, { status: 404 });
    }
    throw new Error(`Unexpected mocked fetch: ${method} ${url.pathname}`);
  }) as typeof fetch;

  const app = express();
  app.use((req: Request, _res, next) => {
    Object.assign(req, { log: { warn() {}, error() {} } });
    next();
  });
  app.use(liveRouter);
  const server = createServer(app);

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const result = await new Promise<{ statusCode: number }>((resolve, reject) => {
      const req = httpRequest(
        {
          host: "127.0.0.1",
          port: address.port,
          path: `/live/replays/${replayId}`,
          method: "DELETE",
          headers: { authorization: "Bearer test-session-token" },
        },
        (res) => {
          res.resume();
          res.once("end", () => resolve({ statusCode: res.statusCode ?? 0 }));
        },
      );
      req.once("error", reject);
      req.end();
    });

    assert.equal(result.statusCode, 204);
    assert.ok(
      calls.some(
        (call) => call.method === "DELETE" && call.pathname === "/rest/v1/posts",
      ),
    );
    assert.ok(
      calls.some(
        (call) =>
          call.method === "DELETE" &&
          call.pathname === "/rest/v1/live_replays",
      ),
    );
    assert.ok(
      !calls.some(
        (call) =>
          call.method === "DELETE" &&
          call.pathname ===
            `/storage/v1/object/live-replays/${ownerId}/live-replays/${streamId}.mp4`,
      ),
      "a detached source path must not create a storage deletion target",
    );
  } finally {
    server.close();
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
