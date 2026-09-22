/** Shared revenue-share, checkout, and tax rules for monetization surfaces. */

export const CREATOR_SHARE = { ads: 0.7, course: 0.85, vip: 0.85 } as const;
export const PLATFORM_SHARE = { ads: 0.3, course: 0.15, vip: 0.15 } as const;
export const PAYMENT_GATEWAY_SURCHARGE_RATE = 0.02;
export const TDS_RATE = 0.01; // Section 194-O
export const MIN_PAYOUT = 5000;

export type EarningSource = keyof typeof CREATOR_SHARE;
export type GrossBySource = Record<EarningSource, number>;

export type PayoutBreakdown = {
  gross: number;
  gst: number;
  platformShare: number;
  creatorShare: number;
  tds: number;
  net: number;
  bySource: GrossBySource;
  creatorBySource: GrossBySource;
};

export type DirectCheckoutBreakdown = {
  basePrice: number;
  gatewayFee: number;
  buyerTotal: number;
  platformShare: number;
  creatorShare: number;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

export type VideoPurchaseSplit = {
  totalAmount: number;
  platformFee: number;
  creatorShare: number;
};

export function computeVideoPurchaseSplit(totalAmount: number): VideoPurchaseSplit {
  const total = round2(Math.max(0, Number(totalAmount) || 0));
  const platformFee = round2(total * PLATFORM_SHARE.course);
  return {
    totalAmount: total,
    platformFee,
    creatorShare: round2(total - platformFee),
  };
}

export function computeDirectCheckout(basePrice: number): DirectCheckoutBreakdown {
  const base = round2(Math.max(0, Number(basePrice) || 0));
  const gatewayFee = round2(base * PAYMENT_GATEWAY_SURCHARGE_RATE);
  return {
    basePrice: base,
    gatewayFee,
    buyerTotal: round2(base + gatewayFee),
    platformShare: round2(base * PLATFORM_SHARE.course),
    creatorShare: round2(base * CREATOR_SHARE.course),
  };
}

export function computeBreakdown(bySource: GrossBySource): PayoutBreakdown {
  const creatorBySource = {
    ads: round2(bySource.ads * CREATOR_SHARE.ads),
    course: round2(bySource.course * CREATOR_SHARE.course),
    vip: round2(bySource.vip * CREATOR_SHARE.vip),
  };
  const gross = round2(bySource.ads + bySource.course + bySource.vip);
  const creatorShare = round2(
    creatorBySource.ads + creatorBySource.course + creatorBySource.vip,
  );
  const platformShare = round2(
    bySource.ads * PLATFORM_SHARE.ads +
      bySource.course * PLATFORM_SHARE.course +
      bySource.vip * PLATFORM_SHARE.vip,
  );
  const tds = round2(creatorShare * TDS_RATE);
  return {
    gross,
    // Kept for compatibility with older statement rows; GST is not part of
    // the creator split or creator-facing dashboard.
    gst: 0,
    platformShare,
    creatorShare,
    tds,
    net: round2(creatorShare - tds),
    bySource,
    creatorBySource,
  };
}

export const inr = (n: number) =>
  `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;