import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { Ct as LogOut, Tn as ArrowLeft, an as CircleQuestionMark, ct as Orbit, i as X, kt as Info, o as Wallet, p as User, st as Palette, un as ChevronRight, wt as Lock, yn as Bell, yt as Megaphone } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { m as useAuth } from "./router-B1m7u2Jk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-BSe7yKP9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const navigate = useNavigate();
	const { signOut, user } = useAuth();
	const queryClient = useQueryClient();
	const [panel, setPanel] = (0, import_react.useState)(null);
	const [reportStep, setReportStep] = (0, import_react.useState)(null);
	const [dmca, setDmca] = (0, import_react.useState)({
		contentLink: "",
		originalWork: "",
		description: "",
		email: "",
		fullName: ""
	});
	const [dmcaAgree, setDmcaAgree] = (0, import_react.useState)(false);
	const [submittingDmca, setSubmittingDmca] = (0, import_react.useState)(false);
	const submitDmca = async () => {
		const contentLink = dmca.contentLink.trim();
		const originalWork = dmca.originalWork.trim();
		const description = dmca.description.trim();
		const email = dmca.email.trim();
		const fullName = dmca.fullName.trim();
		if (!contentLink || !originalWork || !description || !email || !fullName) {
			toast.error("Please fill in all required fields");
			return;
		}
		let validProof = false;
		try {
			const u = new URL(originalWork);
			validProof = u.protocol === "http:" || u.protocol === "https:";
		} catch {
			validProof = false;
		}
		if (!validProof) {
			toast.error("Please enter a valid proof URL (must start with http:// or https://)");
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			toast.error("Please enter a valid contact email");
			return;
		}
		if (!dmcaAgree) {
			toast.error("You must accept the legal declaration to submit");
			return;
		}
		if (!user) {
			toast.error("Please sign in to submit a report");
			return;
		}
		setSubmittingDmca(true);
		const { error } = await supabase.from("copyright_reports").insert({
			reporter_user_id: user.id,
			reporter_full_name: fullName.slice(0, 200),
			infringing_content_link: contentLink.slice(0, 2e3),
			original_work_link: originalWork.slice(0, 2e3),
			reason: description.slice(0, 2e3),
			contact_email: email.slice(0, 255)
		});
		setSubmittingDmca(false);
		if (error) {
			toast.error("Could not submit report. Please try again.");
			return;
		}
		toast.success("DMCA report submitted successfully");
		setDmca({
			contentLink: "",
			originalWork: "",
			description: "",
			email: "",
			fullName: ""
		});
		setDmcaAgree(false);
		setReportStep(null);
		setPanel(null);
	};
	const [toggles, setToggles] = (0, import_react.useState)({
		privateAccount: false,
		allowDownloads: true,
		activityStatus: true,
		likes: true,
		comments: true,
		followers: true,
		messages: true,
		channel: true,
		system: true,
		reduceMotion: false,
		compact: false
	});
	const flip = (k) => setToggles((t) => ({
		...t,
		[k]: !t[k]
	}));
	const handleLogout = async () => {
		await queryClient.cancelQueries();
		queryClient.clear();
		await signOut();
		navigate({
			to: "/auth",
			search: { redirect: void 0 },
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] text-white p-4 font-sans select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 mb-6 mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => navigate({ to: "/profile" }),
					className: "p-1 text-zinc-300 hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold",
					children: "Settings"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[#141418] rounded-2xl p-2 border border-zinc-800 space-y-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => navigate({ to: "/account" }),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: "Account"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: () => navigate({ to: "/channel/create" }),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Create Channel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Videos, reels, posts & analytics"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => navigate({ to: "/wallet" }),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Monetization & Wallet"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Earnings, courses, payouts & tax invoices"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: () => navigate({ to: "/orbit" }),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Orbit, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Orbit"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Private social discovery"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("privacy"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Privacy & Downloads"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Blocked accounts"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("notifications"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Notifications"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Likes, Orbit, channel & system alerts"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("appearance"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: "Appearance"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("help"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: "Help & Support"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("about"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: "About"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleLogout,
						className: "border-t border-zinc-800/80 pt-2 p-3.5 flex w-full items-center gap-4 text-red-500 cursor-pointer hover:bg-red-950/20 rounded-xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 20 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-sm",
							children: "Log Out"
						})]
					})
				]
			}),
			panel === "privacy" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Privacy & Downloads",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Private account",
						hint: "Only approved followers can see your posts",
						on: toggles.privateAccount,
						onClick: () => flip("privateAccount")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Allow downloads",
						hint: "Let others save your reels with watermark",
						on: toggles.allowDownloads,
						onClick: () => flip("allowDownloads")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Show activity status",
						hint: "Display when you were last active",
						on: toggles.activityStatus,
						onClick: () => flip("activityStatus")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Blocked accounts",
						hint: "No blocked accounts"
					})
				]
			}),
			panel === "notifications" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Notifications",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Likes",
						on: toggles.likes,
						onClick: () => flip("likes")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Comments",
						on: toggles.comments,
						onClick: () => flip("comments")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "New followers",
						on: toggles.followers,
						onClick: () => flip("followers")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Messages",
						on: toggles.messages,
						onClick: () => flip("messages")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Channel & monetization",
						on: toggles.channel,
						onClick: () => flip("channel")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "System alerts",
						on: toggles.system,
						onClick: () => flip("system")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Open activity feed",
						onClick: () => navigate({ to: "/notifications" })
					})
				]
			}),
			panel === "appearance" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Appearance",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Theme",
						hint: "Premium Dark (default)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Reduce motion",
						hint: "Minimise animations and transitions",
						on: toggles.reduceMotion,
						onClick: () => flip("reduceMotion")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Compact layout",
						hint: "Tighter spacing in feed and lists",
						on: toggles.compact,
						onClick: () => flip("compact")
					})
				]
			}),
			panel === "help" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Help & Support",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Help center",
						hint: "Guides and troubleshooting"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Report a problem",
						hint: "Tell us what went wrong",
						onClick: () => setReportStep("options")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "Community guidelines" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Copyright & DMCA Policy",
						hint: "Takedown procedure & Safe Harbor",
						onClick: () => navigate({ to: "/copyright-policy" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Contact support",
						hint: "Yourworld2029@gmail.com",
						onClick: () => {
							window.location.href = "mailto:Yourworld2029@gmail.com";
						}
					})
				]
			}),
			reportStep === "options" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Report a problem",
				onClose: () => setReportStep(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Copyright Infringement (DMCA)",
						hint: "Report stolen content",
						onClick: () => setReportStep("dmca")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Technical Bug",
						hint: "App errors or crashes",
						onClick: () => {
							window.location.href = "mailto:Yourworld2029@gmail.com?subject=" + encodeURIComponent("Technical Bug Report");
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Community Violation",
						hint: "Harassment, spam or abuse",
						onClick: () => {
							window.location.href = "mailto:Yourworld2029@gmail.com?subject=" + encodeURIComponent("Community Violation Report");
						}
					})
				]
			}),
			reportStep === "dmca" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "DMCA Takedown Request",
				onClose: () => setReportStep(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 p-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DmcaField, {
							label: "Content Link / ID *",
							value: dmca.contentLink,
							onChange: (v) => setDmca((d) => ({
								...d,
								contentLink: v
							})),
							placeholder: "Link or ID of the infringing content"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DmcaField, {
							label: "Original Work / Proof URL *",
							type: "url",
							value: dmca.originalWork,
							onChange: (v) => setDmca((d) => ({
								...d,
								originalWork: v
							})),
							placeholder: "https://link-to-your-original-work"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-semibold text-zinc-400 mb-1",
							children: "Description of ownership *"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: dmca.description,
							onChange: (e) => setDmca((d) => ({
								...d,
								description: e.target.value
							})),
							placeholder: "Explain that you own the original work",
							maxLength: 2e3,
							rows: 4,
							className: "w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-indigo-500"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DmcaField, {
							label: "Your Full Legal Name *",
							value: dmca.fullName,
							onChange: (v) => setDmca((d) => ({
								...d,
								fullName: v
							})),
							placeholder: "Full name of rights owner or agent"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DmcaField, {
							label: "Contact Email *",
							type: "email",
							value: dmca.email,
							onChange: (v) => setDmca((d) => ({
								...d,
								email: v
							})),
							placeholder: "you@example.com"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: dmcaAgree,
								onChange: (e) => setDmcaAgree(e.target.checked),
								className: "mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] leading-relaxed text-zinc-300",
								children: "I confirm under penalty of perjury/account termination that I am the rightful owner or authorized agent of this copyrighted content."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: submitDmca,
							disabled: submittingDmca || !dmcaAgree,
							className: "w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50",
							children: submittingDmca ? "Submitting…" : "Submit DMCA Report"
						})
					]
				})
			}),
			panel === "about" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "About",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "YourWorld",
						hint: "Version 1.0.0"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Terms of Service",
						onClick: () => navigate({ to: "/terms" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Privacy Policy",
						onClick: () => navigate({ to: "/privacy" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Copyright & DMCA Policy",
						hint: "Takedown procedure & Safe Harbor",
						onClick: () => navigate({ to: "/copyright-policy" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Licenses",
						onClick: () => navigate({ to: "/licenses" })
					})
				]
			})
		]
	});
}
function Panel({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-black/70",
			onClick: onClose,
			"aria-hidden": true
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-[#141418] p-4 max-h-[85vh] overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-bold",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					"aria-label": "Close",
					className: "p-1.5 text-zinc-400 hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-1",
				children
			})]
		})]
	});
}
function Row({ label, hint, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-zinc-800/50",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-semibold",
			children: label
		}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-[11px] text-zinc-500",
			children: hint
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
			className: "text-zinc-600",
			size: 18
		})]
	});
}
function DmcaField({ label, value, onChange, placeholder, type = "text" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "block text-xs font-semibold text-zinc-400 mb-1",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		value,
		onChange: (e) => onChange(e.target.value),
		placeholder,
		maxLength: 2e3,
		className: "w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-indigo-500"
	})] });
}
function Toggle({ label, hint, on, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between rounded-xl p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0 pr-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-sm font-semibold",
				children: label
			}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-[11px] text-zinc-500",
				children: hint
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			role: "switch",
			"aria-checked": on,
			"aria-label": label,
			onClick,
			className: `relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-indigo-500" : "bg-zinc-700"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}` })
		})]
	});
}
//#endregion
export { SettingsPage as component };
