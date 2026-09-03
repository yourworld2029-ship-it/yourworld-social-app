import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DidqkCgA.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-nQzdb24v.mjs";
import { t as Input } from "./input-BZfqTwhW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reset-password-BQ9Vh6fM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResetPasswordPage() {
	const navigate = useNavigate();
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const submit = async (e) => {
		e.preventDefault();
		setBusy(true);
		const { error } = await supabase.auth.updateUser({ password });
		setBusy(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Password updated");
		await supabase.auth.signOut();
		navigate({
			to: "/auth",
			search: { redirect: void 0 },
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-bold",
				children: "Set a new password"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pt-1.5 text-sm text-muted-foreground",
				children: "Enter a new password for your account."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				className: "space-y-3 pt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "password",
					required: true,
					minLength: 6,
					value: password,
					onChange: (e) => setPassword(e.target.value),
					placeholder: "New password",
					"aria-label": "New password",
					autoComplete: "new-password",
					className: "h-12 rounded-xl"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: busy,
					className: "h-12 w-full rounded-full",
					children: "Update password"
				})]
			})
		]
	});
}
//#endregion
export { ResetPasswordPage as component };
