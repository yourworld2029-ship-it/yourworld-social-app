import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { fetchVideoBlob } from "./yw-download";

const sourceBytes = Uint8Array.from({ length: 100 }, (_, index) => index);

test("video download combines four validated byte ranges in order", async () => {
  const requestedRanges: string[] = [];
  const fakeFetch = async (
    _input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const rangeHeader = new Headers(init?.headers).get("Range");
    assert.ok(rangeHeader);
    requestedRanges.push(rangeHeader);
    const match = rangeHeader.match(/^bytes=(\d+)-(\d+)$/);
    assert.ok(match);
    const start = Number(match[1]);
    const end = Number(match[2]);
    return new Response(sourceBytes.slice(start, end + 1), {
      status: 206,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes ${start}-${end}/${sourceBytes.length}`,
        "Content-Length": String(end - start + 1),
      },
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
    assert.deepEqual(requestedRanges, [
      "bytes=0-0",
      "bytes=0-24",
      "bytes=25-49",
      "bytes=50-74",
      "bytes=75-99",
    ]);
  } finally {
    mock.restoreAll();
  }
});


test("video download falls back to a full response when Range is ignored", async () => {
  let requestCount = 0;
  const fakeFetch = async (
    _input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    requestCount += 1;
    const isRangeRequest = new Headers(init?.headers).has("Range");
    if (isRangeRequest) {
      return new Response(sourceBytes, {
        status: 200,
        headers: { "Content-Type": "video/mp4" },
      });
    }
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
    const blob = await fetchVideoBlob("https://media.example/video.mp4");
    assert.equal(requestCount, 2);
    assert.deepEqual(
      new Uint8Array(await blob.arrayBuffer()),
      sourceBytes,
    );
  } finally {
    mock.restoreAll();
  }
});

test("Supabase Storage video downloads request attachment without dropping the signature", async () => {
  const requestedUrls: URL[] = [];
  const fakeFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    requestedUrls.push(new URL(String(input)));
    if (new Headers(init?.headers).has("Range")) {
      return new Response(sourceBytes, { status: 200 });
    }
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
    assert.equal(requestedUrls.length, 2);
    for (const url of requestedUrls) {
      assert.equal(url.searchParams.get("token"), "signed-token");
      assert.equal(url.searchParams.get("download"), "my-clip.mp4");
    }
  } finally {
    mock.restoreAll();
  }
});