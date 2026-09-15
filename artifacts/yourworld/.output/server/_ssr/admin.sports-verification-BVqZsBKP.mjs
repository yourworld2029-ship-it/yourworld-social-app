import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { An as ArrowLeft, B as ShieldAlert, Dn as BadgeCheck, Wt as FileText, Zt as Earth, _n as Check, b as Trophy, h as UserRound, i as X } from "../_libs/lucide-react.mjs";
import { F as resolveMediaUrl, _t as STORAGE_BUCKETS, m as useAuth } from "./router-DSPbIB2C.mjs";
import { i as getSportsProfile } from "./SportsProfile-BLQg8ciW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.sports-verification-BVqZsBKP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminSportsVerification() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [isAdmin, setIsAdmin] = (0, import_react.useState)(null);
	const [applications, setApplications] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		(async () => {
			if (!user) {
				setIsAdmin(false);
				return;
			}
			const { data, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
			if (!alive) return;
			if (roleError) {
				setIsAdmin(false);
				return;
			}
			setIsAdmin(Boolean(data?.length));
		})();
		return () => {
			alive = false;
		};
	}, [user]);
	const load = (0, import_react.useCallback)(async () => {
		setLoading(true);
		setError(null);
		const { data, error: profileError } = await supabase.from("profiles").select("*").eq("verification_requested", true).order("updated_at", { ascending: false }).limit(100);
		if (profileError) {
			setError(profileError.message);
			setLoading(false);
			return;
		}
		const pendingSportsProfiles = (data ?? []).map((profile) => ({
			profile,
			sportsProfile: toSportsProfile(profile)
		})).filter((entry) => Boolean(entry.sportsProfile));
		const next = await Promise.all(pendingSportsProfiles.map(async ({ profile, sportsProfile }) => {
			const [avatarUrl, sportsIntroductionUrl, documents] = await Promise.all([
				profile.avatar_url ? resolveMediaUrl(profile.avatar_url, STORAGE_BUCKETS.avatars) : null,
				sportsProfile.sportsIntroductionPath ? resolveMediaUrl(sportsProfile.sportsIntroductionPath, STORAGE_BUCKETS.videos) : null,
				loadDocuments(profile.id)
			]);
			return {
				profile,
				sportsProfile,
				avatarUrl,
				sportsIntroductionUrl,
				documents
			};
		}));
		setApplications(next);
		setLoading(false);
	}, []);
	(0, import_react.useEffect)(() => {
		if (isAdmin) load();
	}, [isAdmin, load]);
	const updateApplication = async (application, decision) => {
		setBusy(application.profile.id);
		const { error: updateError } = await supabase.from("profiles").update({
			is_verified: decision === "approve",
			verification_requested: false
		}).eq("id", application.profile.id);
		setBusy(null);
		if (updateError) {
			toast.error(updateError.message);
			return;
		}
		setApplications((current) => current.filter((entry) => entry.profile.id !== application.profile.id));
		toast.success(decision === "approve" ? "Sports Profile verified" : "Verification rejected");
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
					children: "You do not have access to Sports Verification review."
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-[#09090b] p-4 text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 mt-2 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => navigate({ to: "/profile" }),
						className: "p-1 text-zinc-300 hover:text-white",
						"aria-label": "Back to profile",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-bold",
						children: "Sports Verification"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-zinc-500",
						children: "Review submitted Sports Profiles."
					})] })]
				}),
				loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-zinc-400",
					children: "Loading applications…"
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200",
					children: error
				}) : null,
				!loading && !error && applications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-sm text-zinc-400",
					children: "No pending Sports Verification applications."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-5",
					children: applications.map((application) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationCard, {
						application,
						busy: busy === application.profile.id,
						onApprove: () => void updateApplication(application, "approve"),
						onReject: () => void updateApplication(application, "reject"),
						onKeepPending: () => toast.success("Application remains pending")
					}, application.profile.id))
				})
			]
		})
	});
}
function ApplicationCard({ application, busy, onApprove, onReject, onKeepPending }) {
	const { profile, sportsProfile } = application;
	const title = sportsProfile.status === "Not recorded" ? `${sportsProfile.role}` : `${sportsProfile.status.toUpperCase()} ${sportsProfile.role.toUpperCase()}`;
	const qualification = [sportsProfile.coachQualification, sportsProfile.qualificationYear].filter((value) => value !== "Not recorded").join(" · ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-3xl border border-amber-200/20 bg-[#141418] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.2)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [application.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: application.avatarUrl,
					alt: "",
					className: "h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-amber-200/30"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-100",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-6 w-6" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-lg font-semibold",
							children: profile.display_name || profile.username || "Unnamed applicant"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-zinc-500",
							children: ["@", profile.username || "—"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1 rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-1 text-[10px] font-bold text-amber-100",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-3.5 w-3.5" }), title]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200",
								children: "Pending"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-2 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewValue, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, {}),
						label: "Sport",
						value: sportsProfile.sport
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewValue, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {}),
						label: "Role",
						value: sportsProfile.role
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewValue, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, {}),
						label: "Representation",
						value: sportsProfile.represents
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReviewSection, {
						title: "Qualification",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: qualification || "Not recorded" }),
							sportsProfile.institution !== "Not recorded" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1",
								children: ["Institution: ", sportsProfile.institution]
							}) : null,
							sportsProfile.coachingExperience !== "Not recorded" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 whitespace-pre-wrap",
								children: ["Experience: ", sportsProfile.coachingExperience]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
						title: "Achievements",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewList, {
							items: sportsProfile.achievements,
							empty: "No achievements submitted."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
						title: "Tournament details",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewList, {
							items: sportsProfile.tournaments,
							empty: "No tournament details submitted."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
						title: "Medals",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewList, {
							items: sportsProfile.medals,
							empty: "No medals submitted."
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
					title: "Sports Introduction",
					children: application.sportsIntroductionUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: application.sportsIntroductionUrl,
						controls: true,
						playsInline: true,
						preload: "metadata",
						className: "aspect-[9/16] max-h-80 w-full rounded-xl bg-black object-contain"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No Sports Introduction submitted." })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
					title: "Verification documents",
					children: application.documents.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: application.documents.map((document) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: document.url ?? void 0,
							target: "_blank",
							rel: "noreferrer noopener",
							className: `flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-2 ${document.url ? "text-amber-100 hover:bg-white/[0.08]" : "text-zinc-500"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 truncate",
								children: document.name
							})]
						}, document.path))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No verification documents submitted." })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onApprove,
						disabled: busy,
						className: "inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 16 }), " Approve / Verify"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onReject,
						disabled: busy,
						className: "inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/25 disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 }), " Reject"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onKeepPending,
						disabled: busy,
						className: "inline-flex items-center gap-2 rounded-xl border border-amber-200/20 px-4 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 disabled:opacity-50",
						children: "Keep Pending"
					})
				]
			})
		]
	});
}
function ReviewValue({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-white/10 bg-white/[0.035] p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "h-3.5 w-3.5",
				children: icon
			}), label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 truncate text-sm font-semibold text-white",
			children: value
		})]
	});
}
function ReviewSection({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-zinc-300",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 text-xs font-bold uppercase tracking-wider text-amber-200/80",
			children: title
		}), children]
	});
}
function ReviewList({ items, empty }) {
	return items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "list-disc space-y-1 pl-4",
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: "whitespace-pre-wrap",
			children: item
		}, item))
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: empty });
}
function toSportsProfile(profile) {
	return getSportsProfile({
		is_verified: profile.is_verified === true,
		category: profile.category ?? "",
		bio: profile.bio ?? "",
		location: profile.location ?? "",
		username: profile.username ?? void 0,
		displayName: profile.display_name ?? void 0,
		verification_requested: profile.verification_requested === true
	});
}
async function loadDocuments(ownerId) {
	const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.documents).list(ownerId, {
		limit: 100,
		sortBy: {
			column: "created_at",
			order: "desc"
		}
	});
	if (error) return [];
	return await Promise.all((data ?? []).filter((file) => Boolean(file.id && file.name)).map(async (file) => {
		const path = `${ownerId}/${file.name}`;
		const { data: signed } = await supabase.storage.from(STORAGE_BUCKETS.documents).createSignedUrl(path, 3600);
		return {
			path,
			name: file.name,
			mimeType: file.metadata?.mimetype ?? "application/octet-stream",
			size: typeof file.metadata?.size === "number" ? file.metadata.size : null,
			url: signed?.signedUrl ?? null
		};
	}));
}
//#endregion
export { AdminSportsVerification as component };
