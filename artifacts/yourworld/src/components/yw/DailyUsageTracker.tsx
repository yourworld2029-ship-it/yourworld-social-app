import { useEffect } from "react";
import { toast } from "sonner";
import {
  addDailyUsageSeconds,
  markDailyLimitReminderShown,
  readDailyUsageSeconds,
  shouldShowDailyLimitReminder,
} from "@/lib/daily-usage";
import { useAuth } from "@/lib/auth-store";
import { useUserPreferences } from "@/lib/user-preferences";

export function DailyUsageTracker() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { preferences } = useUserPreferences(userId);
  const dailyLimitMinutes = preferences.dailyLimitMinutes;

  useEffect(() => {
    if (!userId) return;

    let activeSince =
      document.visibilityState === "visible" ? performance.now() : null;
    const remindIfNeeded = (seconds: number) => {
      if (
        dailyLimitMinutes !== null &&
        shouldShowDailyLimitReminder(seconds, dailyLimitMinutes) &&
        markDailyLimitReminderShown(userId, dailyLimitMinutes)
      ) {
        toast("Daily limit reached", {
          description: "You’ve reached your daily app-time reminder. Take a short break.",
        });
      }
    };
    remindIfNeeded(readDailyUsageSeconds(userId));

    const flush = () => {
      if (activeSince === null) return;
      const now = performance.now();
      const elapsedSeconds = Math.floor((now - activeSince) / 1000);
      if (elapsedSeconds <= 0) return;
      activeSince += elapsedSeconds * 1000;
      remindIfNeeded(addDailyUsageSeconds(userId, elapsedSeconds));
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
        activeSince = null;
      } else if (activeSince === null) {
        activeSince = performance.now();
      }
    };
    const interval = window.setInterval(flush, 5000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      flush();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
    };
  }, [dailyLimitMinutes, userId]);

  return null;
}
