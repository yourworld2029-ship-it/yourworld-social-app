import React, { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  User, BarChart2, Lock, Bell, HelpCircle, Info, LogOut, ChevronRight, ArrowLeft, X, Wallet,
  Star, Search, Gauge, MessageCircle, Clock3, Languages, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { useAdminAccess } from "@/lib/use-admin-access";
import { hasAdminConsoleAccess } from "@/lib/admin-access-policy";
import { historyBackOr } from "@/lib/navigation";
import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl, setUserBlock } from "@/lib/social-data";
import { useFollowList } from "@/lib/follow-data";
import { setLongVideoCreatorHidden } from "@/lib/long-video-preferences";
import { announceVideoCreatorRestored, announceVideoPostRestored } from "@/lib/video-context-actions";
import { useUserPreferences } from "@/lib/user-preferences";
import { formatDailyUsage, readDailyUsageSeconds, subscribeToDailyUsage } from "@/lib/daily-usage";
import { useAppLanguage } from "@/lib/app-language";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — YourWorld" },
      {
        name: "description",
        content:
          "Manage your YourWorld account, privacy, notifications and support preferences in one place.",
      },
      { property: "og:title", content: "Settings — YourWorld" },
      {
        property: "og:description",
        content: "Account, privacy, notifications and support settings for YourWorld.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

type PanelId =
  | "privacy"
  | "notifications"
  | "help"
  | "about"
  | "close-friends"
  | "hidden-creators"
  | "not-interested-posts"
  | "data-quality"
  | "messages-privacy"
  | "comments-hidden-words"
  | "time-management"
  | "app-language";

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

type ManagedCreator = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type NotInterestedPost = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  createdAt: string | null;
};

