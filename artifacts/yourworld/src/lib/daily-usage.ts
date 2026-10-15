const USAGE_KEY_PREFIX = "yw:daily-usage:v1:";
const REMINDER_KEY_PREFIX = "yw:daily-limit-reminder:v1:";
const USAGE_EVENT = "yw:daily-usage-updated";

type DailyUsageRecord = {
  day: string;
  seconds: number;
};

export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function usageKey(userId: string) {
  return `${USAGE_KEY_PREFIX}${userId || "guest"}`;
}

function reminderKey(userId: string, limitMinutes: number, date = new Date()) {
  return `${REMINDER_KEY_PREFIX}${userId || "guest"}:${localDayKey(date)}:${limitMinutes}`;
}

export function normalizeDailyUsageRecord(
  value: unknown,
  today = localDayKey(),
): DailyUsageRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { day: today, seconds: 0 };
  }
  const record = value as Partial<DailyUsageRecord>;
  if (record.day !== today) return { day: today, seconds: 0 };
  const seconds = Number(record.seconds);
  return {
    day: today,
    seconds: Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0,
  };
}

export function readDailyUsageSeconds(userId: string, date = new Date()) {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(usageKey(userId));
    return raw
      ? normalizeDailyUsageRecord(JSON.parse(raw), localDayKey(date)).seconds
      : 0;
  } catch (error) {
    console.warn("[time-management] Could not read daily usage", error);
    return 0;
  }
}

export function addDailyUsageSeconds(
  userId: string,
  seconds: number,
  date = new Date(),
) {
  if (typeof window === "undefined" || !Number.isFinite(seconds) || seconds <= 0) {
    return readDailyUsageSeconds(userId, date);
  }
  const today = localDayKey(date);
  const current = readDailyUsageSeconds(userId, date);
  const next = current + Math.floor(seconds);
  try {
    window.localStorage.setItem(
      usageKey(userId),
      JSON.stringify({ day: today, seconds: next } satisfies DailyUsageRecord),
    );
    window.dispatchEvent(
      new CustomEvent(USAGE_EVENT, {
        detail: { userId: userId || "guest", day: today, seconds: next },
      }),
    );
  } catch (error) {
    console.error("[time-management] Could not save daily usage", error);
  }
  return next;
}

export function shouldShowDailyLimitReminder(
  usageSeconds: number,
  limitMinutes: number | null,
) {
  return (
    limitMinutes !== null &&
    Number.isFinite(usageSeconds) &&
    usageSeconds >= limitMinutes * 60
  );
}

export function markDailyLimitReminderShown(
  userId: string,
  limitMinutes: number,
  date = new Date(),
) {
  if (typeof window === "undefined") return false;
  const key = reminderKey(userId, limitMinutes, date);
  try {
    if (window.localStorage.getItem(key) === "1") return false;
    window.localStorage.setItem(key, "1");
    return true;
  } catch (error) {
    console.warn("[time-management] Could not save reminder state", error);
    return false;
  }
}

export function formatDailyUsage(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainder}s`;
  return `${remainder}s`;
}

export function subscribeToDailyUsage(
  userId: string,
  onUpdate: (seconds: number) => void,
) {
  if (typeof window === "undefined") return () => {};
  const normalizedUserId = userId || "guest";
  const onUsage = (event: Event) => {
    const detail = (event as CustomEvent<{
      userId: string;
      day: string;
      seconds: number;
    }>).detail;
    if (
      detail?.userId === normalizedUserId &&
      detail.day === localDayKey()
    ) {
      onUpdate(detail.seconds);
    }
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === usageKey(userId)) onUpdate(readDailyUsageSeconds(userId));
  };
  window.addEventListener(USAGE_EVENT, onUsage);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(USAGE_EVENT, onUsage);
    window.removeEventListener("storage", onStorage);
  };
}
