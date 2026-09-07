import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/licenses-BYcusFDE.js
var import_jsx_runtime = require_jsx_runtime();
var LICENSES = [
	{
		name: "React",
		license: "MIT License",
		notice: "Copyright (c) Meta Platforms, Inc. and affiliates."
	},
	{
		name: "TanStack Router / TanStack Start",
		license: "MIT License",
		notice: "Copyright (c) Tanner Linsley."
	},
	{
		name: "Supabase JavaScript Client",
		license: "MIT License",
		notice: "Copyright (c) Supabase, Inc."
	},
	{
		name: "Tailwind CSS",
		license: "MIT License",
		notice: "Copyright (c) Adam Wathan and Tailwind Labs LLC."
	},
	{
		name: "Lucide React Icons",
		license: "ISC License",
		notice: "Copyright (c) Lucide Contributors."
	},
	{
		name: "shadcn/ui Components",
		license: "MIT License",
		notice: "Copyright (c) shadcn."
	},
	{
		name: "Sonner (toasts)",
		license: "MIT License",
		notice: "Copyright (c) Emil Kowalski."
	},
	{
		name: "Zod",
		license: "MIT License",
		notice: "Copyright (c) Colin McDonnell."
	}
];
var MIT_TEXT = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
function LicensesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#09090b] text-white font-sans p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-2xl mx-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold mt-2 mb-1",
					children: "Open Source Licenses"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-zinc-400 mb-6",
					children: "YourWorld is built with the following open source software. We are grateful to their authors and communities."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: LICENSES.map((lib) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: lib.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-medium text-indigo-400",
								children: lib.license
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-zinc-500 mt-1",
							children: lib.notice
						})]
					}, lib.name))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4 mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold mb-2",
						children: "MIT License (Full Text)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400 font-mono",
						children: MIT_TEXT
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-zinc-600 mt-6 text-center",
					children: "YourWorld © 2026. All rights reserved."
				})
			]
		})
	});
}
//#endregion
export { LicensesPage as component };
