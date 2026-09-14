import { t as computeBreakdown } from "./payout-math-C0joRY5F.mjs";
import { r as createServerFn } from "./server-CD8TLzLk.mjs";
import { i as stringType, r as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-klFQ6rLm.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DoF9nRTz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payouts.functions-B8YxZD2u.js
var emptyGross = () => ({
	ads: 0,
	course: 0,
	vip: 0
});
/** Creates a payout statement from all pending (unpaid) creator earnings. */
var processPayout_createServerFn_handler = createServerRpc({
	id: "d059934d16b4585265aaceb94c0e0d94a9850b79f43f9c48c5041edea075295d",
	name: "processPayout",
	filename: "src/lib/payouts.functions.ts"
}, (opts) => processPayout.__executeServer(opts));
var processPayout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(processPayout_createServerFn_handler, async ({ context }) => {
	const { supabase, userId } = context;
	const db = supabase;
	const { data: earnings, error } = await db.from("creator_earnings").select("id, source, gross_amount").eq("user_id", userId).is("payout_id", null);
	if (error) throw new Error(error.message);
	const bySource = emptyGross();
	for (const row of earnings ?? []) {
		const key = row.source;
		if (key in bySource) bySource[key] += Number(row.gross_amount ?? 0);
	}
	const breakdown = computeBreakdown(bySource);
	if (breakdown.net < 5e3) throw new Error("Minimum balance to withdraw instantly is ₹5,000");
	const { data: details } = await db.from("creator_payout_details").select("pan_number").eq("user_id", userId).maybeSingle();
	const statementId = `YW-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
	const { supabaseAdmin } = await import("./client.server-D2WycheG.mjs");
	const { data: payout, error: insErr } = await supabaseAdmin.from("creator_payouts").insert({
		user_id: userId,
		statement_id: statementId,
		gross_amount: breakdown.gross,
		gst_amount: breakdown.gst,
		platform_share: breakdown.platformShare,
		tds_amount: breakdown.tds,
		net_amount: breakdown.net,
		ads_gross: bySource.ads,
		course_gross: bySource.course,
		vip_gross: bySource.vip,
		pan_number: details?.pan_number ?? null,
		status: "processing"
	}).select("*").single();
	if (insErr) throw new Error(insErr.message);
	const ids = (earnings ?? []).map((e) => e.id);
	if (ids.length) await supabaseAdmin.from("creator_earnings").update({ payout_id: payout.id }).in("id", ids);
	return {
		payout,
		breakdown
	};
});
var emailPayoutInvoice_createServerFn_handler = createServerRpc({
	id: "0bc69dbdfcd8d3676c2cd7c4e836bdf5e7e5aeeebcb10ef5c6378d4a92acaf6a",
	name: "emailPayoutInvoice",
	filename: "src/lib/payouts.functions.ts"
}, (opts) => emailPayoutInvoice.__executeServer(opts));
var emailPayoutInvoice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	payoutId: stringType().uuid(),
	to: stringType().email(),
	statementId: stringType().min(3).max(64),
	pdfBase64: stringType().min(100)
}).parse(d)).handler(emailPayoutInvoice_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-D2WycheG.mjs");
	const pdfBytes = Buffer.from(data.pdfBase64, "base64");
	const { error: uploadError } = await supabaseAdmin.storage.from("monetization").upload(`${context.userId}/${data.statementId}-payout-statement.pdf`, pdfBytes, {
		contentType: "application/pdf",
		upsert: true
	});
	if (uploadError) return {
		sent: false,
		reason: `Invoice storage failed: ${uploadError.message}`
	};
	const apiKey = process.env["RESEND_API_KEY"];
	if (!apiKey) return {
		sent: false,
		reason: "Invoice saved. Email service is not connected yet."
	};
	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"content-type": "application/json"
		},
		body: JSON.stringify({
			from: "YourWorld Payouts <onboarding@resend.dev>",
			to: [data.to],
			bcc: ["yourworld2029@gmail.com"],
			subject: `Payout Statement & Tax Invoice — ${data.statementId}`,
			html: `<p>Hi,</p><p>Your payout has been processed. Your Payout Statement &amp; Tax Invoice (${data.statementId}) is attached as a PDF.</p><p>Form 16A will be available in your Wallet section at the end of the financial quarter.</p><p>— YourWorld</p>`,
			attachments: [{
				filename: `${data.statementId}-payout-statement.pdf`,
				content: data.pdfBase64
			}]
		})
	});
	if (!res.ok) {
		console.error("Resend email failed", res.status, await res.text());
		return {
			sent: false,
			reason: "Could not send the invoice email."
		};
	}
	const { error: statusError } = await supabaseAdmin.from("creator_payouts").update({
		email_sent: true,
		status: "paid"
	}).eq("id", data.payoutId).eq("user_id", context.userId);
	if (statusError) return {
		sent: false,
		reason: `Invoice sent, but payout status update failed: ${statusError.message}`
	};
	return { sent: true };
});
//#endregion
export { emailPayoutInvoice_createServerFn_handler, processPayout_createServerFn_handler };
