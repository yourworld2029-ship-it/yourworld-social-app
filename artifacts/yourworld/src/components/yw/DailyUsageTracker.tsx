import { useEffect, useState } from "react";
import {
  addDailyUsageSessionSeconds,
  addDailyUsageSeconds,
  getDailyUsageSession,
  localDayKey,
  markDailyLimitReminderShown,
  readDailyUsageSeconds,
  shouldShowDailyLimitReminder,
  syncDailyUsageSeconds,
} from "@/lib/daily-usage";
import { useAuth } from "@/lib/auth-store";
import { useUserPreferences } from "@/lib/user-preferences";
import { supabase } from "@/integrations/supabase/client";

export function DailyUsageTracker() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { preferences, loading: preferencesLoading } = useUserPreferences(userId);
  const dailyLimitMinutes = preferences.dailyLimitMinutes;
  const [reminderOpen, setReminderOpen] = useState(false);

  useEffect(() => {
    if (!userId || preferencesLoading) return;

    let activeSince =
      document.visibilityState === "visible" ? performance.now() : null;
    let session = getDailyUsageSession(userId);
    let syncing = false;
    const ensureTodaySession = () => {
      if (session.day !== localDayKey()) {
        session = getDailyUsageSession(userId);
      }
    };
    const remindIfNeeded = (seconds: number) => {
      if (
        dailyLimitMinutes !== null &&
        shouldShowDailyLimitReminder(seconds, dailyLimitMinutes) &&
        markDailyLimitReminderShown(userId, dailyLimitMinutes)
      ) {
        setReminderOpen(true);
      }
    };
    remindIfNeeded(readDailyUsageSeconds(userId));

    const sync = async () => {
      if (syncing) return;
      ensureTodaySession();
      syncing = true;
      try {
        const { data, error } = await supabase.rpc(
          "record_my_daily_usage" as never,
          {
            p_local_day: session.day,
            p_session_id: session.sessionId,
            p_seconds: session.seconds,
          } as never,
        ) as unknown as { data: number | string | null; error: { message: string } | null };
        if (error) throw new Error(error.message);
        const total = Number(data);
        if (Number.isFinite(total)) {
          const synced = syncDailyUsageSeconds(userId, total);
          remindIfNeeded(synced);
        }
      } catch (error) {
        console.warn("[time-management] Could not sync foreground usage", error);
      } finally {
        syncing = false;
      }
    };

    const flush = () => {
      if (activeSince === null) return;
      const now = performance.now();
      const elapsedSeconds = Math.floor((now - activeSince) / 1000);
      if (elapsedSeconds <= 0) return;
      activeSince += elapsedSeconds * 1000;
      ensureTodaySession();
      addDailyUsageSessionSeconds(userId, session, elapsedSeconds);
      remindIfNeeded(addDailyUsageSeconds(userId, elapsedSeconds));
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
        activeSince = null;
        void sync();
      } else if (activeSince === null) {
        activeSince = performance.now();
      }
    };
    const onPageHide = () => {
      flush();
      void sync();
    };
    const onOnline = () => void sync();
    const interval = window.setInterval(flush, 5000);
    const syncInterval = window.setInterval(() => void sync(), 30_000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
    void sync();

    return () => {
      flush();
      window.clearInterval(interval);
      window.clearInterval(syncInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
      void sync();
    };
  }, [dailyLimitMinutes, preferencesLoading, userId]);

  return reminderOpen ? (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setReminderOpen(false);
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="daily-limit-title"
        aria-describedby="daily-limit-description"
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl"
      >
        <h2 id="daily-limit-title" className="text-lg font-semibold">Daily limit reached</h2>
        <p id="daily-limit-description" className="mt-2 text-sm text-muted-foreground">
          You’ve reached your daily app-time reminder. Take a short break.
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => setReminderOpen(false)}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          Got it
        </button>
      </section>
    </div>
  ) : null;
}
