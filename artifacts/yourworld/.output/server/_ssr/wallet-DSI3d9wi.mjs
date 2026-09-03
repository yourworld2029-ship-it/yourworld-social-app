import { o as __toESM } from "../_runtime.mjs";
import { n as inr, t as computeBreakdown } from "./payout-math-C0joRY5F.mjs";
import { t as supabase } from "./client-DidqkCgA.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Fn as ArrowLeft, jt as LoaderCircle, nn as Download, s as Wallet, sn as Coins } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { E as useAuth } from "./router-Dp51FPat.mjs";
import { r as createServerFn } from "./server-BhgJePod.mjs";
import { i as stringType, r as objectType } from "../_libs/zod.mjs";
import { t as useServerFn } from "./useServerFn-Dd5awcbP.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C6e3yEU_.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-CzgVVP6N.mjs";
import { t as require_jspdf_node_min } from "../_libs/jspdf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallet-DSI3d9wi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_jspdf_node_min = require_jspdf_node_min();
/** Builds the "Payout Statement & Tax Invoice" PDF. Returns the jsPDF doc. */
function buildPayoutPdf(info, b) {
	const doc = new import_jspdf_node_min.jsPDF({
		unit: "pt",
		format: "a4"
	});
	const W = doc.internal.pageSize.getWidth();
	const M = 40;
	let y = 50;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(20);
	doc.text("YourWorld", M, y);
	doc.setFontSize(11);
	doc.setFont("helvetica", "normal");
	doc.text("Payout Statement & Tax Invoice", W - M, y, { align: "right" });
	y += 14;
	doc.setFontSize(9);
	doc.setTextColor(110);
	doc.text("YourWorld Creator Payouts · support: Yourworld2029@gmail.com", M, y);
	doc.setTextColor(0);
	y += 16;
	doc.setDrawColor(210);
	doc.line(M, y, W - M, y);
	y += 22;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(11);
	doc.text("Creator Details", M, y);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(10);
	const rows = [
		["Name", info.creatorName],
		["Username", info.username],
		["Email", info.email],
		["PAN", info.pan || "—"],
		["Statement ID", info.statementId],
		["Date", info.date]
	];
	y += 6;
	rows.forEach(([k, v]) => {
		y += 15;
		doc.setTextColor(110);
		doc.text(`${k}`, M, y);
		doc.setTextColor(0);
		doc.text(String(v), 150, y);
	});
	y += 28;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(11);
	doc.text("Financial Summary", M, y);
	y += 12;
	const tableRows = [
		["Gross Deal Value (Ads & Brand)", inr(b.bySource.ads)],
		["Gross Course Sales", inr(b.bySource.course)],
		["Gross VIP Memberships", inr(b.bySource.vip)],
		[
			"Total Gross Value",
			inr(b.gross),
			true
		],
		["GST @ 18% (on gross)", inr(b.gst)],
		["Platform Share Deduction (30% Ads / 15% Courses & VIP)", `- ${inr(b.platformShare)}`],
		[
			"Creator Share",
			inr(b.creatorShare),
			true
		],
		["TDS @ 1% (Sec 194J)", `- ${inr(b.tds)}`],
		[
			"Final Net Credited Amount",
			inr(b.net),
			true
		]
	];
	doc.setFontSize(10);
	tableRows.forEach(([label, value, strong]) => {
		y += 20;
		if (strong) {
			doc.setFillColor(243, 244, 246);
			doc.rect(M, y - 13, W - 80, 18, "F");
			doc.setFont("helvetica", "bold");
		} else doc.setFont("helvetica", "normal");
		doc.text(label, 46, y);
		doc.text(value, W - M - 6, y, { align: "right" });
	});
	y += 32;
	const noteLines = doc.splitTextToSize(`Tax Certificate Note: TDS of ${inr(b.tds)} has been deposited to the Income Tax Department against your PAN ${info.pan || "—"}. Form 16A will be made available in your Wallet section at the end of the financial quarter for your ITR filing.`, W - 80 - 24);
	const boxH = noteLines.length * 14 + 24;
	doc.setFillColor(255, 247, 224);
	doc.setDrawColor(240, 200, 120);
	doc.roundedRect(M, y, W - 80, boxH, 6, 6, "FD");
	doc.setFont("helvetica", "normal");
	doc.setFontSize(10);
	doc.setTextColor(90, 60, 0);
	doc.text(noteLines, 52, y + 18);
	doc.setTextColor(0);
	y += boxH + 26;
	doc.setFontSize(8);
	doc.setTextColor(130);
	doc.text("This is a system-generated statement and does not require a signature.", M, y);
	return doc;
}
function payoutPdfBase64(info, b) {
	const out = buildPayoutPdf(info, b).output("datauristring");
	return out.slice(out.indexOf(",") + 1);
}
function downloadPayoutPdf(info, b) {
	buildPayoutPdf(info, b).save(`${info.statementId}-payout-statement.pdf`);
}
/** Creates a payout statement from all pending (unpaid) creator earnings. */
var processPayout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("d059934d16b4585265aaceb94c0e0d94a9850b79f43f9c48c5041edea075295d"));
/** Emails the generated payout PDF to the creator's registered address. */
var emailPayoutInvoice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
	payoutId: stringType().uuid(),
	to: stringType().email(),
	statementId: stringType().min(3).max(64),
	pdfBase64: stringType().min(100)
}).parse(d)).handler(createSsrRpc("0bc69dbdfcd8d3676c2cd7c4e836bdf5e7e5aeeebcb10ef5c6378d4a92acaf6a"));
var MIN_WITHDRAW = 5e3;
var REQ = {
	followers: 700,
	watchHours: 2500,
	reelViews: 5e4
};
var emptyDetails = {
	creator_email: "",
	upi_id: "",
	bank_account: "",
	ifsc_code: "",
	account_holder: "",
	pan_number: ""
};
function WalletPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const runPayout = useServerFn(processPayout);
	const sendInvoice = useServerFn(emailPayoutInvoice);
	const [gross, setGross] = (0, import_react.useState)({
		ads: 0,
		course: 0,
		vip: 0
	});
	const [details, setDetails] = (0, import_react.useState)(emptyDetails);
	const [schedule, setSchedule] = (0, import_react.useState)("15");
	const [eligible, setEligible] = (0, import_react.useState)(false);
	const [simulate, setSimulate] = (0, import_react.useState)(false);
	const [stats, setStats] = (0, import_react.useState)({
		followers: 0,
		watchHours: 0,
		reelViews: 0
	});
	const [profile, setProfile] = (0, import_react.useState)({
		display_name: "",
		username: ""
	});
	const [payouts, setPayouts] = (0, import_react.useState)([]);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [processing, setProcessing] = (0, import_react.useState)(false);
	const [applying, setApplying] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const uid = user?.id;
		if (!uid) return;
		let alive = true;
		(async () => {
			const [{ data: earnings }, { data: det }, { data: prof }, { data: hist }, { data: counts }, { data: myPosts }] = await Promise.all([
				supabase.from("creator_earnings").select("source, gross_amount").eq("user_id", uid).is("payout_id", null),
				supabase.from("creator_payout_details").select("*").eq("user_id", uid).maybeSingle(),
				supabase.from("profiles").select("display_name, username").eq("id", uid).maybeSingle(),
				supabase.from("creator_payouts").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
				supabase.from("follow_counts").select("followers").eq("user_id", uid).maybeSingle(),
				supabase.from("posts").select("kind, views, duration_seconds").eq("user_id", uid)
			]);
			if (!alive) return;
			const next = {
				ads: 0,
				course: 0,
				vip: 0
			};
			for (const row of earnings ?? []) {
				const key = row.source;
				if (key in next) next[key] += Number(row.gross_amount ?? 0);
			}
			setGross(next);
			if (det) {
				setDetails({
					creator_email: det.creator_email ?? "",
					upi_id: det.upi_id ?? "",
					bank_account: det.bank_account ?? "",
					ifsc_code: det.ifsc_code ?? "",
					account_holder: det.account_holder ?? "",
					pan_number: det.pan_number ?? ""
				});
				setSchedule(det.payout_schedule === "30" ? "30" : "15");
				setEligible(Boolean(det.monetization_eligible));
			} else setDetails((d) => ({
				...d,
				creator_email: user?.email ?? ""
			}));
			setProfile({
				display_name: prof?.display_name ?? "",
				username: prof?.username ?? ""
			});
			setPayouts(hist ?? []);
			let watchSeconds = 0;
			let reelViews = 0;
			for (const p of myPosts ?? []) {
				const views = Number(p.views ?? 0);
				if (p.kind === "video") watchSeconds += views * Number(p.duration_seconds ?? 0);
				else if (p.kind === "reel" || p.kind === "short") reelViews += views;
			}
			setStats({
				followers: Number(counts?.followers ?? 0),
				watchHours: Math.round(watchSeconds / 3600),
				reelViews
			});
		})();
		return () => {
			alive = false;
		};
	}, [user?.id, user?.email]);
	const b = computeBreakdown(gross);
	const showWallet = eligible || simulate;
	const canApply = stats.followers >= REQ.followers && (stats.watchHours >= REQ.watchHours || stats.reelViews >= REQ.reelViews);
	const statementInfo = (p) => ({
		statementId: p.statement_id,
		date: new Date(p.created_at).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		}),
		creatorName: details.account_holder || profile.display_name || "Creator",
		username: profile.username ? `@${profile.username}` : "—",
		email: details.creator_email || user?.email || "—",
		pan: p.pan_number || details.pan_number || ""
	});
	const saveDetails = async () => {
		if (!user?.id) return;
		setSaving(true);
		const { error } = await supabase.from("creator_payout_details").upsert({
			user_id: user.id,
			...details,
			payout_schedule: schedule
		}, { onConflict: "user_id" });
		setSaving(false);
		if (error) toast.error(error.message);
		else toast.success("Payout details saved");
	};
	const applyForMonetization = async () => {
		if (!user?.id || !canApply) return;
		setApplying(true);
		const { error } = await supabase.from("creator_payout_details").upsert({
			user_id: user.id,
			...details,
			payout_schedule: schedule,
			monetization_eligible: true
		}, { onConflict: "user_id" });
		setApplying(false);
		if (error) return toast.error(error.message);
		setEligible(true);
		toast.success("Monetization unlocked — welcome to the program!");
	};
	const withdraw = async () => {
		if (!details.creator_email && !user?.email) {
			toast.error("Add your creator email before requesting a payout");
			return;
		}
		setProcessing(true);
		try {
			const payout = (await runPayout({})).payout;
			setPayouts((p) => [payout, ...p]);
			setGross({
				ads: 0,
				course: 0,
				vip: 0
			});
			const pdfBase64 = payoutPdfBase64(statementInfo(payout), computeBreakdown({
				ads: Number(payout.ads_gross),
				course: Number(payout.course_gross),
				vip: Number(payout.vip_gross)
			}));
			const mail = await sendInvoice({ data: {
				payoutId: payout.id,
				to: details.creator_email || user.email,
				statementId: payout.statement_id,
				pdfBase64
			} });
			if (mail.sent) toast.success("Payout processed — invoice emailed to you");
			else toast.success(`Payout processed. ${mail.reason ?? ""} Download the PDF below.`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Payout failed");
		} finally {
			setProcessing(false);
		}
	};
	const trackers = [
		{
			label: "Followers",
			value: stats.followers,
			target: REQ.followers,
			unit: "Followers"
		},
		{
			label: "Watch Hours",
			value: stats.watchHours,
			target: REQ.watchHours,
			unit: "Hours"
		},
		{
			label: "Reels / Shorts Views",
			value: stats.reelViews,
			target: REQ.reelViews,
			unit: "Views"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] pb-16 font-sans text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-800 bg-[#09090b]/90 px-4 py-3 backdrop-blur",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => navigate({ to: "/settings" }),
				"aria-label": "Back to settings",
				className: "p-1 text-zinc-300 hover:text-white",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-bold",
				children: "Monetization & Wallet"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#141418] px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: "Simulate Eligible Creator"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-zinc-500",
					children: "Preview the tracker and wallet views"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					role: "switch",
					"aria-checked": simulate,
					"aria-label": "Simulate eligible creator",
					onClick: () => setSimulate((s) => !s),
					className: `relative h-6 w-11 rounded-full transition-colors ${simulate ? "bg-indigo-500" : "bg-zinc-700"}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${simulate ? "left-[22px]" : "left-0.5"}` })
				})]
			}), !showWallet ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#17171c] to-[#101014] p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-semibold uppercase tracking-wide text-zinc-400",
						children: "Monetization Eligibility Tracker"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pt-2 text-sm text-zinc-300",
						children: [
							"Reach ",
							REQ.followers.toLocaleString("en-IN"),
							" followers and either",
							" ",
							REQ.watchHours.toLocaleString("en-IN"),
							" watch hours or",
							" ",
							REQ.reelViews.toLocaleString("en-IN"),
							" reels views to join the program."
						]
					})]
				}),
				trackers.map((t) => {
					const pct = Math.min(100, Math.round(t.value / t.target * 100));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: t.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] text-zinc-400",
									children: [
										t.value.toLocaleString("en-IN"),
										" / ",
										t.target.toLocaleString("en-IN"),
										" ",
										t.unit
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 h-2 overflow-hidden rounded-full bg-zinc-800",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-indigo-500 transition-[width] duration-700 ease-out",
									style: { width: `${pct}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "pt-1.5 text-[10px] text-zinc-500",
								children: [pct, "% complete"]
							})
						]
					}, t.label);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: applyForMonetization,
					disabled: !canApply || applying,
					className: "w-full rounded-full bg-indigo-500 py-3 text-sm font-semibold disabled:opacity-50",
					children: applying ? "Applying…" : "Apply for Monetization Program"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-bold",
						children: "Available from Day 1"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-1.5 text-[11px] leading-relaxed text-zinc-500",
						children: "Paid Courses, Single Video Paywalls and VIP Memberships are open to every creator — no eligibility required. Ad revenue payouts unlock after you join the program."
					})]
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#17171c] to-[#101014] p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-zinc-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-semibold uppercase tracking-wide",
								children: "Total Earnings (Net Creator Share)"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-2 text-3xl font-extrabold",
							children: inr(b.creatorShare)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "pt-1 text-[11px] text-zinc-500",
							children: ["Withdrawable after 1% TDS: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-zinc-300",
								children: inr(b.net)
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "grid grid-cols-3 gap-3",
					children: [
						{
							label: "Ad & Brand Deals",
							v: b.creatorBySource.ads
						},
						{
							label: "Course Sales",
							v: b.creatorBySource.course
						},
						{
							label: "VIP Memberships",
							v: b.creatorBySource.vip
						}
					].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-zinc-800 bg-[#141418] p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-semibold uppercase tracking-wide text-zinc-500",
							children: c.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-1.5 text-sm font-bold",
							children: inr(c.v)
						})]
					}, c.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-bold",
							children: "Payout & Bank Details"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2.5 pt-3",
							children: [[
								[
									"creator_email",
									"Creator Email ID",
									"you@gmail.com"
								],
								[
									"upi_id",
									"UPI ID",
									"name@upi"
								],
								[
									"bank_account",
									"Bank Account Number",
									"Account number"
								],
								[
									"ifsc_code",
									"IFSC Code",
									"IFSC0000000"
								],
								[
									"account_holder",
									"Account Holder Name",
									"Full name as per bank"
								],
								[
									"pan_number",
									"PAN Card Number",
									"ABCDE1234F"
								]
							].map(([key, label, ph]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-[11px] text-zinc-500",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: details[key],
									onChange: (e) => setDetails((d) => ({
										...d,
										[key]: e.target.value
									})),
									placeholder: ph,
									className: "w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
								})]
							}, key)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-[11px] text-zinc-500",
									children: "Auto-Payout Schedule"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: schedule,
									onChange: (e) => setSchedule(e.target.value),
									className: "w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none focus:border-zinc-600",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "15",
										children: "Every 15 Days"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "30",
										children: "Every 30 Days"
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: saveDetails,
							disabled: saving,
							className: "mt-3 w-full rounded-full bg-white py-2.5 text-sm font-semibold text-black disabled:opacity-60",
							children: saving ? "Saving…" : "Save Details"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: withdraw,
					disabled: processing || b.net < MIN_WITHDRAW,
					className: "flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 py-3 text-sm font-semibold disabled:opacity-50",
					children: [processing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "animate-spin",
						size: 16
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { size: 16 }), processing ? "Processing payout…" : `Withdraw Balance (${inr(b.net)})`]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "pt-2 text-center text-[11px] text-zinc-500",
					children: b.net < MIN_WITHDRAW ? "Minimum balance to withdraw instantly is ₹5,000" : `Instant transfer to your UPI / bank. Auto-payout every ${schedule} days.`
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-bold",
							children: "Payout History"
						}),
						payouts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-2 text-[11px] text-zinc-500",
							children: "No payouts yet. Your statements and Form 16A certificates will appear here."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-zinc-800/80 pt-1",
							children: payouts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-semibold",
										children: inr(Number(p.net_amount))
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate text-[11px] text-zinc-500",
										children: [
											p.statement_id,
											" ·",
											" ",
											new Date(p.created_at).toLocaleDateString("en-IN", {
												day: "2-digit",
												month: "short",
												year: "numeric"
											}),
											" ",
											"· ",
											p.status
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => downloadPayoutPdf(statementInfo(p), computeBreakdown({
										ads: Number(p.ads_gross),
										course: Number(p.course_gross),
										vip: Number(p.vip_gross)
									})),
									className: "flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold hover:bg-zinc-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 13 }), " PDF"]
								})]
							}, p.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-3 text-[10px] leading-relaxed text-zinc-500",
							children: "Form 16A tax certificates are issued against your PAN at the end of each financial quarter and will be listed in this section."
						})
					]
				})
			] })]
		})]
	});
}
//#endregion
export { WalletPage as component };
