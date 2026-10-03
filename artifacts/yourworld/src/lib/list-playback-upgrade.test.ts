import assert from "node:assert/strict";
import test from "node:test";
import { AuxiliaryVideoSlot } from "./auxiliary-video";
import { centeredCandidate } from "./feed-center-selection";
import { cloudflareStreamPosterUrl } from "./cloudflare-stream-media";
import { canReadPublicVideoPreview } from "./video-preview-access";

test("closest centered card wins even when the previous card remains visible", () => {
  const card = (top: number, bottom: number, order: number) => ({
    order, element: { getBoundingClientRect: () => ({ top, bottom }) as DOMRect },
  });
  const previous = card(0, 300, 0);
  const centered = card(350, 650, 1);
  assert.equal(centeredCandidate([previous, centered], 1000), centered);
  assert.equal(centeredCandidate([], 1000), null);
});

test("one auxiliary slot revokes a preload before allocating a first-frame probe", () => {
  const slot = new AuxiliaryVideoSlot();
  const preloader = {}, probe = {}, another = {};
  let live = 1;
  const releaseOld = slot.acquire(preloader, 0, () => { live -= 1; });
  assert.ok(releaseOld);
  assert.equal(slot.acquire(another, 0, () => {}), null);
  const releaseProbe = slot.acquire(probe, 1, () => { live -= 1; });
  assert.ok(releaseProbe);
  assert.equal(live, 0, "the old decoder must be destroyed synchronously");
  live += 1;
  releaseOld();
  assert.equal(slot.acquire(another, 0, () => {}), null, "stale releases cannot free an occupied slot");
  releaseProbe();
  assert.ok(slot.acquire(another, 0, () => {}));
});

test("Cloudflare posters request authentic first-second frames at height 720", () => {
  assert.equal(cloudflareStreamPosterUrl(null, "0123456789abcdef0123456789abcdef"),
    "https://videodelivery.net/0123456789abcdef0123456789abcdef/thumbnails/thumbnail.jpg?time=1s&height=720");
});

test("poster probes and next preloads never resolve explicitly protected source bytes", () => {
  assert.equal(canReadPublicVideoPreview({}), true);
  assert.equal(canReadPublicVideoPreview({ video_access: "public", price: 0 }), true);
  for (const post of [{ video_access: "paid" }, { video_access: "vip" }, { is_paid: true },
    { price: 1 }, { audience: "close_friends" }]) {
    assert.equal(canReadPublicVideoPreview(post), false);
  }
});