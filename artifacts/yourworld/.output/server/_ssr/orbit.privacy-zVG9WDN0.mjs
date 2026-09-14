import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as ShieldAlert, Ct as MapPin, En as BadgeCheck, Et as Lock, Kt as EyeOff, mn as ChevronLeft, q as ScanFace, ut as Navigation, wn as BellOff } from "../_libs/lucide-react.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-CvvqE0mJ.mjs";
import { t as Button } from "./button-QVaE-7g5.mjs";
import { t as Input } from "./input-BVD91v_k.mjs";
import { _ as useOrbitProfiles } from "./orbit-live-BqfCVEZi.mjs";
import { a as clearSessionUnlock, c as useOrbit } from "./orbit-store-oAupMLr5.mjs";
import { t as Switch } from "./switch-CBQqxPSC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit.privacy-zVG9WDN0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var VISIBILITY = [
	{
		value: "public",
		label: "Public",
		hint: "Anyone on Orbit can find you"
	},
	{
		value: "friends",
		label: "Friends",
		hint: "Only people you already follow"
	},
	{
		value: "hidden",
		label: "Hidden",
		hint: "You browse, nobody sees you"
	}
];
var AUDIENCE = [
	{
		value: "everyone",
		label: "Everyone"
	},
	{
		value: "connections",
		label: "Connections"
	},
	{
		value: "nobody",
		label: "Nobody"
	}
];
function OrbitPrivacy() {
	const orbit = useOrbit();
	const { privacy } = orbit;
	const [captureSupported, setCaptureSupported] = (0, import_react.useState)(true);
	const [pinOpen, setPinOpen] = (0, import_react.useState)(false);
	const [pin, setPin] = (0, import_react.useState)("");
	const [pinConfirm, setPinConfirm] = (0, import_react.useState)("");
	const [pinError, setPinError] = (0, import_react.useState)(null);
	const [userQuery, setUserQuery] = (0, import_react.useState)("");
	const { profiles: orbitProfiles } = useOrbitProfiles();
	const q = userQuery.trim().toLowerCase();
	const filteredProfiles = q ? orbitProfiles.filter((p) => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)) : orbitProfiles;
	(0, import_react.useEffect)(() => {
		const supported = typeof window !== "undefined" && typeof window.__ywSecureDisplay?.enable === "function";
		setCaptureSupported(!!supported);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 flex items-center gap-2 border-b border-border glass px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/orbit",
					"aria-label": "Back to Orbit",
					className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
						className: "h-5 w-5",
						strokeWidth: 1.8
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-lg font-bold",
					children: "Privacy & Safety"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5 px-4 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Orbit",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Orbit enabled",
								hint: "Turn Orbit completely off anytime",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.orbitEnabled,
									onCheckedChange: (v) => {
										orbit.setPrivacy({ orbitEnabled: v });
										toast.success(v ? "Orbit turned on" : "Orbit turned off");
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Pause Orbit Profile",
								hint: "Stay signed up but disappear from discovery",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.paused,
									onCheckedChange: (v) => {
										orbit.setPrivacy({ paused: v });
										toast.success(v ? "Orbit Profile paused" : "Orbit Profile resumed");
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Hide Orbit Profile",
								hint: "Keep your profile private while you keep browsing",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.hiddenProfile,
									onCheckedChange: (v) => {
										orbit.setPrivacy({
											hiddenProfile: v,
											...v ? { visibility: "hidden" } : {}
										});
										toast.success(v ? "Orbit Profile hidden" : "Orbit Profile visible again");
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 px-4 py-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
									className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
									strokeWidth: 1.8
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs leading-relaxed text-muted-foreground",
									children: "Your Orbit Profile stays linked to your account. You can turn Orbit off, pause it or hide it anytime — it is never shown while any of those are on."
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Private & secure",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Lock Orbit",
								hint: privacy.lockEnabled ? "A PIN or password is required to open Orbit" : "Ask for a PIN or password before Orbit opens",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.lockEnabled,
									onCheckedChange: (v) => {
										if (v) {
											setPin("");
											setPinConfirm("");
											setPinError(null);
											setPinOpen(true);
										} else {
											orbit.disableOrbitLock();
											clearSessionUnlock();
											toast.success("Orbit lock removed");
										}
									}
								})
							}),
							privacy.lockEnabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Change PIN",
								hint: "Set a new PIN or password for this device",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setPin("");
										setPinConfirm("");
										setPinError(null);
										setPinOpen(true);
									},
									className: "rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold transition-transform active:scale-95",
									children: "Change"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Hide Orbit",
								hint: "Remove Orbit from menus and search on this device",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.hideOrbitEntry,
									onCheckedChange: (v) => {
										orbit.setPrivacy({ hideOrbitEntry: v });
										toast.success(v ? "Orbit hidden from menus" : "Orbit visible in menus");
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Hide Orbit notifications",
								hint: "Mute Orbit, connection and match alerts everywhere",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.hideOrbitNotifications,
									onCheckedChange: (v) => {
										orbit.setPrivacy({ hideOrbitNotifications: v });
										toast.success(v ? "Orbit notifications hidden" : "Orbit notifications restored");
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 border-t border-border/60 px-4 py-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
									className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
									strokeWidth: 1.8
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs leading-relaxed text-muted-foreground",
									children: "Your PIN is hashed on this device and never stored or sent anywhere. If you forget it, turn the lock off from this screen after unlocking."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 border-t border-border/60 px-4 py-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, {
									className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
									strokeWidth: 1.8
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs leading-relaxed text-muted-foreground",
									children: "Hiding Orbit keeps your profile and matches intact — it only removes Orbit from view."
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Visibility",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Show my Looking For",
							hint: "Display your Looking For preference as a small badge on your Orbit profile",
							control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: privacy.showMood,
								onCheckedChange: (v) => {
									orbit.setPrivacy({ showMood: v });
									toast.success(v ? "Looking For badge shown" : "Looking For kept private");
								}
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2 px-4 py-3.5",
							children: VISIBILITY.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => orbit.setPrivacy({ visibility: v.value }),
								className: `flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.99] ${privacy.visibility === v.value ? "bg-foreground text-background" : "chip"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-medium",
									children: v.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `block text-xs ${privacy.visibility === v.value ? "opacity-70" : "text-muted-foreground"}`,
									children: v.hint
								})] })
							}, v.value))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Who can reach you",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								label: "Who can Like",
								value: privacy.whoCanLike,
								onChange: (v) => orbit.setPrivacy({ whoCanLike: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								label: "Who can Message",
								value: privacy.whoCanMessage,
								onChange: (v) => orbit.setPrivacy({ whoCanMessage: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								label: "Who can Connect",
								value: privacy.whoCanConnect,
								onChange: (v) => orbit.setPrivacy({ whoCanConnect: v })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Calls",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Allow voice & video calls",
							hint: "Calls are only ever possible after a match or connection",
							control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: privacy.callsEnabled,
								onCheckedChange: (v) => {
									orbit.setPrivacy({ callsEnabled: v });
									toast.success(v ? "Calls enabled" : "Calls turned off");
								}
							})
						}), privacy.callsEnabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							label: "Who can call you",
							value: privacy.whoCanCall,
							onChange: (v) => orbit.setPrivacy({ whoCanCall: v })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Live location",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Allow live location sharing",
								hint: "Off by default — nothing is shared until you start a session",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.liveLocationEnabled,
									onCheckedChange: (v) => {
										orbit.setPrivacy({ liveLocationEnabled: v });
										toast.success(v ? "Live location sharing available" : "Live location sharing disabled");
									}
								})
							}),
							privacy.liveLocationEnabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								label: "Who can request live location",
								value: privacy.whoCanRequestLiveLocation,
								onChange: (v) => orbit.setPrivacy({ whoCanRequestLiveLocation: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 border-t border-border/60 px-4 py-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, {
									className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
									strokeWidth: 1.8
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs leading-relaxed text-muted-foreground",
									children: "Each session asks for permission, runs only for the window you pick, and can be stopped with one tap from the chat."
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Hide from specific users",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-4 pt-3.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: userQuery,
								onChange: (e) => setUserQuery(e.target.value),
								placeholder: "Search users",
								"aria-label": "Search users",
								className: "rounded-2xl"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "px-4 py-2",
							children: [filteredProfiles.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between border-b border-border/60 py-3 last:border-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate text-sm font-medium",
										children: p.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block truncate text-xs text-muted-foreground",
										children: ["@", p.handle]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => orbit.toggleHiddenFrom(p.id),
										className: `rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${privacy.hiddenFrom.includes(p.id) ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
										children: privacy.hiddenFrom.includes(p.id) ? "Hidden" : "Hide"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => orbit.toggleBlocked(p.id),
										className: `rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${privacy.blocked.includes(p.id) ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground"}`,
										children: privacy.blocked.includes(p.id) ? "Blocked" : "Block"
									})]
								})]
							}, p.id)), filteredProfiles.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "py-4 text-center text-xs text-muted-foreground",
								children: "No users found"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Safety",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "AI fake profile detection",
								hint: "Scans public profile details on your device and labels suspicious accounts",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.aiFakeDetection,
									onCheckedChange: (v) => {
										orbit.setPrivacy({ aiFakeDetection: v });
										toast.success(v ? "Fake profile detection on" : "Fake profile detection off");
									}
								})
							}),
							privacy.aiFakeDetection && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Hide flagged profiles",
								hint: "Remove likely fake accounts from discovery instead of just labelling them",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.hideFlaggedProfiles,
									onCheckedChange: (v) => orbit.setPrivacy({ hideFlaggedProfiles: v })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 border-t border-border/60 px-4 py-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanFace, {
									className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
									strokeWidth: 1.8
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs leading-relaxed text-muted-foreground",
									children: "Detection runs entirely on your device using public profile details. It's a signal, not a guarantee — always report anything that feels off."
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						title: "Verified badge",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Optional verification",
							hint: privacy.verification === "verified" ? "Your Orbit Profile shows a verified badge" : privacy.verification === "pending" ? "Review in progress — usually under 48 hours" : "Completely optional. Orbit works fully without it.",
							control: privacy.verification === "verified" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
								className: "h-5 w-5 fill-[oklch(0.62_0.17_255)] text-background",
								strokeWidth: 1.8
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: privacy.verification === "pending",
								onClick: () => {
									orbit.setPrivacy({ verification: "pending" });
									toast.success("Verification request submitted");
								},
								className: "rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-transform active:scale-95 disabled:opacity-50",
								children: privacy.verification === "pending" ? "Pending" : "Request"
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						title: "Location",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3 px-4 py-3.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
								className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
								strokeWidth: 1.8
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs leading-relaxed text-muted-foreground",
								children: "Orbit only ever shows an approximate area and a rounded distance band. Exact coordinates are never stored or shared, and this cannot be turned off."
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						title: "Screen capture",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Prevent screenshots & recording",
								hint: "Enforced by the device wherever supported",
								control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: privacy.screenshotProtection,
									onCheckedChange: (v) => {
										orbit.setPrivacy({ screenshotProtection: v });
										if (v && !captureSupported) toast.warning("This device can't block screenshots — Orbit will hide content when the app leaves the screen instead.");
									}
								})
							}),
							privacy.screenshotProtection && !captureSupported && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 border-t border-border/60 px-4 py-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
									className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
									strokeWidth: 1.8
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs leading-relaxed text-muted-foreground",
									children: "Your device or browser doesn't support blocking screen capture. Orbit falls back to blurring content whenever the app is backgrounded or loses focus."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border-t border-border/60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: "Notify me about screen capture",
									hint: "Notify me if someone takes a screenshot or screen recording (on supported devices). If detected, both users are instantly notified.",
									control: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: privacy.screenshotAlerts,
										onCheckedChange: (v) => {
											orbit.setPrivacy({ screenshotAlerts: v });
											toast.success(v ? "Screen capture alerts on" : "Screen capture alerts off");
										}
									})
								})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: pinOpen,
				onOpenChange: setPinOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Set Orbit PIN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "4 characters or more. Stored hashed on this device only." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								inputMode: "numeric",
								value: pin,
								maxLength: 64,
								autoComplete: "new-password",
								onChange: (e) => {
									setPin(e.target.value);
									setPinError(null);
								},
								placeholder: "New PIN or password",
								"aria-label": "New Orbit PIN",
								className: "h-11 rounded-xl"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								inputMode: "numeric",
								value: pinConfirm,
								maxLength: 64,
								autoComplete: "new-password",
								onChange: (e) => {
									setPinConfirm(e.target.value);
									setPinError(null);
								},
								placeholder: "Confirm PIN",
								"aria-label": "Confirm Orbit PIN",
								className: "h-11 rounded-xl"
							}),
							pinError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-destructive",
								children: pinError
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3 pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									className: "h-11 rounded-full",
									onClick: () => setPinOpen(false),
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "h-11 rounded-full",
									onClick: async () => {
										if (pin.trim().length < 4) return setPinError("Use at least 4 characters.");
										if (pin !== pinConfirm) return setPinError("PINs don't match.");
										await orbit.setOrbitPin(pin);
										setPinOpen(false);
										setPin("");
										setPinConfirm("");
										toast.success("Orbit lock enabled");
									},
									children: "Save PIN"
								})]
							})
						]
					})]
				})
			})
		]
	});
}
function Card({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "pb-2 pl-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "surface-card overflow-hidden rounded-3xl",
		children
	})] });
}
function Row({ label, hint, control }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 border-b border-border/60 px-4 py-3.5 last:border-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-sm font-medium",
				children: label
			}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-xs text-muted-foreground",
				children: hint
			})]
		}), control]
	});
}
function Segmented({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-b border-border/60 px-4 py-3.5 last:border-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "pb-2 text-sm font-medium",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 gap-2",
			children: AUDIENCE.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onChange(a.value),
				className: `rounded-full py-2 text-xs font-medium transition-all active:scale-95 ${value === a.value ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
				children: a.label
			}, a.value))
		})]
	});
}
//#endregion
export { OrbitPrivacy as component };
