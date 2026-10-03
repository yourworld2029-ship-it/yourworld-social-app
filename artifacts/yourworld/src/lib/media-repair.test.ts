import assert from "node:assert/strict";
import test from "node:test";
import { resolveMediaApiUrl } from "./media-api-url";
import { cloudflareStreamDownloadUrl, cloudflareStreamPosterUrl } from "./cloudflare-stream-media";
import { downloadOfflineHls, selectHlsVariant, type HlsFileDriver } from "./offline-hls";
import { orderedOfflineSources } from "./offline-source-order";

test("download candidates keep Cloudflare → active playback → signed storage priority", () => {
  const cf = "https://videodelivery.net/0123456789abcdef0123456789abcdef/downloads/default.mp4";
  const active = "https://media.test/manifest/video.m3u8";
  const storage = "https://db.test/storage/v1/object/sign/videos/clip.mp4?token=kept";
  assert.deepEqual(orderedOfflineSources({ cloudflareUrl: cf, activeUrl: active, authorizedUrl: storage }),
    [cf, active, storage]);
  assert.deepEqual(orderedOfflineSources({ activeUrl: active, authorizedUrl: storage }), [active, storage]);
  const signed = "https://customer-test.cloudflarestream.com/signed-download-token/downloads/default.mp4";
  assert.deepEqual(orderedOfflineSources({ cloudflareUrl: cf, authorizedUrl: signed, activeUrl: active, storageUrl: storage }),
    [signed, active, storage]);
  assert.deepEqual(orderedOfflineSources({ activeUrl: active, authorizedUrl: active }), [active]);
});

test("Android media requests use the configured hosted API, never the asset server", () => {
  const origin = "https://example.test";
  for (const path of ["/api/media/offline-source", "/api/media/playback-url",
    "/api/media/cloudflare-tus-upload", "/api/media/cloudflare-stream-asset"]) {
    assert.equal(resolveMediaApiUrl(path, true, origin), `${origin}${path}`);
    assert.equal(resolveMediaApiUrl(path, false, origin), path);
  }
  assert.throws(() => resolveMediaApiUrl("/api/media/offline-source", true), /configured/);
  assert.throws(() => resolveMediaApiUrl("/api/media/offline-source", true, "http://example.test"), /HTTPS/);
});

test("Cloudflare ID aliases produce real default MP4 and one-second thumbnail URLs", () => {
  const id = "0123456789abcdef0123456789abcdef";
  assert.equal(cloudflareStreamDownloadUrl(null, id), `https://videodelivery.net/${id}/downloads/default.mp4`);
  assert.equal(cloudflareStreamPosterUrl(null, id), `https://videodelivery.net/${id}/thumbnails/thumbnail.jpg?time=1s`);
  assert.equal(cloudflareStreamDownloadUrl(`https://customer-test.cloudflarestream.com/${id}/manifest/video.m3u8`),
    `https://videodelivery.net/${id}/downloads/default.mp4`);
  assert.equal(cloudflareStreamDownloadUrl("https://untrusted.test/video.mp4"), null);
});

function fileDriver(playlists: Record<string, string>) {
  const files = new Map<string, string>();
  const downloads: string[] = [];
  const removed: string[] = [];
  const driver: HlsFileDriver = {
    readText: async (url) => { if (!(url in playlists)) throw new Error("missing playlist"); return playlists[url]; },
    save: async (url, path) => { downloads.push(url); files.set(path, "media"); return 100; },
    writeText: async (path, text) => { files.set(path, text); },
    removeDirectory: async (path) => { removed.push(path); },
  };
  return { driver, files, downloads, removed };
}

test("native HLS saves complete segments, init data, encryption keys and a local playlist", async () => {
  const url = "https://media.test/clip/video.m3u8";
  const mock = fileDriver({ [url]: '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXTINF:3,\na.ts\n#EXTINF:3,\nb.ts\n#EXT-X-ENDLIST\n' });
  assert.equal(await downloadOfflineHls(url, "data/video.m3u8", mock.driver), 400);
  assert.deepEqual(mock.downloads, ["https://media.test/clip/init.mp4", "https://media.test/clip/key.bin",
    "https://media.test/clip/a.ts", "https://media.test/clip/b.ts"]);
  const local = mock.files.get("data/video.m3u8")!;
  assert.match(local, /URI="video.m3u8.assets\/asset-1"/);
  assert.match(local, /video.m3u8.assets\/asset-3/);
  assert.ok(!local.includes("https://"));
});

test("native HLS resolves a master rendition and its separate audio track", async () => {
  const root = "https://media.test/master.m3u8";
  const master = '#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",DEFAULT=YES,URI="audio.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nlow.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=5000,AUDIO="audio"\nhigh.m3u8\n';
  assert.equal(selectHlsVariant(master)?.uri, "high.m3u8");
  const mock = fileDriver({
    [root]: master,
    "https://media.test/high.m3u8": "#EXTM3U\n#EXTINF:3,\nv.ts\n#EXT-X-ENDLIST",
    "https://media.test/audio.m3u8": "#EXTM3U\n#EXTINF:3,\na.aac\n#EXT-X-ENDLIST",
  });
  assert.equal(await downloadOfflineHls(root, "data/master.m3u8", mock.driver), 200);
  const local = mock.files.get("data/master.m3u8")!;
  assert.match(local, /master.m3u8.assets\/audio-0-0-\d+.m3u8/);
  assert.match(local, /master.m3u8.assets\/video-0-\d+.m3u8/);
  assert.ok(!local.includes("low.m3u8"));
});

test("nested audio and video masters receive distinct local playlist names", async () => {
  const root = "https://media.test/master.m3u8";
  const mock = fileDriver({
    [root]: '#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",URI="audio/master.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=5000,AUDIO="audio"\nvideo/master.m3u8\n',
    "https://media.test/audio/master.m3u8": "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=100\na.m3u8\n",
    "https://media.test/video/master.m3u8": "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=5000\nv.m3u8\n",
    "https://media.test/audio/a.m3u8": "#EXTM3U\n#EXTINF:3,\na.aac\n#EXT-X-ENDLIST",
    "https://media.test/video/v.m3u8": "#EXTM3U\n#EXTINF:3,\nv.ts\n#EXT-X-ENDLIST",
  });
  await downloadOfflineHls(root, "data/master.m3u8", mock.driver);
  const children = [...mock.files.keys()].filter((path) => /video-1-\d+\.m3u8$/.test(path));
  assert.equal(children.length, 2);
  assert.notEqual(mock.files.get(children[0]), mock.files.get(children[1]));
});

test("invalid/live HLS is not registered as a fake offline video and partial files are removed", async () => {
  const url = "https://media.test/live.m3u8";
  const mock = fileDriver({ [url]: "#EXTM3U\n#EXTINF:3,\nsegment.ts" });
  await assert.rejects(downloadOfflineHls(url, "data/live.m3u8", mock.driver), /broadcast ends/);
  assert.deepEqual(mock.removed, ["data/live.m3u8.assets"]);
  assert.equal(mock.files.size, 0);
});