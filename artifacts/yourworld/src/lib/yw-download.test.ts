import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { nativeOfflinePathsForVideo } from "./native-offline-paths";
import { fetchVideoBlob, reelWatermarkText, toDownloadedVideo } from "./yw-download";

const sourceBytes = Uint8Array.from({ length: 100 }, (_, index) => index);

test("Reel watermark text uses the creator handle exactly once", () => {
  assert.equal(reelWatermarkText("creator"), "YourWorld • @creator");
  assert.equal(reelWatermarkText("@creator"), "YourWorld • @creator");
  assert.equal(reelWatermarkText(""), "YourWorld • @user");
});

test("native offline video files use flat, ID-based app data paths", () => {
  assert.deepEqual(nativeOfflinePathsForVideo("video-123"), {
    localFilePath: "offline_video-123_original.mp4",
    thumbnailPath: "offline_video-123_original-thumbnail",
  });
  assert.equal(
    nativeOfflinePathsForVideo("video/../123", "720p", "user/1").localFilePath,
    "offline_video%2F%2E%2E%2F123_720p_user%2F1.mp4",
  );
  assert.equal(
    nativeOfflinePathsForVideo("video-123", "360p", "user-1").localFilePath,
    "offline_video-123_360p_user-1.mp4",
  );
});

test("download-library metadata retains the selected quality tag", () => {
  const downloaded = toDownloadedVideo({
    id: "owner-1:video-123:720p",
    ownerId: "owner-1",
    mediaId: "video-123",
    title: "Test video",
    author: "Creator",
    creatorUsername: "creator",
    thumbnailUrl: "",
    quality: "720p",
    sizeBytes: 1_234_567,
    downloadedAt: "2026-10-01T04:00:00.000Z",
  });

  assert.equal(downloaded.quality, "720p");
  assert.equal(downloaded.mediaId, "video-123");
});

test("video download uses one full GET without requesting a byte range", async () => {
  let requestCount = 0;
  const fakeFetch = async (
    _input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    requestCount += 1;
    assert.equal(init?.method, "GET");
    assert.equal(new Headers(init?.headers).get("Range"), null);
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

test("video download rejects a partial response instead of saving incomplete bytes", async () => {
  mock.method(
    globalThis,
    "fetch",
    async (): Promise<Response> =>
      new Response(sourceBytes, {
        status: 206,
        headers: { "Content-Range": "bytes 0-99/1000" },
      }),
  );
  try {
    await assert.rejects(
      fetchVideoBlob("https://media.example/video.mp4"),
      /partial response/,
    );
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