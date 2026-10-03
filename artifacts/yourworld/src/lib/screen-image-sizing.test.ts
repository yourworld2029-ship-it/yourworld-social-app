import test from "node:test";
import assert from "node:assert/strict";
import { fitImageToScreen, imageHeaderDimensions } from "./screen-image-sizing";
import { releaseListVideo } from "./media-release";

test("4K landscape and portrait images fit the viewport without stretching", () => {
  assert.deepEqual(fitImageToScreen(3840, 2160, 360, 640), { width: 360, height: 203 });
  assert.deepEqual(fitImageToScreen(2160, 3840, 360, 640), { width: 360, height: 640 });
  assert.deepEqual(fitImageToScreen(300, 10000, 360, 640), { width: 19, height: 640 });
  assert.deepEqual(fitImageToScreen(100, 50, 360, 640), { width: 100, height: 50 });
});

test("PNG and JPEG dimensions are read without a full image decode", () => {
  const png = new ArrayBuffer(24);
  const view = new DataView(png);
  view.setUint32(0, 0x89504e47);
  view.setUint32(16, 3840);
  view.setUint32(20, 2160);
  assert.deepEqual(imageHeaderDimensions(png), { width: 3840, height: 2160 });
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0, 7, 8, 8, 0x70, 15, 0]).buffer;
  assert.deepEqual(imageHeaderDimensions(jpeg), { width: 3840, height: 2160 });
  assert.equal(imageHeaderDimensions(new ArrayBuffer(2)), null);
});

test("VP8X WebP dimensions are read without decode", () => {
  const buffer = new ArrayBuffer(30);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646);
  view.setUint32(8, 0x57454250);
  view.setUint32(12, 0x56503858);
  view.setUint8(24, 0xff); view.setUint8(25, 14);
  view.setUint8(27, 0x6f); view.setUint8(28, 8);
  assert.deepEqual(imageHeaderDimensions(buffer), { width: 3840, height: 2160 });
});

test("list video teardown pauses, removes sources and flushes the buffer", () => {
  const calls: string[] = [];
  const player = {
    pause: () => calls.push("pause"),
    set preload(value: string) { calls.push(`preload:${value}`); },
    setAttribute: (key: string, value: string) => calls.push(`${key}:${value}`),
    removeAttribute: (key: string) => calls.push(`remove:${key}`),
    querySelectorAll: () => [{ removeAttribute: (key: string) => calls.push(`child-remove:${key}`) }],
    load: () => calls.push("load"),
  } as unknown as HTMLVideoElement;
  releaseListVideo(player);
  assert.deepEqual(calls, ["pause", "preload:none", "src:", "remove:src", "child-remove:src", "load"]);
  releaseListVideo(null);
});