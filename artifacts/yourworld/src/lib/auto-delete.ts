export type AutoDeleteMode = "off" | "after_view" | "5_hours" | "24_hours";
export type AutoDeleteSetting =
  | AutoDeleteMode
  | "after_view_15s"
  | "after_view_1m"
  | "after_view_10m";
export type LegacyAutoDeleteSetting = "3_hours" | "6_hours";
export type CompactAutoDeleteSetting =
  | "immediately"
  | "15s"
  | "1m"
  | "10m"
  | "5h"
  | "24h";
type AutoDeleteInput =
  | AutoDeleteSetting
  | LegacyAutoDeleteSetting
  | CompactAutoDeleteSetting;
export const AFTER_VIEW_DELAY_MS = 5_000;

export const AUTO_DELETE_OPTIONS: readonly {
  value: AutoDeleteMode;
  label: string;
}[] = [
  { value: "off", label: "Off" },
  { value: "after_view", label: "After View (Vanish Mode)" },
  { value: "5_hours", label: "5 Hours" },
  { value: "24_hours", label: "24 Hours" },
];

export const VANISH_TIMER_OPTIONS = [
  { value: "after_view", label: "Immediately (On Exit)", delaySeconds: 0 },
  { value: "after_view_15s", label: "15 Seconds", delaySeconds: 15 },
  { value: "after_view_1m", label: "1 Minute", delaySeconds: 60 },
  { value: "after_view_10m", label: "10 Minutes", delaySeconds: 600 },
] as const satisfies readonly {
  value: AutoDeleteSetting;
  label: string;
  delaySeconds: number;
}[];

const VANISH_DELAY_SECONDS = [15, 60, 600] as const;

export function autoDeleteLabel(setting: AutoDeleteInput) {
  const normalized = normalizeChatAutoDeleteSetting(setting);
  const vanishTimer = VANISH_TIMER_OPTIONS.find((option) => option.value === normalized);
  if (vanishTimer && vanishTimer.delaySeconds > 0) {
    return `After View (${vanishTimer.label})`;
  }
  return AUTO_DELETE_OPTIONS.find((option) => option.value === normalized)?.label ?? "Off";
}

export function autoDeleteSeconds(setting: AutoDeleteInput) {
  const normalized = normalizeAutoDeleteSetting(setting);
  if (normalized === "5_hours") return 5 * 60 * 60;
  if (normalized === "24_hours") return 24 * 60 * 60;
  return 0;
}

/** Normalize a chat-level selection while preserving its Vanish sub-timer. */
export function normalizeChatAutoDeleteSetting(
  value: unknown,
  legacySeconds = 0,
): AutoDeleteSetting {
  if (value === "immediately") return "after_view";
  if (value === "15s") return "after_view_15s";
  if (value === "1m") return "after_view_1m";
  if (value === "10m") return "after_view_10m";
  if (value === "5h") return "5_hours";
  if (value === "24h") return "24_hours";
  if (
    value === "after_view" ||
    value === "after_view_15s" ||
    value === "after_view_1m" ||
    value === "after_view_10m" ||
    value === "5_hours" ||
    value === "24_hours"
  ) {
    return value;
  }
  return normalizeAutoDeleteSetting(value, legacySeconds);
}

/** Message rows keep the established mode; sub-timer values live in metadata. */
export function isAutoDeleteExpired(
  setting: AutoDeleteInput,
  createdAt: string | null | undefined,
  now = Date.now(),
) {
  const seconds = autoDeleteSeconds(setting);
  const createdAtMs = typeof createdAt === "string" ? Date.parse(createdAt) : NaN;
  return seconds > 0 && Number.isFinite(createdAtMs) && createdAtMs + seconds * 1000 <= now;
}

export function autoDeleteExpiresAt(
  setting: AutoDeleteInput,
  now = Date.now(),
) {
  const seconds = autoDeleteSeconds(setting);
  return seconds ? new Date(now + seconds * 1000).toISOString() : null;
}

export function expiresAtForAutoDelete(
  setting: AutoDeleteInput,
  now = Date.now(),
) {
  return autoDeleteExpiresAt(setting, now);
}

export function afterViewExpiresAt(viewedAt = Date.now()) {
  return new Date(viewedAt + AFTER_VIEW_DELAY_MS).toISOString();
}

export function normalizeAutoDeleteSetting(
  value: unknown,
  legacySeconds = 0,
): AutoDeleteMode {
  if (
    value === "after_view" ||
    value === "immediately" ||
    value === "15s" ||
    value === "1m" ||
    value === "10m" ||
    value === "after_view_15s" ||
    value === "after_view_1m" ||
    value === "after_view_10m"
  ) {
    return "after_view";
  }
  if (value === "5_hours" || value === "5h") return "5_hours";
  if (value === "24_hours" || value === "24h") return "24_hours";
  if (value === "3_hours" || value === "6_hours") return "5_hours";
  if (Number(legacySeconds) >= 24 * 60 * 60) return "24_hours";
  if (Number(legacySeconds) > 0) return "5_hours";
  return "off";
}

export function vanishDelaySeconds(setting: unknown) {
  return VANISH_TIMER_OPTIONS.find(
    (option) => option.value === normalizeChatAutoDeleteSetting(setting),
  )?.delaySeconds ?? 0;
}

export function vanishDelaySecondsFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const value = (metadata as Record<string, unknown>).vanish_delay_seconds;
  const seconds = typeof value === "number" ? value : Number(value);
  return VANISH_DELAY_SECONDS.includes(seconds as (typeof VANISH_DELAY_SECONDS)[number])
    ? seconds
    : 0;
}

export function formatVanishCountdown(millisecondsRemaining: number) {
  const secondsRemaining = Math.max(0, Math.ceil(millisecondsRemaining / 1000));
  if (secondsRemaining < 60) return `${secondsRemaining}s`;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = String(secondsRemaining % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
