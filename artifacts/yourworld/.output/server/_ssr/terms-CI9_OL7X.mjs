import { p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Fn as ArrowLeft, Jt as FileText } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/terms-CI9_OL7X.js
var import_jsx_runtime = require_jsx_runtime();
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mb-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "text-lg font-bold mb-2 flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
				size: 18,
				className: "text-indigo-400"
			}), title]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-sm text-zinc-300 leading-relaxed space-y-2",
			children
		})]
	});
}
function TermsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#09090b] text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-2xl mx-auto px-4 py-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/settings",
						className: "p-1 text-zinc-300 hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-bold",
						children: "Terms of Service"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-zinc-500 mb-6",
					children: "Last updated: August 30, 2026"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "1. Acceptance of Terms",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "By creating an account or using YourWorld (\"YW\"), you agree to be bound by these Terms of Service. If you do not agree, you may not access or use the platform." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "2. Your Account",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "You are responsible for safeguarding your account credentials and for all activity that occurs under your account. You must be at least 13 years old (or the minimum age in your country) to use YourWorld." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "3. Content & Conduct",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "You retain ownership of content you post. You grant YourWorld a worldwide, non-exclusive, royalty-free license to host, store, use, display, and distribute your content within the platform. You must not post content that is unlawful, infringing, hateful, harassing, or that violates our Community Guidelines." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "4. Monetization & Payments",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Creators participating in monetization (Sponsorships, VIP content, paid courses) are subject to the Monetization policies. Payouts are processed per the eligibility threshold and schedule. Tax invoices and Form 16A certificates are provided where applicable." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "5. Privacy",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Your use of YourWorld is also governed by our",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/privacy",
							className: "text-indigo-400 underline",
							children: "Privacy Policy"
						}),
						"."
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "6. Intellectual Property",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"YourWorld respects intellectual property. See our",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/copyright-policy",
							className: "text-indigo-400 underline",
							children: "Copyright & DMCA Policy"
						}),
						" ",
						"for the takedown procedure and designated copyright agent."
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "7. Termination",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We may suspend or terminate your account if you violate these Terms. You may delete your account at any time from Settings." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "8. Disclaimer & Limitation of Liability",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "YourWorld is provided \"as is\" without warranties of any kind. To the maximum extent permitted by law, YourWorld shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "9. Contact",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Questions about these Terms? Contact us at",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "mailto:Yourworld2029@gmail.com",
							className: "text-indigo-400 underline",
							children: "Yourworld2029@gmail.com"
						}),
						"."
					] })
				})
			]
		})
	});
}
//#endregion
export { TermsPage as component };
