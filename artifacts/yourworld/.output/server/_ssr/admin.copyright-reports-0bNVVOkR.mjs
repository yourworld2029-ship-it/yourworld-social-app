import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { R as ShieldAlert, S as Trash2, Ut as ExternalLink, rn as CircleX, wn as ArrowLeft } from "../_libs/lucide-react.mjs";
import { m as useAuth } from "./router-DO0psBY1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.copyright-reports-0bNVVOkR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminCopyrightReports() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [isAdmin, setIsAdmin] = (0, import_react.useState)(null);
	const [reports, setReports] = (0, import_react.useState)([]);
	const [media, setMedia] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		(async () => {
			if (!user) {
				setIsAdmin(false);
				return;
			}
			const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
			if (!alive) return;
			setIsAdmin(!!data && data.length > 0);
		})();
		return () => {
			alive = false;
		};
	}, [user]);
	const load = import_react.useCallback(async () => {
		const { data, error } = await supabase.from("copyright_reports").select("*").order("created_at", { ascending: false }).limit(200);
		if (error) return;
		const rows = data ?? [];
		setReports(rows);
		const next = {};
		await Promise.all(rows.map(async (r) => {
			if (r.reported_post_id) {
				const { data: p } = await supabase.from("posts").select("media_url, media_type, caption").eq("id", r.reported_post_id).maybeSingle();
				if (p) next[r.id] = {
					url: p.media_url,
					type: p.media_type,
					caption: p.caption
				};
			} else if (r.reported_moment_id) {
				const { data: m } = await supabase.from("moments").select("media_url, media_type, text").eq("id", r.reported_moment_id).maybeSingle();
				if (m) next[r.id] = {
					url: m.media_url,
					type: m.media_type,
					caption: m.text
				};
			}
		}));
		setMedia(next);
	}, []);
	(0, import_react.useEffect)(() => {
		if (isAdmin) load();
	}, [isAdmin, load]);
	const approve = async (r) => {
		setBusy(r.id);
		try {
			if (r.reported_post_id) {
				const { error } = await supabase.from("posts").delete().eq("id", r.reported_post_id);
				if (error) throw error;
			} else if (r.reported_moment_id) {
				const { error } = await supabase.from("moments").delete().eq("id", r.reported_moment_id);
				if (error) throw error;
			}
			const { error } = await supabase.from("copyright_reports").update({
				status: "resolved",
				resolved_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", r.id);
			if (error) throw error;
			toast.success("Media removed and report resolved");
			await load();
		} catch {
			toast.error("Could not complete the takedown");
		} finally {
			setBusy(null);
		}
	};
	const reject = async (r) => {
		setBusy(r.id);
		const { error } = await supabase.from("copyright_reports").update({
			status: "rejected",
			reporter_flagged: true,
			resolved_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", r.id);
		setBusy(null);
		if (error) {
			toast.error("Could not reject the report");
			return;
		}
		toast.success("Report dismissed and reporter flagged for spam");
		await load();
	};
	if (isAdmin === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#09090b] p-6 text-sm text-zinc-400",
		children: "Loading…"
	});
	if (!isAdmin) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#09090b] p-6 text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-md rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
					className: "mx-auto mb-3 text-red-500",
					size: 28
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-bold",
					children: "Admins only"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-zinc-400",
					children: "You do not have access to the DMCA dashboard."
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] p-4 text-white",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 mt-2 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => navigate({ to: "/settings" }),
					className: "p-1 text-zinc-300 hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold",
					children: "DMCA Reports"
				})]
			}),
			reports.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-sm text-zinc-400",
				children: "No copyright reports yet."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: reports.map((r) => {
					const m = media[r.id];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `rounded-full px-2 py-0.5 font-semibold ${r.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" : r.status === "rejected" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`,
										children: r.status
									}),
									r.reporter_flagged && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-red-500/15 px-2 py-0.5 font-semibold text-red-400",
										children: "spam flagged"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(r.created_at).toLocaleString() })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-zinc-800 bg-zinc-900/60 p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-2 text-xs font-bold text-zinc-300",
											children: "Reported Media"
										}),
										m?.url ? m.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
											src: m.url,
											controls: true,
											className: "max-h-56 w-full rounded-lg bg-black"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: m.url,
											alt: "Reported media",
											className: "max-h-56 w-full rounded-lg object-contain"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-lg border border-dashed border-zinc-700 p-4 text-[11px] text-zinc-500",
											children: "Media preview unavailable"
										}),
										m?.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 line-clamp-3 text-[11px] text-zinc-400",
											children: m.caption
										}),
										r.infringing_content_link && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: r.infringing_content_link,
											target: "_blank",
											rel: "noreferrer noopener",
											className: "mt-2 inline-flex items-center gap-1 break-all text-[11px] text-indigo-400 hover:underline",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12 }),
												" ",
												r.infringing_content_link
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-zinc-800 bg-zinc-900/60 p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-2 text-xs font-bold text-zinc-300",
											children: "Reporter's Original Proof"
										}),
										r.original_work_link ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: r.original_work_link,
											target: "_blank",
											rel: "noreferrer noopener",
											className: "inline-flex items-center gap-1 break-all text-[11px] text-indigo-400 hover:underline",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12 }),
												" ",
												r.original_work_link
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-zinc-500",
											children: "No proof link provided"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
											className: "mt-3 space-y-1 text-[11px] text-zinc-400",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-zinc-500",
													children: "Name: "
												}), r.reporter_full_name || "—"] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-zinc-500",
													children: "Email: "
												}), r.contact_email || "—"] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "whitespace-pre-wrap",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-zinc-500",
														children: "Claim: "
													}), r.reason || "—"]
												})
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => approve(r),
									disabled: busy === r.id || r.status !== "pending",
									className: "inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 }), " Approve & Delete Media"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => reject(r),
									disabled: busy === r.id || r.status !== "pending",
									className: "inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { size: 16 }), " Reject Fake Report"]
								})]
							})
						]
					}, r.id);
				})
			})
		]
	});
}
//#endregion
export { AdminCopyrightReports as component };
