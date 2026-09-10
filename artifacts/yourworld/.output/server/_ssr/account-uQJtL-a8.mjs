import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { $t as Clock, Ct as Lock, Dt as Laptop, Et as Link2, Ht as EyeOff, L as ShieldCheck, P as Smartphone, S as Trash2, St as LogOut, Vt as Eye, b as TriangleAlert, bt as MapPin, fn as Check, hn as Camera, i as X, ln as ChevronRight, pt as Monitor, un as ChevronLeft, xt as Mail } from "../_libs/lucide-react.mjs";
import { m as useAuth, mt as cn } from "./router-B_3KaE6n.mjs";
import { r as useMyProfile } from "./profile-data-GDBRAXKL.mjs";
import { t as YwAvatar } from "./Avatar-CR_0GJ7k.mjs";
import { a as SheetTitle, n as SheetContent, t as Sheet } from "./sheet-CkmB18P5.mjs";
import { a as DialogTitle, n as DialogContent, t as Dialog } from "./dialog-Bvh1NjrJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-uQJtL-a8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Builds the real current-device session from the browser environment. */
function currentSession() {
	const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
	const isPhone = /Android|iPhone|iPad|Mobile/i.test(ua);
	const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
	const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : /Mac OS X/i.test(ua) ? "macOS" : /Windows/i.test(ua) ? "Windows" : /Linux/i.test(ua) ? "Linux" : "Unknown OS";
	let zone = "";
	try {
		zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
	} catch {
		zone = "";
	}
	return {
		id: "current",
		label: `${os} · ${browser}`,
		browser,
		os,
		location: zone || "Unknown location",
		ip: "This device",
		lastActive: "Active now",
		isCurrent: true,
		kind: isPhone ? "phone" : "desktop"
	};
}
function DeviceIcon({ kind, className }) {
	const props = {
		className: cn("shrink-0", className),
		strokeWidth: 1.6
	};
	if (kind === "phone") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { ...props });
	if (kind === "laptop") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Laptop, { ...props });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { ...props });
}
function Toggle({ checked, onChange, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		role: "switch",
		"aria-checked": checked,
		onClick: () => onChange(!checked),
		className: cn("relative h-[28px] w-[48px] shrink-0 rounded-full transition-all duration-300 active:scale-95", checked ? accent ?? "bg-primary" : "bg-[color-mix(in_oklab,var(--foreground)_15%,transparent)]"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_4px_oklch(0_0_0/0.35)] transition-all duration-300", checked ? "left-[calc(100%-25px)]" : "left-[3px]") })
	});
}
function FieldLabel({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "mb-1.5 block font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60",
		children
	});
}
function Field({ label, value, onChange, placeholder, type = "text", multiline, rows = 3, hint, inputRef }) {
	const [showPwd, setShowPwd] = (0, import_react.useState)(false);
	const resolvedType = type === "password" ? showPwd ? "text" : "password" : type;
	const inputCls = "w-full rounded-[13px] bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] px-3.5 py-2.5 font-ui text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-[color-mix(in_oklab,var(--foreground)_22%,transparent)] transition-all duration-200 resize-none";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: label }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [multiline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value,
				onChange: (e) => onChange(e.target.value),
				placeholder,
				rows,
				className: inputCls
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: resolvedType,
				value,
				onChange: (e) => onChange(e.target.value),
				placeholder,
				className: cn(inputCls, type === "password" && "pr-10")
			}), type === "password" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setShowPwd((v) => !v),
				className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-muted-foreground",
				children: showPwd ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
					className: "h-4 w-4",
					strokeWidth: 1.7
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
					className: "h-4 w-4",
					strokeWidth: 1.7
				})
			})]
		}),
		hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-ui text-[11px] text-muted-foreground/50",
			children: hint
		})
	] });
}
function Section({ icon: Icon, title, children, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "animate-rise",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2.5 flex items-center gap-2 px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("grid h-6 w-6 place-items-center rounded-[7px]", danger ? "bg-destructive/15 text-destructive" : "bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)] text-foreground/70"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "h-3.5 w-3.5",
					strokeWidth: 1.8
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("font-ui text-[12px] font-semibold uppercase tracking-[0.07em]", danger ? "text-destructive/80" : "text-muted-foreground/60"),
				children: title
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "surface-card overflow-hidden rounded-[22px] px-4 py-4",
			children
		})]
	});
}
function Divider() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hairline -mx-4 my-3.5 border-t" });
}
function ActionRow({ label, hint, onClick, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: cn("flex w-full items-center justify-between gap-3 text-left transition-colors duration-150 active:opacity-70", danger ? "text-destructive" : "text-foreground"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block font-ui text-[14px] font-medium",
				children: label
			}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block font-ui text-[12px] text-muted-foreground",
				children: hint
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
			className: cn("h-4 w-4 shrink-0", danger ? "text-destructive/60" : "text-muted-foreground/40"),
			strokeWidth: 1.8
		})]
	});
}
function ToggleRow({ label, hint, checked, onChange, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block font-ui text-[14px] font-medium text-foreground",
				children: label
			}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block font-ui text-[12px] text-muted-foreground",
				children: hint
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
			checked,
			onChange,
			accent
		})]
	});
}
function SocialIcon({ brand }) {
	if (brand === "facebook") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "h-4 w-4 fill-current",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" })
	});
	if (brand === "instagram") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "h-4 w-4 fill-current",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "h-4 w-4 fill-current",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12.065.001c1.587.01 6.682.464 8.913 5.213.698 1.46.527 3.821.387 5.596-.035.458-.068.891-.085 1.291.264.13.697.27 1.404.27.498 0 1.035-.146 1.594-.439l.031-.016a.746.746 0 01.323-.085c.304 0 .612.206.612.549 0 .655-.991.996-1.272 1.073-.072.019-.162.039-.267.063-.71.162-1.993.462-2.381 1.722-.038.124-.049.24-.03.318.226.935 1.66 2.68 4.026 4.578.176.143.387.388.389.742.003.509-.38.96-.93 1.132-.354.112-.69.126-.909.126-.18 0-.302-.012-.322-.014-.52-.062-1.021-.325-1.612-.627-.824-.419-1.756-.895-3.018-.895-.18 0-.362.01-.543.03-.746.082-1.39.418-2.083.782-.966.507-2.057 1.08-3.784 1.08h-.001c-1.726 0-2.813-.573-3.778-1.08-.694-.363-1.339-.7-2.086-.782a5.647 5.647 0 00-.543-.03c-1.266 0-2.202.477-3.028.896-.588.302-1.089.563-1.613.625-.018.002-.14.015-.32.015-.218 0-.556-.015-.91-.127-.553-.173-.934-.624-.93-1.134.002-.352.213-.598.389-.74 2.37-1.898 3.803-3.643 4.028-4.579.019-.076.009-.192-.03-.316-.389-1.261-1.672-1.56-2.382-1.723-.105-.024-.194-.043-.267-.063-.388-.105-1.272-.473-1.272-1.074 0-.343.308-.549.612-.549.098 0 .201.028.302.083l.052.019c.56.293 1.097.439 1.595.439.747 0 1.195-.26 1.412-.277-.018-.4-.05-.832-.084-1.29-.142-1.775-.312-4.136.385-5.597C5.264.463 10.378.01 11.966 0l.1-.001z" })
	});
}
function PasswordGateDialog({ open, pending, onConfirm, onCancel }) {
	const [pwd, setPwd] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [showPwd, setShowPwd] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	const isRemoveAll = pending?.kind === "remove-all";
	function handleConfirm() {
		if (pwd.length < 1) {
			setError("Please enter your password.");
			inputRef.current?.focus();
			return;
		}
		setError("");
		onConfirm(pwd);
		setPwd("");
	}
	function handleCancel() {
		setPwd("");
		setError("");
		onCancel();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => !v && handleCancel(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "mx-auto max-w-sm rounded-[24px] border-0 bg-[color-mix(in_oklab,var(--card)_80%,transparent)] p-0 shadow-2xl backdrop-blur-3xl [&>button]:hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "sr-only",
				children: "Confirm password"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-6 pb-6 pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-14 w-14 place-items-center rounded-[18px] bg-amber-500/15",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
								className: "h-7 w-7 text-amber-400",
								strokeWidth: 1.6
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-center font-ui text-[17px] font-semibold text-foreground",
						children: isRemoveAll ? "Log Out All Other Devices" : "Remove Device"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 text-center font-ui text-[13px] leading-relaxed text-muted-foreground",
						children: isRemoveAll ? "Enter your password to sign out of all other active sessions." : "Enter your password to remove this device from your account."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: inputRef,
								type: showPwd ? "text" : "password",
								value: pwd,
								onChange: (e) => {
									setPwd(e.target.value);
									setError("");
								},
								onKeyDown: (e) => e.key === "Enter" && handleConfirm(),
								placeholder: "Enter your password",
								autoFocus: true,
								className: cn("w-full rounded-[13px] bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] px-3.5 py-2.5 pr-10 font-ui text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 transition-all duration-200", error ? "ring-1 ring-destructive/60 focus:ring-destructive/60" : "focus:ring-[color-mix(in_oklab,var(--foreground)_22%,transparent)]")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setShowPwd((v) => !v),
								className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50",
								children: showPwd ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
									className: "h-4 w-4",
									strokeWidth: 1.7
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
									className: "h-4 w-4",
									strokeWidth: 1.7
								})
							})]
						}), error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1.5 flex items-center gap-1.5 font-ui text-[12px] text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
								className: "h-3.5 w-3.5",
								strokeWidth: 2
							}), error]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleCancel,
							className: "flex-1 rounded-[13px] bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] py-2.5 font-ui text-[14px] font-medium text-foreground transition-all duration-150 active:scale-95",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleConfirm,
							className: cn("flex-1 rounded-[13px] py-2.5 font-ui text-[14px] font-semibold transition-all duration-150 active:scale-95", isRemoveAll ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"),
							children: isRemoveAll ? "Log Out All" : "Remove"
						})]
					})
				]
			})]
		})
	});
}
function ActiveSessionsSheet({ open, onOpenChange }) {
	const [sessions, setSessions] = (0, import_react.useState)(() => [currentSession()]);
	const [pending, setPending] = (0, import_react.useState)(null);
	const [pwdOpen, setPwdOpen] = (0, import_react.useState)(false);
	const [removedId, setRemovedId] = (0, import_react.useState)(null);
	const others = sessions.filter((s) => !s.isCurrent);
	function requestRemoveOne(id) {
		setPending({
			kind: "remove-one",
			sessionId: id
		});
		setPwdOpen(true);
	}
	function requestRemoveAll() {
		setPending({ kind: "remove-all" });
		setPwdOpen(true);
	}
	function handleConfirm(_pwd) {
		setPwdOpen(false);
		if (!pending) return;
		if (pending.kind === "remove-one") {
			setRemovedId(pending.sessionId);
			setTimeout(() => {
				setSessions((prev) => prev.filter((s) => s.id !== pending.sessionId));
				setRemovedId(null);
			}, 350);
		} else others.forEach((s) => {
			setTimeout(() => {
				setSessions((prev) => prev.filter((p) => p.id !== s.id));
			}, 350);
		});
		setPending(null);
	}
	function handlePwdCancel() {
		setPwdOpen(false);
		setPending(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "rounded-t-[28px] border-0 bg-[color-mix(in_oklab,var(--card)_75%,transparent)] p-0 backdrop-blur-3xl [&>button]:hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
					className: "sr-only",
					children: "Active Sessions"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center pt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--foreground)_18%,transparent)]" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-5 pb-2 pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-ui text-[17px] font-semibold text-foreground",
						children: "Active Sessions"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-ui text-[12px] text-muted-foreground",
						children: [
							sessions.length,
							" device",
							sessions.length !== 1 ? "s" : "",
							" signed in"
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onOpenChange(false),
						className: "grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)] transition-all active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "h-4 w-4 text-muted-foreground",
							strokeWidth: 2
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-[60vh] overflow-y-auto pb-8",
					children: [
						sessions.filter((s) => s.isCurrent).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-5 py-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50",
								children: "This device"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionCard, {
								session: s,
								onRemove: null,
								isRemoving: false
							})]
						}, s.id)),
						others.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-5 pt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50",
									children: [
										"Other devices (",
										others.length,
										")"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: requestRemoveAll,
									className: "font-ui text-[12px] font-semibold text-destructive/80 transition-opacity active:opacity-60",
									children: "Log out all"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-2.5",
								children: others.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionCard, {
									session: s,
									onRemove: () => requestRemoveOne(s.id),
									isRemoving: removedId === s.id
								}, s.id))
							})]
						}),
						others.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center gap-2 py-8 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
								className: "h-8 w-8 text-green-400/60",
								strokeWidth: 1.4
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-ui text-[13px] text-muted-foreground",
								children: "No other active sessions"
							})]
						})
					]
				})
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordGateDialog, {
		open: pwdOpen,
		pending,
		onConfirm: handleConfirm,
		onCancel: handlePwdCancel
	})] });
}
function SessionCard({ session, onRemove, isRemoving }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("surface-card flex items-start gap-3.5 rounded-[18px] px-4 py-3.5 transition-all duration-300", isRemoving && "scale-95 opacity-0"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[13px]", session.isCurrent ? "bg-primary/15 text-primary" : "bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] text-foreground/60"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeviceIcon, {
					kind: session.kind,
					className: "h-5 w-5"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-ui text-[14px] font-semibold text-foreground",
							children: session.label
						}), session.isCurrent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 font-ui text-[10px] font-semibold text-green-400",
							children: "Current"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-ui text-[12px] text-muted-foreground",
						children: [
							session.browser,
							" · ",
							session.os
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 font-ui text-[11px] text-muted-foreground/70",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									className: "h-3 w-3",
									strokeWidth: 1.8
								}),
								session.location,
								" · ",
								session.ip
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 font-ui text-[11px] text-muted-foreground/70",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
								className: "h-3 w-3",
								strokeWidth: 1.8
							}), session.lastActive]
						})]
					})
				]
			}),
			onRemove && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onRemove,
				"aria-label": "Remove device",
				className: "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] text-muted-foreground/60 transition-all duration-150 hover:bg-destructive/15 hover:text-destructive active:scale-90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
					className: "h-3.5 w-3.5",
					strokeWidth: 2.2
				})
			})
		]
	});
}
function AccountPage() {
	const { signOut, user } = useAuth();
	const { profile, avatarSrc, save } = useMyProfile();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [name, setName] = (0, import_react.useState)("");
	const [username, setUsername] = (0, import_react.useState)("");
	const [bio, setBio] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [twoFa, setTwoFa] = (0, import_react.useState)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [fbOn, setFbOn] = (0, import_react.useState)(false);
	const [igOn, setIgOn] = (0, import_react.useState)(false);
	const [scOn, setScOn] = (0, import_react.useState)(false);
	const [sessionsOpen, setSessionsOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setName(profile.display_name);
		setUsername(profile.username);
		setBio(profile.bio);
		setEmail(user?.email ?? "");
		setPhone(user?.phone ?? "");
	}, [profile, user]);
	const avatarUser = {
		id: profile.id,
		username: profile.username || "user",
		name: profile.display_name || profile.username || "YourWorld user",
		hue: 280
	};
	const handleSave = async () => {
		await save({
			name,
			username,
			bio,
			category: profile.category,
			location: profile.location,
			website: profile.website
		});
		setSaved(true);
		setTimeout(() => setSaved(false), 2e3);
	};
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "grain relative min-h-screen pb-28",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "ambient-canvas"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "header-lux sticky top-0 z-40 flex h-14 items-center gap-3 px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/settings",
						"aria-label": "Back",
						className: "icon-pill -ml-1 grid h-9 w-9 place-items-center rounded-full transition-all duration-200 active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							className: "h-5 w-5",
							strokeWidth: 2
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "flex-1 font-ui text-[17px] font-semibold leading-none tracking-[-0.02em] text-foreground",
						children: "Account Settings"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleSave,
						className: cn("flex h-8 items-center gap-1.5 rounded-[10px] px-3.5 font-ui text-[13px] font-semibold transition-all duration-300 active:scale-95", saved ? "bg-green-500/20 text-green-400" : "bg-primary text-primary-foreground"),
						children: saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							className: "h-3.5 w-3.5",
							strokeWidth: 2.5
						}), "Saved"] }) : "Save"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5 px-4 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center pb-1 pt-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: avatarSrc,
									alt: "",
									className: "h-20 w-20 rounded-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
									user: avatarUser,
									size: 80
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									"aria-label": "Change photo",
									className: "absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary shadow-[0_2px_8px_oklch(0_0_0/0.5)] ring-2 ring-background transition-transform duration-200 active:scale-90",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
										className: "h-3.5 w-3.5 text-primary-foreground",
										strokeWidth: 2
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 font-ui text-[15px] font-semibold text-foreground",
								children: name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-ui text-[13px] text-muted-foreground",
								children: ["@", username]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						icon: Mail,
						title: "Contact Details",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Email address",
								value: email,
								onChange: setEmail,
								type: "email",
								placeholder: "you@example.com"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Phone number",
								value: phone,
								onChange: setPhone,
								type: "tel",
								placeholder: "+1 (000) 000-0000"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						icon: Lock,
						title: "Security",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionRow, {
								label: "Change Password",
								hint: "Last changed 3 months ago"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Divider, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
								label: "Two-Factor Authentication",
								hint: twoFa ? "Enabled via authenticator app" : "Add an extra layer of security",
								checked: twoFa,
								onChange: setTwoFa
							}),
							twoFa && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Divider, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionRow, {
								label: "Manage 2FA Devices",
								hint: "View paired authenticators"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Divider, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionRow, {
								label: "Active Sessions",
								hint: "Review where you're signed in",
								onClick: () => setSessionsOpen(true)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						icon: Link2,
						title: "Linked Accounts",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-white",
									style: { background: "#1877F2" },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialIcon, { brand: "facebook" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-1 items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[14px] font-medium text-foreground",
										children: "Facebook"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[12px] text-muted-foreground",
										children: fbOn ? "Connected" : "Not connected"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
										checked: fbOn,
										onChange: setFbOn,
										accent: "bg-[#1877F2]"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Divider, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-white",
									style: { background: "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)" },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialIcon, { brand: "instagram" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-1 items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[14px] font-medium text-foreground",
										children: "Instagram"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[12px] text-muted-foreground",
										children: igOn ? "Connected as @you" : "Not connected"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
										checked: igOn,
										onChange: setIgOn,
										accent: "bg-[#dc2743]"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Divider, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-black",
									style: { background: "#FFFC00" },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialIcon, { brand: "snapchat" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-1 items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[14px] font-medium text-foreground",
										children: "Snapchat"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[12px] text-muted-foreground",
										children: scOn ? "Connected" : "Not connected"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
										checked: scOn,
										onChange: setScOn,
										accent: "bg-[#FFFC00]"
									})]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "surface-card overflow-hidden rounded-[22px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleLogout,
							className: "flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:opacity-70",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] text-muted-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
										className: "h-[18px] w-[18px]",
										strokeWidth: 1.7
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-ui text-[14px] font-medium text-foreground",
									children: "Log Out"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
									className: "ml-auto h-4 w-4 text-muted-foreground/40",
									strokeWidth: 1.8
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						icon: Trash2,
						title: "Danger Zone",
						danger: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-ui text-[13px] leading-relaxed text-muted-foreground",
								children: "Once you delete your account, all your moments, posts, and data will be permanently removed. This action cannot be undone."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "flex w-full items-center justify-center gap-2 rounded-[13px] border border-destructive/30 bg-destructive/10 py-2.5 font-ui text-[14px] font-semibold text-destructive transition-all duration-200 hover:bg-destructive/15 active:scale-[0.98]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "h-4 w-4",
									strokeWidth: 1.8
								}), "Delete My Account"]
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActiveSessionsSheet, {
				open: sessionsOpen,
				onOpenChange: setSessionsOpen
			})
		]
	});
}
//#endregion
export { AccountPage as component };
