import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { fetchVideoBlob, reelWatermarkText } from "./yw-download";

const sourceBytes = Uint8Array.from({ length: 100 }, (_, index) => index);

test("Reel watermark text uses the creator handle exactly once", () => {
  assert.equal(reelWatermarkText("creator"), "YourWorld • @creator");
  assert.equal(reelWatermarkText("@creator"), "YourWorld • @creator");
  assert.equal(reelWatermarkText(""), "YourWorld • @user");
});

test("video download streams the full response when the server ignores Range", async () => {
  let requestCount = 0;
  const fakeFetch = async (
    _input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    requestCount += 1;
    assert.equal(new Headers(init?.headers).get("Range"), "bytes=0-4194303");
    return new Response(sourceBytes, {
      status: 200,
      headers: { "Content-Type": "video/mp4" },
    });
  };
  mock.method(globalThis, "fetch", fakeFetch);

  try {
    const blob = await fetchVideoBlob("https://media.example/video.mp4");
    assert.equal(blob.size, sourceBytes.length);
    assert.deepEqual(
      new Uint8Array(await blob.arrayBuffer()),
      sourceBytes,
    );
    assert.equal(requestCount, 1);
  } finally {
    mock.restoreAll();
  }
});

test("video downloads reassemble parallel byte ranges in order", async () => {
  const source = new Uint8Array(8 * 1024 * 1024 + 257);
  for (let index = 0; index < source.length; index += 1) {
    source[index] = index % 251;
  }
  const requestedRanges: string[] = [];
  let activeRequests = 0;
  let maxActiveRequests = 0;

  mock.method(
    globalThis,
    "fetch",
    async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const rangeHeader = new Headers(init?.headers).get("Range");
      assert.ok(rangeHeader);
      requestedRanges.push(rangeHeader);
      const match = rangeHeader.match(/^bytes=(\d+)-(\d+)$/);
      assert.ok(match);
      const start = Number(match[1]);
      const end = Number(match[2]);
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      await new Promise((resolve) => setTimeout(resolve, 10));
      activeRequests -= 1;
      return new Response(source.slice(start, end + 1), {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${source.length}`,
          "Content-Type": "video/mp4",
        },
      });
    },
  );

  try {
    const blob = await fetchVideoBlob("https://media.example/video.mp4");
    assert.equal(blob.size, source.length);
    assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), source);
    assert.equal(requestedRanges.length, 3);
    assert.ok(maxActiveRequests >= 2, "range chunks should download concurrently");
  } finally {
    mock.restoreAll();
  }
});

test("video download reports HTTP status errors", async () => {
  const fakeFetch = async (
    _input: RequestInfo | URL,
  ): Promise<Response> => {
    return new Response("unavailable", { status: 503 });
  };
  mock.method(globalThis, "fetch", fakeFetch);

  try {
    await assert.rejects(
      fetchVideoBlob("https://media.example/video.mp4"),
      /Video download failed \(503\)/,
    );
  } finally {
    mock.restoreAll();
  }
});

test("video download reports network errors", async () => {
  mock.method(globalThis, "fetch", async () => {
    throw new Error("network unavailable");
  });
  try {
    await assert.rejects(
      fetchVideoBlob("https://media.example/video.mp4"),
      /network unavailable/,
    );
  } finally {
    mock.restoreAll();
  }
});

test("video download rejects an empty successful response", async () => {
  mock.method(globalThis, "fetch", async () => new Response(null, { status: 204 }));
  try {
    await assert.rejects(
      fetchVideoBlob("https://media.example/video.mp4"),
      /empty file/,
    );
  } finally {
    mock.restoreAll();
  }
});

test("Supabase Storage video downloads preserve the signed URL query", async () => {
  const requestedUrls: URL[] = [];
  const fakeFetch = async (
    input: RequestInfo | URL,
  ): Promise<Response> => {
    requestedUrls.push(new URL(String(input)));
    return new Response(sourceBytes, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(sourceBytes.length),
      },
    });
  };
  mock.method(globalThis, "fetch", fakeFetch);

  try {
    const blob = await fetchVideoBlob(
      "https://project.supabase.co/storage/v1/object/sign/videos/u1/clip.mp4?token=signed-token",
      undefined,
      "my-clip.mp4",
    );
    assert.equal(blob.size, sourceBytes.length);
    assert.equal(requestedUrls.length, 1);
    assert.equal(requestedUrls[0].searchParams.get("token"), "signed-token");
    assert.equal(requestedUrls[0].searchParams.get("download"), "my-clip.mp4");
  } finally {
    mock.restoreAll();
  }
});