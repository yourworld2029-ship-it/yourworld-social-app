export type AutoDeleteSetting = "off" | "after_view" | "5_hours" | "24_hours";
export type LegacyAutoDeleteSetting = "3_hours" | "6_hours";
type AutoDeleteInput = AutoDeleteSetting | LegacyAutoDeleteSetting;
export const AFTER_VIEW_DELAY_MS = 5_000;

export const AUTO_DELETE_OPTIONS: readonly {
  value: AutoDeleteSetting;
  label: string;
}[] = [
  { value: "off", label: "Off" },
  { value: "after_view", label: "After View (Vanish Mode)" },
  { value: "5_hours", label: "5 Hours" },
  { value: "24_hours", label: "24 Hours" },
];

export function autoDeleteLabel(setting: AutoDeleteInput) {
  const normalized = normalizeAutoDeleteSetting(setting);
  return AUTO_DELETE_OPTIONS.find((option) => option.value === normalized)?.label ?? "Off";
}

export function autoDeleteSeconds(setting: AutoDeleteInput) {
  const normalized = normalizeAutoDeleteSetting(setting);
  if (normalized === "5_hours") return 5 * 60 * 60;
  if (normalized === "24_hours") return 24 * 60 * 60;
  return 0;
}

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
): AutoDeleteSetting {
  if (value === "after_view" || value === "5_hours" || value === "24_hours") {
    return value;
  }
  if (value === "3_hours" || value === "6_hours") return "5_hours";
  if (Number(legacySeconds) >= 24 * 60 * 60) return "24_hours";
  if (Number(legacySeconds) > 0) return "5_hours";
  return "off";
}