import React, { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  User, Megaphone, Lock, Bell, Palette, HelpCircle, Info, LogOut, ChevronRight, ArrowLeft, X, Wallet,
  Check, Monitor, Moon, Sparkles, Sun, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { historyBackOr } from "@/lib/navigation";
import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl, setUserBlock } from "@/lib/social-data";
import { THEME_OPTIONS, useTheme, type ThemeChoice } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — YourWorld" },
      {
        name: "description",
        content:
          "Manage your YourWorld account, privacy, notifications, appearance and support preferences in one place.",
      },
      { property: "og:title", content: "Settings — YourWorld" },
      {
        property: "og:description",
        content: "Account, privacy, notifications, appearance and support settings for YourWorld.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

type PanelId = "privacy" | "notifications" | "appearance" | "help" | "about";

type BlockedAccount = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [reportStep, setReportStep] = useState<"options" | "dmca" | null>(null);
  const [dmca, setDmca] = useState({ contentLink: "", originalWork: "", description: "", email: "", fullName: "" });
  const [dmcaAgree, setDmcaAgree] = useState(false);
  const [submittingDmca, setSubmittingDmca] = useState(false);
  const [blockedAccountsOpen, setBlockedAccountsOpen] = useState(false);
  const [blockedAccounts, setBlockedAccounts] = useState<BlockedAccount[]>([]);
  const [blockedAccountsLoading, setBlockedAccountsLoading] = useState(false);
  const [blockedAccountsError, setBlockedAccountsError] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const selectedTheme = THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[1];

  useEffect(() => {
    if (!blockedAccountsOpen || !user) return;
    let alive = true;
    setBlockedAccountsLoading(true);
    setBlockedAccountsError(false);

    void (async () => {
      const { data: blockRows, error: blockError } = await supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id);

      if (!alive) return;
      if (blockError) {
        console.error("[settings] Could not load blocked accounts", blockError);
        setBlockedAccounts([]);
        setBlockedAccountsError(true);
        setBlockedAccountsLoading(false);
        return;
      }

      const blockedIds = [...new Set((blockRows ?? []).map((row) => row.blocked_id))];
      if (!blockedIds.length) {
        setBlockedAccounts([]);
        setBlockedAccountsLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase.rpc("get_public_profiles", {
        ids: blockedIds,
      });

      if (!alive) return;
      if (profileError) {
        console.error("[settings] Could not load blocked account profiles", profileError);
        setBlockedAccounts([]);
        setBlockedAccountsError(true);
        setBlockedAccountsLoading(false);
        return;
      }

      const next = await Promise.all(
        (profiles as PublicProfile[] | null ?? []).map(async (profile) => ({
          id: profile.id,
          username: profile.username?.trim() || "user",
          displayName:
            profile.display_name?.trim() ||
            profile.username?.trim() ||
            "YourWorld user",
          avatarUrl: profile.avatar_url
            ? await resolveMediaUrl(profile.avatar_url, "avatars")
            : null,
        })),
      );
      if (!alive) return;
      setBlockedAccounts(next);
      setBlockedAccountsLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [blockedAccountsOpen, user]);

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
      infringing_content_link: contentLink.slice(0, 2000),
      original_work_link: originalWork.slice(0, 2000),
      reason: description.slice(0, 2000),
      contact_email: email.slice(0, 255),
    });
    setSubmittingDmca(false);
    if (error) {
      toast.error("Could not submit report. Please try again.");
      return;
    }
    toast.success("DMCA report submitted successfully");
    setDmca({ contentLink: "", originalWork: "", description: "", email: "", fullName: "" });
    setDmcaAgree(false);
    setReportStep(null);
    setPanel(null);
  };


  const [toggles, setToggles] = useState<Record<string, boolean>>({
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
    compact: false,
  });
  const flip = (k: string) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-4 font-sans text-foreground select-none">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button
          onClick={() => historyBackOr(() => void navigate({ to: "/profile" }))}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="space-y-1 rounded-2xl border border-border bg-card p-2">
        
        {/* Account */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate({ to: "/account" })}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <User className="text-muted-foreground" size={20} />
            <span className="font-semibold text-sm">Account</span>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Create Channel - ROUTE FIXED TO MAIN CHANNEL SCREEN */}
        <div 
          onClick={() => navigate({ to: "/channel/create" })}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <Megaphone className="text-muted-foreground" size={20} />
            <div>
              <div className="font-semibold text-sm">Create Channel</div>
              <div className="text-[11px] text-muted-foreground">Videos, reels, posts & analytics</div>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Monetization & Wallet */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate({ to: "/wallet" })}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <Wallet className="text-muted-foreground" size={20} />
            <div>
              <div className="font-semibold text-sm">Monetization & Wallet</div>
              <div className="text-[11px] text-muted-foreground">Earnings, courses, payouts & tax invoices</div>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Privacy */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setPanel("privacy")}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <Lock className="text-muted-foreground" size={20} />
            <div>
              <div className="font-semibold text-sm">Privacy & Downloads</div>
              <div className="text-[11px] text-muted-foreground">Blocked accounts</div>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Notifications */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setPanel("notifications")}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <Bell className="text-muted-foreground" size={20} />
            <div>
              <div className="font-semibold text-sm">Notifications</div>
              <div className="text-[11px] text-muted-foreground">Likes, channel & system alerts</div>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Appearance */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setPanel("appearance")}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <Palette className="text-muted-foreground" size={20} />
            <span className="font-semibold text-sm">Appearance</span>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Help & Support */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setPanel("help")}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <HelpCircle className="text-muted-foreground" size={20} />
            <span className="font-semibold text-sm">Help & Support</span>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* About */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setPanel("about")}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <Info className="text-muted-foreground" size={20} />
            <span className="font-semibold text-sm">About</span>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
           className="flex w-full cursor-pointer items-center gap-4 rounded-xl border-t border-border p-3.5 pt-2 text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} />
          <span className="font-semibold text-sm">Log Out</span>
        </button>

      </div>

      {panel === "privacy" && (
        <Panel title="Privacy & Downloads" onClose={() => setPanel(null)}>
          <Toggle label="Private account" hint="Only approved followers can see your posts" on={toggles.privateAccount} onClick={() => flip("privateAccount")} />
          <Toggle label="Allow downloads" hint="Let others save your reels with watermark" on={toggles.allowDownloads} onClick={() => flip("allowDownloads")} />
          <Toggle label="Show activity status" hint="Display when you were last active" on={toggles.activityStatus} onClick={() => flip("activityStatus")} />
          <Row
            label="Blocked accounts"
            hint="Manage people you have blocked"
            onClick={() => setBlockedAccountsOpen(true)}
          />
        </Panel>
      )}

      {blockedAccountsOpen && (
        <Panel
          title="Blocked Accounts"
          onClose={() => setBlockedAccountsOpen(false)}
          backLabel="Back to Privacy & Downloads"
        >
          {blockedAccountsLoading ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">Loading blocked accounts…</div>
          ) : blockedAccountsError ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              Could not load blocked accounts. Please try again.
            </div>
          ) : blockedAccounts.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <div className="text-sm font-semibold text-foreground">No blocked accounts</div>
              <div className="mt-1 text-xs text-muted-foreground">People you block will appear here.</div>
            </div>
          ) : (
            <div className="space-y-1">
              {blockedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50"
                >
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
                    >
                      {account.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{account.displayName}</div>
                    <div className="truncate text-xs text-muted-foreground">@{account.username}</div>
                  </div>
                  <button
                    type="button"
                    disabled={unblockingId === account.id}
                    onClick={() => {
                      if (!user) return;
                      setUnblockingId(account.id);
                      void (async () => {
                        const error = await setUserBlock(user.id, account.id, false);
                        if (error) {
                          toast.error("Could not unblock this account. Please try again.");
                        } else {
                          setBlockedAccounts((current) => current.filter((item) => item.id !== account.id));
                          toast.success(`@${account.username} unblocked`);
                        }
                        setUnblockingId(null);
                      })();
                    }}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unblockingId === account.id ? "Unblocking…" : "Unblock"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {panel === "notifications" && (
        <Panel title="Notifications" onClose={() => setPanel(null)}>
          <Toggle label="Likes" on={toggles.likes} onClick={() => flip("likes")} />
          <Toggle label="Comments" on={toggles.comments} onClick={() => flip("comments")} />
          <Toggle label="New followers" on={toggles.followers} onClick={() => flip("followers")} />
          <Toggle label="Messages" on={toggles.messages} onClick={() => flip("messages")} />
          <Toggle label="Channel & monetization" on={toggles.channel} onClick={() => flip("channel")} />
          <Toggle label="System alerts" on={toggles.system} onClick={() => flip("system")} />
          <Row label="Open activity feed" onClick={() => navigate({ to: "/notifications" })} />
        </Panel>
      )}

      {panel === "appearance" && (
        <Panel title="Appearance" onClose={() => setPanel(null)}>
          <Row
            label="Theme"
            hint={`${selectedTheme.label}${theme === "auto" ? " · follows system" : ""}`}
            onClick={() => setThemeOpen(true)}
          />
          <Toggle label="Reduce motion" hint="Minimise animations and transitions" on={toggles.reduceMotion} onClick={() => flip("reduceMotion")} />
          <Toggle label="Compact layout" hint="Tighter spacing in feed and lists" on={toggles.compact} onClick={() => flip("compact")} />
        </Panel>
      )}

      {themeOpen && (
        <ColorThemeSheet
          selectedTheme={theme}
          onSelect={setTheme}
          onClose={() => setThemeOpen(false)}
        />
      )}

      {panel === "help" && (
        <Panel title="Help & Support" onClose={() => setPanel(null)}>
          <Row
            label="Help center"
            hint="Guides and troubleshooting"
            onClick={() => navigate({ to: "/help-center" })}
          />
          <Row label="Report a problem" hint="Tell us what went wrong" onClick={() => setReportStep("options")} />
          <Row
            label="Community guidelines"
            hint="Keep YourWorld safe and positive"
            onClick={() => navigate({ to: "/community-guidelines" })}
          />
          <Row
            label="Copyright & DMCA Policy"
            hint="Takedown procedure & Safe Harbor"
            onClick={() => navigate({ to: "/copyright-policy" })}
          />
          <Row
            label="Contact support"
            hint="Yourworld2029@gmail.com"
            onClick={() => {
              window.location.href = "mailto:Yourworld2029@gmail.com";
            }}
          />
        </Panel>
      )}

      {reportStep === "options" && (
        <Panel title="Report a problem" onClose={() => setReportStep(null)}>
          <Row label="Copyright Infringement (DMCA)" hint="Report stolen content" onClick={() => setReportStep("dmca")} />
          <Row
            label="Technical Bug"
            hint="App errors or crashes"
            onClick={() => {
              window.location.href = "mailto:Yourworld2029@gmail.com?subject=" + encodeURIComponent("Technical Bug Report");
            }}
          />
          <Row
            label="Community Violation"
            hint="Harassment, spam or abuse"
            onClick={() => {
              window.location.href = "mailto:Yourworld2029@gmail.com?subject=" + encodeURIComponent("Community Violation Report");
            }}
          />
        </Panel>
      )}

      {reportStep === "dmca" && (
        <Panel title="DMCA Takedown Request" onClose={() => setReportStep(null)}>
          <div className="space-y-3 p-1">
            <DmcaField
              label="Content Link / ID *"
              value={dmca.contentLink}
              onChange={(v) => setDmca((d) => ({ ...d, contentLink: v }))}
              placeholder="Link or ID of the infringing content"
            />
            <DmcaField
              label="Original Work / Proof URL *"
              type="url"
              value={dmca.originalWork}
              onChange={(v) => setDmca((d) => ({ ...d, originalWork: v }))}
              placeholder="https://link-to-your-original-work"
            />
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Description of ownership *</label>
              <textarea
                value={dmca.description}
                onChange={(e) => setDmca((d) => ({ ...d, description: e.target.value }))}
                placeholder="Explain that you own the original work"
                maxLength={2000}
                rows={4}
                className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>
            <DmcaField
              label="Your Full Legal Name *"
              value={dmca.fullName}
              onChange={(v) => setDmca((d) => ({ ...d, fullName: v }))}
              placeholder="Full name of rights owner or agent"
            />
            <DmcaField
              label="Contact Email *"
              type="email"
              value={dmca.email}
              onChange={(v) => setDmca((d) => ({ ...d, email: v }))}
              placeholder="you@example.com"
            />
            <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-3">
              <input
                type="checkbox"
                checked={dmcaAgree}
                onChange={(e) => setDmcaAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
              />
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                I confirm under penalty of perjury/account termination that I am the rightful owner or authorized agent of
                this copyrighted content.
              </span>
            </label>
            <button
              onClick={submitDmca}
              disabled={submittingDmca || !dmcaAgree}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submittingDmca ? "Submitting…" : "Submit DMCA Report"}
            </button>

          </div>
        </Panel>
      )}

      {panel === "about" && (
        <Panel title="About" onClose={() => setPanel(null)}>
          <Row label="YourWorld" hint="Version 1.0.0" />
          <Row label="Terms of Service" onClick={() => navigate({ to: "/terms" })} />
          <Row label="Privacy Policy" onClick={() => navigate({ to: "/privacy" })} />
          <Row
            label="Copyright & DMCA Policy"
            hint="Takedown procedure & Safe Harbor"
            onClick={() => navigate({ to: "/copyright-policy" })}
          />
          <Row label="Licenses" onClick={() => navigate({ to: "/licenses" })} />
        </Panel>
      )}
    </div>
  );
}

function ColorThemeSheet({
  selectedTheme,
  onSelect,
  onClose,
}: {
  selectedTheme: ThemeChoice;
  onSelect: (theme: ThemeChoice) => void;
  onClose: () => void;
}) {
  return (
    <Panel title="Color Theme" onClose={onClose}>
      <div className="mb-3 rounded-2xl border border-border bg-muted/30 p-3">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Palette size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold">Make YourWorld yours</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Themes apply instantly across cards, sheets, navigation and form controls.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2.5" role="radiogroup" aria-label="Color theme">
        {THEME_OPTIONS.map((option) => {
          const active = selectedTheme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(option.id)}
              className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all ${
                active
                  ? "border-primary/70 bg-primary/8 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_20%,transparent),0_12px_28px_-20px_var(--primary)]"
                  : "border-border/70 bg-background/45 hover:border-foreground/20 hover:bg-muted/50"
              }`}
            >
              <ThemePreview option={option} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{option.label}</span>
                  <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em] text-primary">
                    {option.badge}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors ${
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"
                }`}
                aria-hidden="true"
              >
                <Check size={14} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function ThemePreview({
  option,
}: {
  option: (typeof THEME_OPTIONS)[number];
}) {
  const PreviewIcon =
    option.id === "auto"
      ? Monitor
      : option.id === "daylight"
        ? Sun
        : option.id === "neon"
          ? Zap
          : option.id === "midnight"
            ? Moon
            : Sparkles;

  return (
    <span
      className="relative grid h-[58px] w-[74px] shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 shadow-inner"
      style={{ backgroundColor: option.preview.background }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-x-2 bottom-2 top-3 rounded-lg border border-white/10 p-1.5"
        style={{ backgroundColor: option.preview.surface }}
      >
        <span className="block h-1.5 w-9 rounded-full" style={{ backgroundColor: option.preview.accent }} />
        <span className="mt-1.5 block h-1 w-12 rounded-full bg-white/20" />
        <span className="mt-1 block h-1 w-8 rounded-full bg-white/10" />
      </span>
      <span
        className="relative z-10 grid h-7 w-7 place-items-center rounded-full border border-white/25 shadow-lg"
        style={{ backgroundColor: option.preview.accent, color: option.preview.background }}
      >
        <PreviewIcon size={14} strokeWidth={2.5} />
      </span>
      <span
        className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: option.preview.secondary }}
      />
    </span>
  );
}

function Panel({
  title,
  onClose,
  children,
  backLabel,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  backLabel?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-4 text-card-foreground sm:max-w-md sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label={backLabel ?? "Close"}
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            {backLabel ? <ArrowLeft size={18} /> : <X size={18} />}
          </button>
        </div>
        <div className="space-y-1">{children}</div>
      </div>
    </div>
  );
}
function Row({ label, hint, onClick }: { label: string; hint?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-muted/50"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
      <ChevronRight className="text-muted-foreground" size={18} />
    </button>
  );
}

function DmcaField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={2000}
        className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function Toggle({ label, hint, on, onClick }: { label: string; hint?: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl p-3">
      <span className="min-w-0 pr-3">
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onClick}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}
