//#region node_modules/.nitro/vite/services/ssr/assets/payout-math-C0joRY5F.js
/** Shared revenue-share and tax rules for the Monetization & Wallet dashboard. */
var CREATOR_SHARE = {
	ads: .7,
	course: .85,
	vip: .85
};
var GST_RATE = .18;
var TDS_RATE = .01;
var round2 = (n) => Math.round(n * 100) / 100;
function computeBreakdown(bySource) {
	const creatorBySource = {
		ads: round2(bySource.ads * CREATOR_SHARE.ads),
		course: round2(bySource.course * CREATOR_SHARE.course),
		vip: round2(bySource.vip * CREATOR_SHARE.vip)
	};
	const gross = round2(bySource.ads + bySource.course + bySource.vip);
	const creatorShare = round2(creatorBySource.ads + creatorBySource.course + creatorBySource.vip);
	const platformShare = round2(gross - creatorShare);
	const gst = round2(gross * GST_RATE);
	const tds = round2(creatorShare * TDS_RATE);
	return {
		gross,
		gst,
		platformShare,
		creatorShare,
		tds,
		net: round2(creatorShare - tds),
		bySource,
		creatorBySource
	};
}
var inr = (n) => `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
})}`;
//#endregion
export { inr as n, computeBreakdown as t };
