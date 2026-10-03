import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import cors from "cors";
import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import mediaRouter from "./media";

const nativeFetch = globalThis.fetch.bind(globalThis);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function setTestEnvironment(t: TestContext) {
  const values = {
    SUPABASE_URL: "https://supabase.test",
    SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CLOUDFLARE_ACCOUNT_ID: "test-account",
    CLOUDFLARE_STREAM_API_TOKEN: "test-cloudflare-token",
  } as const;
  const previous = new Map(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );

  Object.assign(process.env, values);
  t.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

async function startServer(t: TestContext) {
  const app = express();
  app.use(pinoHttp({ logger: pino({ level: "silent" }) }));
  app.use(cors());
  app.use("/api", mediaRouter);

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

test("Cloudflare TUS creation exposes protocol headers to native WebViews", async (t) => {
  setTestEnvironment(t);
  t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") {
        return jsonResponse({ id: "user-1" });
      }
      if (
        url.pathname === "/storage/v1/object/sign/videos/user-1/video.mp4" &&
        init?.method === "POST"
      ) {
        return jsonResponse({ signedURL: "/object/sign/videos/user-1/video.mp4?token=test" });
      }
      if (url.pathname === "/client/v4/accounts/test-account/stream") {
        return new Response(null, {
          status: 201,
          headers: {
            Location: "https://upload.videodelivery.net/tus/session-id",
            "Stream-Media-Id": "stream-video-id",
          },
        });
      }
      return jsonResponse({ error: `Unexpected mocked request: ${url.pathname}` }, 500);
    },
  );

  const baseUrl = await startServer(t);
  const encode = (value: string) => Buffer.from(value, "utf8").toString("base64");
  const metadata = [
    ["bucketName", "videos"],
    ["objectName", "user-1/video.mp4"],
    ["contentType", "video/mp4"],
    ["name", "video.mp4"],
    ["requiresSignedUrls", "false"],
  ]
    .map(([key, value]) => `${key} ${encode(value)}`)
    .join(",");
  const response = await nativeFetch(`${baseUrl}/api/media/cloudflare-tus-upload`, {
    method: "POST",
    headers: {
      Origin: "capacitor://localhost",
      Authorization: "Bearer test-user-access-token",
      "Tus-Resumable": "1.0.0",
      "Upload-Length": "1024",
      "Upload-Metadata": metadata,
    },
  });

  assert.equal(response.status, 201);
  const exposedHeaders = new Set(
    (response.headers.get("access-control-expose-headers") ?? "")
      .split(",")
      .map((header) => header.trim().toLowerCase()),
  );
  assert.ok(exposedHeaders.has("location"));
  assert.ok(exposedHeaders.has("stream-media-id"));
  assert.ok(exposedHeaders.has("tus-resumable"));
  assert.equal(
    response.headers.get("location"),
    "https://upload.videodelivery.net/tus/session-id",
  );
  assert.equal(response.headers.get("stream-media-id"), "stream-video-id");
});