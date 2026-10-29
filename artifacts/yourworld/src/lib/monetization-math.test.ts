import assert from "node:assert/strict";
import test from "node:test";
import {
  computeBreakdown,
  computeDirectCheckout,
  computeVideoPurchaseSplit,
  earningsForCurrency,
  formatPayoutAmount,
  isUnitedStatesPayoutCountry,
  meetsMonetizationTargets,
  minimumPayout,
  MIN_PAYOUT,
  payoutCurrencyForCountry,
} from "./payout-math";

test("direct checkout uses the 80/20 share and adds a separate 2% gateway fee", () => {
  assert.deepEqual(computeDirectCheckout(500), {
    basePrice: 500,
    gatewayFee: 10,
    buyerTotal: 510,
    platformShare: 100,
    creatorShare: 400,
  });
});

test("ads and direct sales use their configured creator shares", () => {
  const breakdown = computeBreakdown({ ads: 1000, course: 500, vip: 250 });
  assert.equal(breakdown.creatorBySource.ads, 700);
  assert.equal(breakdown.creatorBySource.course, 400);
  assert.equal(breakdown.creatorBySource.vip, 200);
  assert.equal(breakdown.creatorShare, 1300);
  assert.equal(breakdown.tds, 13);
  assert.equal(breakdown.net, 1287);
  assert.equal(MIN_PAYOUT, 5000);
});

test("paid video purchases preserve the full 20% platform cut", () => {
  assert.deepEqual(computeVideoPurchaseSplit(199), {
    totalAmount: 199,
    platformFee: 39.8,
    gatewayFee: 4.7,
    creatorPayout: 154.5,
    estimatedCreatorNet: 155,
  });
});

test("paid video purchases use an actual gateway fee when supplied", () => {
  assert.deepEqual(computeVideoPurchaseSplit(199, 3.5), {
    totalAmount: 199,
    platformFee: 39.8,
    gatewayFee: 3.5,
    creatorPayout: 155.7,
    estimatedCreatorNet: 155,
  });
});

test("monetization eligibility requires followers, watch hours, and views together", () => {
  const targets = { followers: 15000, watchHours: 2500, videoViews: 150000 };
  assert.equal(
    meetsMonetizationTargets(
      { followers: 15000, watchHours: 2500, videoViews: 150000 },
      targets,
    ),
    true,
  );
  assert.equal(
    meetsMonetizationTargets(
      { followers: 15000, watchHours: 2500, videoViews: 149999 },
      targets,
    ),
    false,
  );
  assert.equal(
    meetsMonetizationTargets(
      { followers: 15000, watchHours: 2499, videoViews: 150000 },
      targets,
    ),
    false,
  );
});

test("payout threshold and currency follow the saved profile country", () => {
  assert.equal(payoutCurrencyForCountry("India"), "INR");
  assert.equal(payoutCurrencyForCountry("Kenya"), "USD");
  assert.equal(payoutCurrencyForCountry(""), "INR");
  assert.equal(minimumPayout("INR"), 5000);
  assert.equal(minimumPayout("USD"), 70);
  assert.equal(isUnitedStatesPayoutCountry("United States"), true);
  assert.equal(isUnitedStatesPayoutCountry("USA"), true);
  assert.equal(isUnitedStatesPayoutCountry("United Kingdom"), false);
  assert.match(formatPayoutAmount(70, "USD"), /\$70\.00/);
  assert.match(formatPayoutAmount(5000, "INR"), /₹5,000\.00/);
});

test("wallet balance includes only the saved country's currency", () => {
  const rows = [
    { id: "usd", currency: "USD" },
    { id: "inr", currency: "INR" },
    { id: "legacy", currency: null },
  ];
  assert.deepEqual(
    earningsForCurrency(rows, "USD").map((row) => row.id),
    ["usd"],
  );
  assert.deepEqual(
    earningsForCurrency(rows, "INR").map((row) => row.id),
    ["inr", "legacy"],
  );
  assert.doesNotMatch(formatPayoutAmount(70, "USD"), /₹/);
  assert.doesNotMatch(formatPayoutAmount(5000, "INR"), /\$/);
});