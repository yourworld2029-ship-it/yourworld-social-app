import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Et as Mail, Ot as Lock, Pn as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { ht as cn } from "./router-DtlJAjv-.mjs";
import { t as Button } from "./button-DpEOdxOK.mjs";
import { t as Input } from "./input-haJ5mRwP.mjs";
import { t as trackEvent } from "./analytics-DKfMtyUd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-C9771P1F.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
function signupMetadata(identifier, isEmail) {
	const normalized = identifier.trim().toLowerCase();
	const source = isEmail ? normalized.split("@")[0] : "user";
	const base = source.replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "user";
	let hash = 2166136261;
	for (let i = 0; i < normalized.length; i += 1) {
		hash ^= normalized.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	const suffix = (hash >>> 0).toString(36).slice(0, 7);
	const username = `${base.slice(0, 24)}_${suffix}`;
	const displayName = isEmail ? source || "YourWorld user" : "YourWorld user";
	return {
		username,
		user_name: username,
		display_name: displayName,
		full_name: displayName,
		name: displayName
	};
}
function AuthPage() {
	const [mode, setMode] = (0, import_react.useState)("signin");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		let alive = true;
		(async () => {
			const { data } = await supabase.auth.getSession();
			if (alive && data.session) await navigate({
				to: "/",
				replace: true
			});
		})();
		return () => {
			alive = false;
		};
	}, [navigate]);
	const handleSocialLogin = async (provider) => {
		trackEvent("auth_started", {
			method: provider,
			mode: "signin"
		});
		setLoading(true);
		const appOrigin = {
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/",
			"VITE_APP_URL": "https://your-world-social-app--yourworld2029.replit.app",
			"VITE_SUPABASE_PROJECT_ID": "mvvliwuldgcmrqffrfgi",
			"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_by8rV8Qfj_n4nTB-y4MJnw_soEAst3r",
			"VITE_SUPABASE_URL": "https://pnpfybcdxynfooylxqou.supabase.co"
		}["VITE_APP_URL"] || window.location.origin;
		const redirectTo = new URL("/auth", appOrigin).toString();
		const { error } = await supabase.auth.signInWithOAuth({
			provider,
			options: { redirectTo }
		});
		setLoading(false);
		if (error) toast.error(error.message);
	};
	const handlePasswordAuth = async (e) => {
		e.preventDefault();
		const normalizedEmail = email.trim().toLowerCase();
		if (password.length < 6) {
			toast.error("Password must be at least 6 characters.");
			return;
		}
		if (mode === "signup" && password !== confirmPassword) {
			toast.error("Passwords do not match.");
			return;
		}
		setLoading(true);
		const { data, error } = mode === "signup" ? await supabase.auth.signUp({
			email: normalizedEmail,
			password,
			options: { data: signupMetadata(normalizedEmail, true) }
		}) : await supabase.auth.signInWithPassword({
			email: normalizedEmail,
			password
		});
		setLoading(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		if (mode === "signup" && !data.session) {
			trackEvent("account_created", {
				method: "email",
				email_confirmation_required: true
			});
			toast.success("Account created. Check your email to confirm your address.");
			setMode("signin");
			setPassword("");
			setConfirmPassword("");
			return;
		}
		if (mode === "signup") trackEvent("account_created", {
			method: "email",
			email_confirmation_required: false
		});
		trackEvent("auth_completed", {
			method: "email",
			mode
		});
		toast.success("Welcome back.");
		await navigate({
			to: "/",
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl text-slate-100",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
				className: "text-center space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 mb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-6 h-6 text-white" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent",
						children: "YourWorld"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
						className: "text-slate-400 text-sm",
						children: "Sign in securely with your YourWorld account"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 rounded-lg border border-slate-800 bg-slate-950/40 p-1",
						children: ["signin", "signup"].map((authMode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setMode(authMode);
								setPassword("");
								setConfirmPassword("");
							},
							className: `rounded-md px-3 py-2 text-sm font-medium transition-all ${mode === authMode ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"}`,
							children: authMode === "signin" ? "Sign In" : "Sign Up"
						}, authMode))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => handleSocialLogin("google"),
							variant: "outline",
							className: "w-full bg-slate-950/40 border-slate-800 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								className: "w-4 h-4",
								viewBox: "0 0 24 24",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										fill: "#EA4335",
										d: "M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										fill: "#4285F4",
										d: "M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										fill: "#FBBC05",
										d: "M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										fill: "#34A853",
										d: "M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
									})
								]
							}), "Continue with Google"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => handleSocialLogin("apple"),
							variant: "outline",
							className: "w-full bg-slate-950/40 border-slate-800 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
								className: "w-4 h-4 fill-current",
								viewBox: "0 0 170 170",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.82.13-9.62-1.95-14.42-6.23-3.23-2.82-7.17-7.53-11.83-14.13-6.3-8.91-11.35-18.78-15.15-29.61-3.8-10.83-5.7-21.2-5.7-31.1 0-14.83 3.82-27.17 11.47-37.03 7.65-9.85 17.38-14.88 29.18-15.08 4.7 0 9.87 1.18 15.52 3.53 5.65 2.35 9.58 3.53 11.78 3.53 2.08 0 6.08-1.22 12-3.66 5.92-2.44 11.02-3.56 15.3-3.35 11.53.53 20.82 4.8 27.87 12.82-10.23 6.18-15.22 14.82-14.97 25.92.25 8.7 3.49 16.03 9.72 22 6.23 5.97 13.79 9.17 22.68 9.6-2.58 7.72-5.92 15.33-10.02 22.82zM119.22 31.85c0-6.95 2.52-13.62 7.57-20.02 5.05-6.4 11.45-10.45 19.2-12.15.28 2.03.42 3.88.42 5.55 0 7.07-2.6 13.88-7.8 20.43-5.2 6.55-11.62 10.55-19.27 12-0.08-1.63-0.12-3.23-0.12-4.81z" })
							}), "Continue with Apple"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex py-2 items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-grow border-t border-slate-800" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-shrink mx-4 text-xs text-slate-500 uppercase",
								children: "Or Continue With Email"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-grow border-t border-slate-800" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handlePasswordAuth,
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "absolute left-3 top-3 h-5 w-5 text-slate-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "email",
									autoComplete: "email",
									placeholder: "Email address",
									value: email,
									onChange: (e) => setEmail(e.target.value),
									className: "pl-10 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-pink-500 transition-all",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								autoComplete: mode === "signin" ? "current-password" : "new-password",
								placeholder: "Password",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								className: "bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-pink-500 transition-all",
								minLength: 6,
								required: true
							}),
							mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								autoComplete: "new-password",
								placeholder: "Confirm password",
								value: confirmPassword,
								onChange: (e) => setConfirmPassword(e.target.value),
								className: "bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-pink-500 transition-all",
								minLength: 6,
								required: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "submit",
								disabled: loading,
								className: "w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2",
								children: [loading ? mode === "signin" ? "Signing In..." : "Creating Account..." : mode === "signin" ? "Sign In" : "Create Account", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "w-4 h-4" })]
							})
						]
					})
				]
			})]
		})
	});
}
//#endregion
export { AuthPage as component };
