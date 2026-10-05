import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
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

async function startServer(t: TestContext, logLevel = "silent") {
  const app = express();
  app.use(pinoHttp({ logger: pino({ level: logLevel }) }));
  app.use(cors());
  app.use(express.json());
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

function createSourceFixture(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "testsrc2=size=1280x720:rate=24:duration=4",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-b:v",
        "4M",
        "-maxrate",
        "4M",
        "-bufsize",
        "4M",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        filePath,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = `${stderr}${chunk.toString("utf8")}`.slice(-4000);
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with code ${String(code)}`));
    });
  });
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

test("offline-source creates and caches a genuinely smaller selected rendition", async (t) => {
  setTestEnvironment(t);
  const directory = await mkdtemp(join(tmpdir(), "yourworld-offline-route-test-"));
  const sourcePath = join(directory, "source.mp4");
  await createSourceFixture(sourcePath);
  const sourceBytes = await readFile(sourcePath);
  let uploadedBytes = 0;
  let uploadedObjectPath = "";
  let sourceFetchCount = 0;

  t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") {
        return jsonResponse({ id: "user-1" });
      }
      if (url.pathname === "/rest/v1/posts") {
        return jsonResponse([
          {
            id: "post-1",
            user_id: "user-1",
            kind: "video",
            media_url: "videos/user-1/source.mp4",
            source_quality_tier: "720p",
            video_access: "public",
            allow_download: true,
          },
        ]);
      }
      if (
        url.pathname === "/storage/v1/object/list/videos" &&
        init?.method === "POST"
      ) {
        const cachedName = uploadedObjectPath.split("/").pop();
        return jsonResponse(cachedName ? [{ name: cachedName }] : []);
      }
      if (
        url.pathname === "/storage/v1/object/videos/user-1/source.mp4" &&
        (!init?.method || init.method === "GET")
      ) {
        sourceFetchCount += 1;
        return new Response(sourceBytes, {
          headers: { "Content-Type": "video/mp4", "Content-Length": String(sourceBytes.byteLength) },
        });
      }
      if (
        url.pathname.startsWith(
          "/storage/v1/object/videos/user-1/.quality-renditions/post-1/",
        ) &&
        init?.method === "POST"
      ) {
        uploadedObjectPath = decodeURIComponent(
          url.pathname.replace("/storage/v1/object/videos/", ""),
        );
        const body = init.body as AsyncIterable<Uint8Array>;
        for await (const chunk of body) uploadedBytes += chunk.byteLength;
        return new Response(null, { status: 200 });
      }
      if (
        url.pathname.startsWith(
          "/storage/v1/object/sign/videos/user-1/.quality-renditions/post-1/",
        ) &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          signedURL: `${url.pathname.replace("/storage/v1/object/sign", "/object/sign")}?token=test`,
        });
      }
      return jsonResponse({ error: `Unexpected mocked request: ${url.pathname}` }, 500);
    },
  );

  t.after(() => rm(directory, { recursive: true, force: true }));
  const baseUrl = await startServer(t);
  const response = await nativeFetch(`${baseUrl}/api/media/offline-source`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-access-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ postId: "post-1", quality: "360p" }),
  });
  const payload = (await response.json()) as { url?: string; actualQuality?: string };

  assert.equal(response.status, 200);
  assert.equal(payload.actualQuality, "360p");
  assert.match(payload.url ?? "", /\/object\/sign\/videos\/user-1\/\.quality-renditions/);
  assert.match(uploadedObjectPath, /-360p-360p\.mp4$/);
  assert.ok(uploadedBytes > 0);
  assert.ok(uploadedBytes < sourceBytes.byteLength);

  const cachedResponse = await nativeFetch(`${baseUrl}/api/media/offline-source`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-access-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ postId: "post-1", quality: "360p" }),
  });
  const cachedPayload = (await cachedResponse.json()) as {
    url?: string;
    actualQuality?: string;
  };
  assert.equal(cachedResponse.status, 200);
  assert.equal(cachedPayload.actualQuality, "360p");
  assert.match(cachedPayload.url ?? "", /\/object\/sign\/videos\/user-1\/\.quality-renditions/);
  assert.equal(sourceFetchCount, 1, "a cache hit should not refetch or transcode the source");
});

test("offline-source refuses a requested tier above probed source dimensions", async (t) => {
  setTestEnvironment(t);
  const directory = await mkdtemp(join(tmpdir(), "yourworld-offline-upscale-test-"));
  const sourcePath = join(directory, "source.mp4");
  await createSourceFixture(sourcePath);
  const sourceBytes = await readFile(sourcePath);
  let uploadedBytes = 0;

  t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") {
        return jsonResponse({ id: "user-1" });
      }
      if (url.pathname === "/rest/v1/posts") {
        return jsonResponse([
          {
            id: "post-1",
            user_id: "user-1",
            kind: "video",
            media_url: "videos/user-1/source.mp4",
            video_access: "public",
            allow_download: true,
          },
        ]);
      }
      if (
        url.pathname === "/storage/v1/object/list/videos" &&
        init?.method === "POST"
      ) {
        return jsonResponse([]);
      }
      if (
        url.pathname === "/storage/v1/object/videos/user-1/source.mp4" &&
        (!init?.method || init.method === "GET")
      ) {
        return new Response(sourceBytes, {
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": String(sourceBytes.byteLength),
          },
        });
      }
      if (
        url.pathname.startsWith("/storage/v1/object/videos/user-1/.quality-renditions/") &&
        init?.method === "POST"
      ) {
        const body = init.body as AsyncIterable<Uint8Array>;
        for await (const chunk of body) uploadedBytes += chunk.byteLength;
        return new Response(null, { status: 200 });
      }
      return jsonResponse({ error: `Unexpected mocked request: ${url.pathname}` }, 500);
    },
  );

  t.after(() => rm(directory, { recursive: true, force: true }));
  const baseUrl = await startServer(t);
  const response = await nativeFetch(`${baseUrl}/api/media/offline-source`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-access-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ postId: "post-1", quality: "1080p" }),
  });
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 422);
  assert.match(payload.error ?? "", /above this video's source resolution/i);
  assert.equal(uploadedBytes, 0, "an unsupported upscale must never be stored as a rendition");
});

test("offline-source still honors the creator's download denial", async (t) => {
  setTestEnvironment(t);
  t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0]) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") {
        return jsonResponse({ id: "user-1" });
      }
      if (url.pathname === "/rest/v1/posts") {
        return jsonResponse([
          {
            id: "post-1",
            user_id: "user-1",
            kind: "video",
            media_url: "videos/user-1/source.mp4",
            video_access: "public",
            allow_download: false,
          },
        ]);
      }
      return jsonResponse({ error: `Unexpected mocked request: ${url.pathname}` }, 500);
    },
  );

  const baseUrl = await startServer(t);
  const response = await nativeFetch(`${baseUrl}/api/media/offline-source`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-access-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ postId: "post-1", quality: "360p" }),
  });

  assert.equal(response.status, 403);
  assert.match(await response.text(), /creator has disabled offline downloads/i);
});