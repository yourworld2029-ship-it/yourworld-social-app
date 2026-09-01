import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { In as ArrowLeft, R as ShieldCheck } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-CoY-PyCl.js
var import_jsx_runtime = require_jsx_runtime();
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mb-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "text-lg font-bold mb-2 flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
				size: 18,
				className: "text-indigo-400"
			}), title]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-sm text-zinc-300 leading-relaxed space-y-2",
			children
		})]
	});
}
function PrivacyPage() {
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
						children: "Privacy Policy"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-zinc-500 mb-6",
					children: "Last updated: August 30, 2026"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "1. Information We Collect",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We collect the information you provide when you create an account (name, email, profile details), content you post, and usage data such as device, interactions, and logs. Orbit discovery data is stored separately with privacy-first controls." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "2. How We Use Information",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We use your information to provide, personalize, and secure the YourWorld platform, enable features such as Feed, Reels, Stories, chat, calls, Orbit, monetization, and to detect abuse and enforce our policies." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "3. Data Storage & Security",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your data is stored with our backend provider and protected with Row-Level Security and access controls. Authentication tokens and sessions are handled securely. We do not sell your personal data." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "4. Sharing",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"We share data only as necessary to operate the platform, comply with legal obligations, or respond to verified copyright takedown requests (see our",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/copyright-policy",
							className: "text-indigo-400 underline",
							children: "Copyright & DMCA Policy"
						}),
						")."
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "5. Your Rights",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "You may view, edit, or delete your account data from Settings. You can manage visibility, blocked accounts, notifications, and Orbit privacy controls at any time." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "6. Cookies & Local Storage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We use local storage and cookies to keep you signed in and remember preferences. Persistent authentication keeps you logged in across sessions unless you manually log out." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "7. Children's Privacy",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "YourWorld is not directed to children under 13 (or the applicable minimum age)." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "8. Contact",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Privacy questions? Contact us at",
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
export { PrivacyPage as component };