function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const adminAccess = useAdminAccess();
  const showAdminConsole =
    Boolean(user) &&
    (hasAdminConsoleAccess(user?.email, null) ||
      adminAccess.status === "checking" ||
      adminAccess.status === "allowed");
  const { language, setLanguage, t } = useAppLanguage();
  const queryClient = useQueryClient();
  const { preferences, savePreference } = useUserPreferences(user?.id);
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
  const [hiddenWordDraft, setHiddenWordDraft] = useState("");

  const addHiddenWord = () => {
    const word = hiddenWordDraft.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!word) return;
    if (preferences.hiddenWords.some((item) => item.toLowerCase() === word.toLowerCase())) {
      toast.error("That word is already in your hidden list.");
      return;
    }
    if (preferences.hiddenWords.length >= 50) {
      toast.error("You can add up to 50 hidden words.");
      return;
    }
    savePreference("hiddenWords", [...preferences.hiddenWords, word]);
    setHiddenWordDraft("");
  };

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
    let reportedPostId: string | null = null;
    try {
      const reportedUrl = new URL(contentLink);
      if (reportedUrl.origin === window.location.origin) {
        const match = /^\/(?:watch|video)\/([0-9a-f-]{36})\/?$/i.exec(reportedUrl.pathname);
        if (match) reportedPostId = match[1];
      }
    } catch {
      // The earlier validation handles malformed URLs; retain the submitted link either way.
    }
    setSubmittingDmca(true);
    const { error } = await supabase.from("copyright_reports").insert({
      reporter_user_id: user.id,
      reporter_full_name: fullName.slice(0, 200),
      reported_post_id: reportedPostId,
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
    calls: true,
    channel: true,
    system: true,
  });
  const [privateAccountReady, setPrivateAccountReady] = useState(false);
  const [privateAccountSaving, setPrivateAccountSaving] = useState(false);
  const flip = (k: string) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  useEffect(() => {
    let active = true;
    setPrivateAccountReady(false);

    if (!user?.id) {
      setToggles((current) => ({ ...current, privateAccount: false }));
      return () => {
        active = false;
      };
    }

    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_private")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        toast.error("Could not load your account privacy setting.");
        return;
      }

      setToggles((current) => ({
        ...current,
        privateAccount: data.is_private,
      }));
      setPrivateAccountReady(true);
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const togglePrivateAccount = async () => {
    if (!user?.id || !privateAccountReady || privateAccountSaving) return;

    const nextValue = !toggles.privateAccount;
    setPrivateAccountSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_private: nextValue })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        toast.error(error?.message || "Could not save your account privacy setting.");
        return;
      }

      setToggles((current) => ({ ...current, privateAccount: nextValue }));
      toast.success(
        nextValue
          ? "Private account enabled. Watch time from private periods will not count."
          : "Public account enabled. New public watch time can count.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save your account privacy setting.",
      );
    } finally {
      setPrivateAccountSaving(false);
    }
  };

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    // This clears only in-memory server query state; offline media and the
    // device-wide download index live in separate storage, not this cache.
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-4 font-sans text-foreground select-none">
      
      {/* Header */}
      <header className="settings-header mb-6 mt-2 flex items-center gap-3">
        <button
          onClick={() => historyBackOr(() => void navigate({ to: "/profile" }))}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("settingsTitle")}</h1>
      </header>

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
            <span className="font-semibold text-sm">{t("account")}</span>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Creator analytics */}
        <div 
          onClick={() => navigate({ to: "/channel/analytics" })}
           className="flex cursor-pointer items-center justify-between rounded-xl p-3.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <BarChart2 className="text-muted-foreground" size={20} />
            <div>
              <div className="font-semibold text-sm">{t("creatorAnalytics")}</div>
              <div className="text-[11px] text-muted-foreground">{t("creatorAnalyticsHint")}</div>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {showAdminConsole ? (
          <SettingsEntry
            icon={<ShieldCheck className="text-muted-foreground" size={20} />}
            label="Admin Console"
            hint="Manage YourWorld administration"
            onClick={() => navigate({ to: "/admin" })}
          />
        ) : null}

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
              <div className="font-semibold text-sm">{t("monetizationWallet")}</div>
              <div className="text-[11px] text-muted-foreground">{t("monetizationWalletHint")}</div>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        <SettingsEntry
          icon={<Gauge className="text-muted-foreground" size={20} />}
          label={t("dataMediaQuality")}
          hint={t("dataMediaQualityHint")}
          onClick={() => setPanel("data-quality")}
        />
        <SettingsEntry
          icon={<Languages className="text-muted-foreground" size={20} />}
          label={t("appLanguage")}
          hint={t("appLanguageHint")}
          onClick={() => setPanel("app-language")}
        />

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
              <div className="font-semibold text-sm">{t("privacy")}</div>
              <div className="text-[11px] text-muted-foreground">{t("privacyHint")}</div>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        <SettingsEntry
          icon={<MessageCircle className="text-muted-foreground" size={20} />}
          label={t("messagesDirectRequests")}
          hint={t("messagesDirectRequestsHint")}
          onClick={() => setPanel("messages-privacy")}
        />

        <SettingsEntry
          icon={<Clock3 className="text-muted-foreground" size={20} />}
          label={t("timeManagement")}
          hint={t("timeManagementHint")}
          onClick={() => setPanel("time-management")}
        />

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
              <div className="font-semibold text-sm">{t("notifications")}</div>
              <div className="text-[11px] text-muted-foreground">{t("notificationsHint")}</div>
            </div>
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
            <span className="font-semibold text-sm">{t("helpSupport")}</span>
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
            <span className="font-semibold text-sm">{t("about")}</span>
          </div>
          <ChevronRight className="text-muted-foreground" size={18} />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
           className="flex w-full cursor-pointer items-center gap-4 rounded-xl border-t border-border p-3.5 pt-2 text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} />
          <span className="font-semibold text-sm">{t("logOut")}</span>
        </button>

      </div>

      {panel === "privacy" && (
        <Panel title={t("privacy")} onClose={() => setPanel(null)}>
          <Toggle
            label={t("privateAccount")}
            hint={t("privateAccountHint")}
            on={toggles.privateAccount}
            onClick={() => void togglePrivateAccount()}
            disabled={!privateAccountReady || privateAccountSaving}
          />
          <Toggle label={t("activityStatus")} hint={t("activityStatusHint")} on={toggles.activityStatus} onClick={() => flip("activityStatus")} />
          <Row
            label={t("blockedAccounts")}
            hint={t("manageBlockedAccounts")}
            onClick={() => setBlockedAccountsOpen(true)}
          />
          <Row
            label={t("hiddenCreators")}
            hint={t("hiddenCreatorsHint")}
            onClick={() => setPanel("hidden-creators")}
          />
          <Row
            label={t("notInterestedPosts")}
            hint={t("notInterestedPostsHint")}
            onClick={() => setPanel("not-interested-posts")}
          />
          <Row
            label={t("commentsHiddenWords")}
            hint={t("commentsHiddenWordsHint")}
            onClick={() => setPanel("comments-hidden-words")}
          />
        </Panel>
      )}

      {panel === "app-language" && (
        <Panel
          title={t("appLanguage")}
          onClose={() => setPanel(null)}
          backLabel={t("backToSettings")}
        >
          <p className="px-3 pb-2 text-xs text-muted-foreground">{t("appLanguageHint")}</p>
          <div role="radiogroup" aria-label={t("appLanguage")}>
          {([
            ["en", t("englishDefault")],
            ["hi", t("hindiLanguage")],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={language === value}
              onClick={() => setLanguage(value)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm hover:bg-muted/60"
            >
              <span>{label}</span>
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 place-items-center rounded-full border ${
                  language === value ? "border-primary" : "border-muted-foreground/50"
                }`}
              >
                {language === value ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </span>
            </button>
          ))}
          </div>
        </Panel>
      )}

      {panel === "data-quality" && (
        <Panel
          title={t("dataMediaQuality")}
          onClose={() => setPanel(null)}
          backLabel={t("backToSettings")}
        >
          <Toggle
            label={t("dataSaver")}
            hint={t("dataSaverHint")}
            on={preferences.dataSaver}
            onClick={() => savePreference("dataSaver", !preferences.dataSaver)}
          />
          <Toggle
            label={t("uploadHighestQuality")}
            hint={t("uploadHighestQualityHint")}
            on={preferences.uploadHighestQuality}
            onClick={() =>
              savePreference("uploadHighestQuality", !preferences.uploadHighestQuality)
            }
          />
        </Panel>
      )}

      {panel === "messages-privacy" && (
        <Panel
          title={t("messagesDirectRequests")}
          onClose={() => setPanel(null)}
          backLabel={t("backToSettings")}
        >
          <PreferenceChoice
            label={t("whoCanMessage")}
            hint={t("whoCanMessageHint")}
            value={preferences.whoCanMessage}
            options={[
              { value: "everyone", label: t("everyone") },
              { value: "following", label: t("onlyPeopleYouFollow") },
            ]}
            onChange={(value) =>
              savePreference("whoCanMessage", value as "everyone" | "following")
            }
          />
          <Toggle
            label={t("readReceipts")}
            hint={t("readReceiptsHint")}
            on={preferences.readReceipts}
            onClick={() => savePreference("readReceipts", !preferences.readReceipts)}
          />
          <p className="px-3 pb-2 text-[11px] leading-relaxed text-muted-foreground">
            {t("messageRequestNote")}
          </p>
        </Panel>
      )}

      {panel === "comments-hidden-words" && (
        <Panel
          title={t("commentsHiddenWords")}
          onClose={() => setPanel(null)}
          backLabel={t("backToPrivacy")}
          onBack={() => setPanel("privacy")}
        >
          <Toggle
            label={t("hideOffensiveComments")}
            hint={t("hideOffensiveCommentsHint")}
            on={preferences.hideOffensiveComments}
            onClick={() =>
              savePreference("hideOffensiveComments", !preferences.hideOffensiveComments)
            }
          />
          <div className="space-y-2 px-3 py-2">
            <label htmlFor="hidden-word-input" className="block text-sm font-semibold">
              {t("customHiddenWords")}
            </label>
            <p className="text-[11px] text-muted-foreground">
              {t("hiddenWordsHint")}
            </p>
            <div className="flex gap-2">
              <input
                id="hidden-word-input"
                data-testid="input-hidden-word"
                value={hiddenWordDraft}
                onChange={(event) => setHiddenWordDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addHiddenWord();
                  }
                }}
                maxLength={60}
                placeholder={t("addWordPlaceholder")}
                className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <button
                type="button"
                data-testid="button-add-hidden-word"
                onClick={addHiddenWord}
                disabled={!hiddenWordDraft.trim()}
                className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t("add")}
              </button>
            </div>
            {preferences.hiddenWords.length ? (
              <div className="flex flex-wrap gap-2 pt-1" aria-label={t("hiddenWordsAria")}>
                {preferences.hiddenWords.map((word) => (
                  <span
                    key={word.toLowerCase()}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs"
                  >
                    {word}
                    <button
                      type="button"
                      data-testid={`button-remove-hidden-word-${word.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      aria-label={`Remove ${word} from hidden words`}
                      onClick={() =>
                        savePreference(
                          "hiddenWords",
                          preferences.hiddenWords.filter(
                            (item) => item.toLowerCase() !== word.toLowerCase(),
                          ),
                        )
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="pt-1 text-xs text-muted-foreground">{t("noCustomWords")}</p>
            )}
          </div>
        </Panel>
      )}

      {panel === "time-management" && (
        <Panel
          title={t("timeManagement")}
          onClose={() => setPanel(null)}
          backLabel={t("backToSettings")}
        >
          <TimeManagementPanel
            userId={user?.id ?? "guest"}
            limitMinutes={preferences.dailyLimitMinutes}
            onLimitChange={(limit) => savePreference("dailyLimitMinutes", limit)}
          />
        </Panel>
      )}

      {panel === "close-friends" && (
        <Panel title="⭐ Close Friends" onClose={() => setPanel(null)}>
          {user ? (
            <CloseFriendsManager userId={user.id} />
          ) : (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              Sign in to manage Close Friends.
            </div>
          )}
        </Panel>
      )}

      {panel === "hidden-creators" && (
        <Panel
          title={t("hiddenCreators")}
          onClose={() => setPanel(null)}
          backLabel={t("backToPrivacy")}
          onBack={() => setPanel("privacy")}
        >
          {user ? (
            <HiddenCreatorsManager userId={user.id} />
          ) : (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              {t("signInToManageCreators")}
            </div>
          )}
        </Panel>
      )}

      {panel === "not-interested-posts" && (
        <Panel
          title={t("notInterestedPosts")}
          onClose={() => setPanel(null)}
          backLabel={t("backToPrivacy")}
          onBack={() => setPanel("privacy")}
        >
          {user ? (
            <NotInterestedPostsManager userId={user.id} />
          ) : (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              {t("signInToManageNotInterested")}
            </div>
          )}
        </Panel>
      )}

      {blockedAccountsOpen && (
        <Panel
          title={t("blockedAccounts")}
          onClose={() => setBlockedAccountsOpen(false)}
          backLabel={t("backToPrivacy")}
        >
          {blockedAccountsLoading ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">{t("blockedAccountsLoading")}</div>
          ) : blockedAccountsError ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              {t("blockedAccountsLoadError")}
            </div>
          ) : blockedAccounts.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <div className="text-sm font-semibold text-foreground">{t("noBlockedAccounts")}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t("blockedAccountsEmptyHint")}</div>
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
                    {unblockingId === account.id ? t("unblocking") : t("unblock")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {panel === "notifications" && (
        <Panel title={t("notifications")} onClose={() => setPanel(null)}>
          <Toggle label={t("likes")} on={toggles.likes} onClick={() => flip("likes")} />
          <Toggle label={t("comments")} on={toggles.comments} onClick={() => flip("comments")} />
          <Toggle label={t("newFollowers")} on={toggles.followers} onClick={() => flip("followers")} />
          <Toggle label={t("messages")} on={toggles.messages} onClick={() => flip("messages")} />
          <Toggle
            label={t("calls")}
            hint={t("callsHint")}
            on={toggles.calls}
            onClick={() => flip("calls")}
          />
          <Toggle label={t("channelMonetization")} on={toggles.channel} onClick={() => flip("channel")} />
          <Toggle label={t("systemAlerts")} on={toggles.system} onClick={() => flip("system")} />
        </Panel>
      )}

      {panel === "help" && (
        <Panel title={t("helpSupport")} onClose={() => setPanel(null)}>
          <Row
            label={t("helpCenter")}
            hint={t("helpCenterHint")}
            onClick={() => navigate({ to: "/help-center" })}
          />
          <Row label={t("reportProblem")} hint={t("reportProblemHint")} onClick={() => setReportStep("options")} />
          <Row
            label={t("communityGuidelines")}
            hint={t("communityGuidelinesHint")}
            onClick={() => navigate({ to: "/community-guidelines" })}
          />
          <Row
            label={t("copyrightPolicy")}
            hint={t("copyrightPolicyHint")}
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
        <Panel title={t("about")} onClose={() => setPanel(null)}>
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

function CloseFriendsManager({ userId }: { userId: string }) {
  const following = useFollowList(userId, "following", true);
  const followers = useFollowList(userId, "followers", true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionLoading, setSelectionLoading] = useState(true);
  const [selectionError, setSelectionError] = useState(false);
  const [search, setSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState<
    "all" | "following" | "followers"
  >("all");
  const [savingFriendId, setSavingFriendId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setSelectionLoading(true);
    setSelectionError(false);
    void (async () => {
      const { data, error } = await supabase
        .from("user_close_friends")
        .select("friend_id")
        .eq("user_id", userId);
      if (error) throw error;
      if (!active) return;
      setSelectedIds(new Set((data ?? []).map((row) => row.friend_id)));
      setSelectionLoading(false);
    })().catch((error: unknown) => {
      if (!active) return;
      console.error("[settings] Could not load close friends", error);
      setSelectionError(true);
      setSelectionLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const people = useMemo(() => {
    const byId = new Map<
      string,
      {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        isFollowing: boolean;
        isFollower: boolean;
      }
    >();

    for (const person of following.users) {
      byId.set(person.id, {
        id: person.id,
        username: person.username || "user",
        displayName: person.display_name || person.username || "YourWorld user",
        avatarUrl: person.avatar_url,
        isFollowing: true,
        isFollower: false,
      });
    }
    for (const person of followers.users) {
      const existing = byId.get(person.id);
      byId.set(person.id, {
        id: person.id,
        username: person.username || "user",
        displayName: person.display_name || person.username || "YourWorld user",
        avatarUrl: person.avatar_url,
        isFollowing: existing?.isFollowing ?? false,
        isFollower: true,
      });
    }
    return [...byId.values()].sort((left, right) =>
      left.displayName.localeCompare(right.displayName),
    );
  }, [followers.users, following.users]);

  const visiblePeople = useMemo(() => {
    const normalizedSearch = search.trim().replace(/^@/, "").toLowerCase();
    return people.filter((person) => {
      const relationMatches =
        relationFilter === "all" ||
        (relationFilter === "following" && person.isFollowing) ||
        (relationFilter === "followers" && person.isFollower);
      const searchMatches =
        !normalizedSearch ||
        person.username.toLowerCase().includes(normalizedSearch) ||
        person.displayName.toLowerCase().includes(normalizedSearch);
      return relationMatches && searchMatches;
    });
  }, [people, relationFilter, search]);

  const toggleFriend = async (friendId: string) => {
    if (savingFriendId) return;
    const wasSelected = selectedIds.has(friendId);
    if (!wasSelected && selectedIds.size >= 15) {
      toast.error("Maximum 15 Close Friends allowed");
      return;
    }

    const previous = selectedIds;
    const next = new Set(selectedIds);
    if (wasSelected) next.delete(friendId);
    else next.add(friendId);
    setSelectedIds(next);
    setSavingFriendId(friendId);
    try {
      const result = wasSelected
        ? await supabase
            .from("user_close_friends")
            .delete()
            .eq("user_id", userId)
            .eq("friend_id", friendId)
        : await supabase.from("user_close_friends").upsert(
            { user_id: userId, friend_id: friendId },
            {
              onConflict: "user_id,friend_id",
              ignoreDuplicates: true,
            },
          );
      if (result.error) throw result.error;
    } catch (error) {
      setSelectedIds(previous);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("Maximum 15 Close Friends allowed")) {
        toast.error("Maximum 15 Close Friends allowed");
      } else {
        toast.error(message || "Couldn't update Close Friends");
      }
    } finally {
      setSavingFriendId(null);
    }
  };

  const loading = selectionLoading || following.loading || followers.loading;
  const loadError = selectionError || !!following.error || !!followers.error;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-3 pt-1">
        <span className="text-xs text-muted-foreground">
          {selectedIds.size} of 15 selected
        </span>
      </div>
      <label className="relative block px-3">
        <Search
          size={16}
          className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search followers and following"
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
        />
      </label>
      <div className="flex gap-2 px-3">
        {(["all", "following", "followers"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={relationFilter === filter}
            onClick={() => setRelationFilter(filter)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              relationFilter === filter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {filter === "all" ? "All" : filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-3 py-10 text-center text-sm text-muted-foreground">
          Loading your connections…
        </div>
      ) : loadError ? (
        <div className="px-3 py-10 text-center text-sm text-muted-foreground">
          Could not load your followers and following.
        </div>
      ) : visiblePeople.length === 0 ? (
        <div className="px-3 py-10 text-center text-sm text-muted-foreground">
          {people.length === 0
            ? "Follow people or get followers to add Close Friends."
            : "No people found."}
        </div>
      ) : (
        <div className="max-h-[52vh] space-y-1 overflow-y-auto px-1">
          {visiblePeople.map((person) => {
            const selected = selectedIds.has(person.id);
            const relation = [
              person.isFollowing ? "Following" : "",
              person.isFollower ? "Follower" : "",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div
                key={person.id}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50"
              >
                {person.avatarUrl ? (
                  <img
                    src={person.avatarUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {person.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {person.displayName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    @{person.username} · {relation}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={
                    selected
                      ? `Remove ${person.displayName} from Close Friends`
                      : `Add ${person.displayName} to Close Friends`
                  }
                  aria-pressed={selected}
                  onClick={() => void toggleFriend(person.id)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-amber-400 transition hover:bg-muted"
                >
                  {savingFriendId === person.id ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
                  ) : (
                    <Star size={20} fill={selected ? "currentColor" : "none"} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HiddenCreatorsManager({ userId }: { userId: string }) {
  const [creators, setCreators] = useState<ManagedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    void (async () => {
      const [hiddenResult, mutedResult] = await Promise.all([
        supabase
          .from("user_hidden_creators")
          .select("creator_id,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_muted_creators")
          .select("creator_id,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);
      if (hiddenResult.error) throw hiddenResult.error;
      if (mutedResult.error) throw mutedResult.error;
      const creatorIds = [
        ...new Set([
          ...(hiddenResult.data ?? []).map((row) => row.creator_id),
          ...(mutedResult.data ?? []).map((row) => row.creator_id),
        ]),
      ];
      if (creatorIds.length === 0) {
        if (active) {
          setCreators([]);
          setLoading(false);
        }
        return;
      }
      const { data: profiles, error: profilesError } = await supabase.rpc(
        "get_public_profiles",
        { ids: creatorIds },
      );
      if (profilesError) throw profilesError;
      const profileById = new Map(
        ((profiles as PublicProfile[] | null) ?? []).map((profile) => [
          profile.id,
          profile,
        ]),
      );
      const next = await Promise.all(
        creatorIds.map(async (creatorId) => {
          const profile = profileById.get(creatorId);
          return {
            id: creatorId,
            username: profile?.username?.trim() || "user",
            displayName:
              profile?.display_name?.trim() ||
              profile?.username?.trim() ||
              "YourWorld user",
            avatarUrl: profile?.avatar_url
              ? await resolveMediaUrl(profile.avatar_url, "avatars")
              : null,
          };
        }),
      );
      if (active) {
        setCreators(next);
        setLoading(false);
      }
    })().catch((error: unknown) => {
      if (!active) return;
      console.error("[settings] Could not load hidden creators", error);
      setLoadError(true);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const unhideCreator = async (creator: ManagedCreator) => {
    if (removingId) return;
    setRemovingId(creator.id);
    try {
      await setLongVideoCreatorHidden(userId, creator.id, false);
      announceVideoCreatorRestored(creator.id);
      setCreators((current) => current.filter((item) => item.id !== creator.id));
      toast.success("Creator unhidden");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't unhide creator");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-3 py-10 text-center text-sm text-muted-foreground">
        Loading hidden creators…
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="px-3 py-10 text-center text-sm text-muted-foreground">
        Could not load Hidden Creators. Please try again.
      </div>
    );
  }
  if (creators.length === 0) {
    return (
      <div className="px-3 py-10 text-center">
        <div className="text-sm font-semibold">No hidden creators</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Creators you hide from video recommendations will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] space-y-1 overflow-y-auto">
      {creators.map((creator) => (
        <div
          key={creator.id}
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50"
        >
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {creator.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{creator.displayName}</div>
            <div className="truncate text-xs text-muted-foreground">@{creator.username}</div>
          </div>
          <button
            type="button"
            disabled={removingId === creator.id}
            onClick={() => void unhideCreator(creator)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {removingId === creator.id ? "Unhiding…" : "Unhide"}
          </button>
        </div>
      ))}
    </div>
  );
}

function NotInterestedPostsManager({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<NotInterestedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    void (async () => {
      const { data: preferences, error: preferencesError } = await supabase
        .from("user_post_preferences")
        .select("post_id,created_at")
        .eq("user_id", userId)
        .eq("preference", "not_interested")
        .order("created_at", { ascending: false });
      if (preferencesError) throw preferencesError;
      const ids = [...new Set((preferences ?? []).map((row) => row.post_id))];
      if (ids.length === 0) {
        if (active) {
          setPosts([]);
          setLoading(false);
        }
        return;
      }
      const { data: postRows, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .in("id", ids);
      if (postsError) throw postsError;
      const postsById = new Map(
        (postRows ?? []).map((post) => [post.id, post as unknown as Record<string, unknown>]),
      );
      const next = await Promise.all(
        ids.map(async (id) => {
          const post = postsById.get(id);
          if (!post) return null;
          const rawThumbnail =
            (typeof post.thumbnail_url === "string" && post.thumbnail_url) ||
            (typeof post.thumbnailUrl === "string" && post.thumbnailUrl) ||
            "";
          return {
            id,
            title:
              (typeof post.title === "string" && post.title.trim()) ||
              (typeof post.caption === "string" && post.caption.trim()) ||
              "Video",
            thumbnailUrl: rawThumbnail
              ? await resolveMediaUrl(rawThumbnail, "thumbnails")
              : null,
            createdAt: typeof post.created_at === "string" ? post.created_at : null,
          } satisfies NotInterestedPost;
        }),
      );
      if (active) {
        setPosts(next.filter((post): post is NotInterestedPost => post !== null));
        setLoading(false);
      }
    })().catch((error: unknown) => {
      if (!active) return;
      console.error("[settings] Could not load Not Interested Posts", error);
      setLoadError(true);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const removePost = async (post: NotInterestedPost) => {
    if (removingId) return;
    setRemovingId(post.id);
    try {
      const { error } = await supabase
        .from("user_post_preferences")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", post.id);
      if (error) throw error;
      setPosts((current) => current.filter((item) => item.id !== post.id));
      announceVideoPostRestored(post.id);
      toast.success("Post removed from Not Interested");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove this post");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-3 py-10 text-center text-sm text-muted-foreground">
        Loading Not Interested Posts…
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="px-3 py-10 text-center text-sm text-muted-foreground">
        Could not load Not Interested Posts. Please try again.
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="px-3 py-10 text-center">
        <div className="text-sm font-semibold">No hidden videos</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Videos you mark Not Interested will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] space-y-2 overflow-y-auto">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt=""
              className="h-14 w-20 shrink-0 rounded-lg bg-muted object-cover"
            />
          ) : (
            <div className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">
              Video
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-sm font-semibold">{post.title}</div>
            {post.createdAt ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            disabled={removingId === post.id}
            onClick={() => void removePost(post)}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removingId === post.id ? "Removing…" : "Remove"}
          </button>
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  onClose,
  children,
  backLabel,
  onBack,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  backLabel?: string;
  onBack?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 animate-in fade-in-0 duration-200 bg-background/75 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative h-auto max-h-[85vh] w-full shrink-0 overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-card p-4 text-card-foreground animate-in slide-in-from-bottom duration-200 sm:max-w-md sm:rounded-3xl"
        style={{
          maxHeight: "85vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            onClick={backLabel ? onBack ?? onClose : onClose}
            aria-label={backLabel ?? "Close"}
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            {backLabel ? <ArrowLeft size={18} /> : <X size={18} />}
          </button>
        </div>
        <div
          className="space-y-1"
          style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SettingsEntry({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center justify-between rounded-xl p-3.5 text-left hover:bg-muted/50"
    >
      <span className="flex min-w-0 items-center gap-4">
        {icon}
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{label}</span>
          <span className="block text-[11px] text-muted-foreground">{hint}</span>
        </span>
      </span>
      <ChevronRight className="shrink-0 text-muted-foreground" size={18} />
    </button>
  );
}

function PreferenceChoice({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="rounded-xl p-3">
      <legend className="text-sm font-semibold">{label}</legend>
      {hint ? <p className="mb-2 text-[11px] text-muted-foreground">{hint}</p> : null}
      <div className="space-y-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-testid={`option-${option.value}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-muted/70"
          >
            <span>{option.label}</span>
            <span
              aria-hidden="true"
              className={`grid h-4 w-4 place-items-center rounded-full border ${
                value === option.value ? "border-primary" : "border-muted-foreground/50"
              }`}
            >
              {value === option.value ? (
                <span className="h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function TimeManagementPanel({
  userId,
  limitMinutes,
  onLimitChange,
}: {
  userId: string;
  limitMinutes: 30 | 60 | 120 | null;
  onLimitChange: (limit: 30 | 60 | 120 | null) => void;
}) {
  const { t } = useAppLanguage();
  const [usageSeconds, setUsageSeconds] = useState(0);

  useEffect(() => {
    setUsageSeconds(readDailyUsageSeconds(userId));
    return subscribeToDailyUsage(userId, setUsageSeconds);
  }, [userId]);

  const options: { value: 30 | 60 | 120 | null; label: string }[] = [
    { value: 30, label: "30m" },
    { value: 60, label: "1h" },
    { value: 120, label: "2h" },
    { value: null, label: t("off") },
  ];
  const progress =
    limitMinutes === null
      ? 0
      : Math.min(100, (usageSeconds / (limitMinutes * 60)) * 100);

  return (
    <div className="space-y-4 px-3 py-2">
      <section aria-label={t("dailyUsage")} className="rounded-xl border border-border bg-background/60 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold">{t("dailyUsage")}</span>
          <span data-testid="text-daily-usage" className="text-sm font-bold text-primary">
            {formatDailyUsage(usageSeconds)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t("usageTodayHint")}
        </p>
        <div
          role="progressbar"
          aria-label={t("usageAgainstLimit")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {limitMinutes === null
            ? t("dailyLimitReminderOff")
            : `${t("reminderAt")} ${
                limitMinutes === 60
                  ? t("oneHour")
                  : limitMinutes === 120
                    ? t("twoHours")
                    : t("thirtyMinutes")
              }.`
          }
        </p>
      </section>

      <section aria-label={t("dailyLimitReminder")}>
        <div className="mb-2 text-sm font-semibold">{t("dailyLimitReminder")}</div>
        <div className="grid grid-cols-4 gap-2">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              data-testid={`daily-limit-${option.label}`}
              aria-pressed={limitMinutes === option.value}
              onClick={() => onLimitChange(option.value)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                limitMinutes === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
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

function Toggle({
  label,
  hint,
  on,
  onClick,
  disabled = false,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
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
        disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}
