import assert from "node:assert/strict";
import test from "node:test";
import {
  computeBreakdown,
  computeDirectCheckout,
  computeVideoPurchaseSplit,
  MIN_PAYOUT,
} from "./payout-math";

test("direct checkout adds a 2% gateway fee without reducing the creator split", () => {
  assert.deepEqual(computeDirectCheckout(500), {
    basePrice: 500,
    gatewayFee: 10,
    buyerTotal: 510,
    platformShare: 75,
    creatorShare: 425,
  });
});

test("ads and direct sales use their configured creator shares", () => {
  const breakdown = computeBreakdown({ ads: 1000, course: 500, vip: 250 });
  assert.equal(breakdown.creatorBySource.ads, 700);
  assert.equal(breakdown.creatorBySource.course, 425);
  assert.equal(breakdown.creatorBySource.vip, 212.5);
  assert.equal(breakdown.creatorShare, 1337.5);
  assert.equal(breakdown.tds, 13.38);
  assert.equal(breakdown.net, 1324.12);
  assert.equal(MIN_PAYOUT, 5000);
});

test("paid video purchases split the creator price 85/15", () => {
  assert.deepEqual(computeVideoPurchaseSplit(199), {
    totalAmount: 199,
    platformFee: 29.85,
    creatorShare: 169.15,
  });
});