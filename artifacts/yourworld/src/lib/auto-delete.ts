export type AutoDeleteSetting = "off" | "after_view" | "6_hours" | "24_hours";
export const AFTER_VIEW_DELAY_MS = 15_000;

export const AUTO_DELETE_OPTIONS: readonly {
  value: AutoDeleteSetting;
  label: string;
}[] = [
  { value: "off", label: "Off" },
  { value: "after_view", label: "After View" },
  { value: "6_hours", label: "6 Hours" },
  { value: "24_hours", label: "24 Hours" },
];

export function autoDeleteLabel(setting: AutoDeleteSetting) {
  return AUTO_DELETE_OPTIONS.find((option) => option.value === setting)?.label ?? "Off";
}

export function autoDeleteSeconds(setting: AutoDeleteSetting) {
  if (setting === "6_hours") return 6 * 60 * 60;
  if (setting === "24_hours") return 24 * 60 * 60;
  return 0;
}

export function autoDeleteExpiresAt(
  setting: AutoDeleteSetting,
  now = Date.now(),
) {
  const seconds = autoDeleteSeconds(setting);
  return seconds ? new Date(now + seconds * 1000).toISOString() : null;
}

export function expiresAtForAutoDelete(
  setting: AutoDeleteSetting,
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
  if (value === "after_view" || value === "6_hours" || value === "24_hours") {
    return value;
  }
  if (Number(legacySeconds) >= 24 * 60 * 60) return "24_hours";
  if (Number(legacySeconds) > 0) return "6_hours";
  return "off";
}