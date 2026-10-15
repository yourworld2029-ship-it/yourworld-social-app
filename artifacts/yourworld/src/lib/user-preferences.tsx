import { useCallback, useEffect, useState } from "react";

export type MessagePermission = "everyone" | "following";
export type DailyLimitMinutes = 30 | 60 | 120 | null;

export type UserPreferences = {
  dataSaver: boolean;
  uploadHighestQuality: boolean;
  whoCanMessage: MessagePermission;
  readReceipts: boolean;
  hideOffensiveComments: boolean;
  hiddenWords: string[];
  dailyLimitMinutes: DailyLimitMinutes;
};

export type UserPreferenceKey = keyof UserPreferences;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  dataSaver: false,
  uploadHighestQuality: false,
  whoCanMessage: "everyone",
  readReceipts: true,
  hideOffensiveComments: false,
  hiddenWords: [],
  dailyLimitMinutes: null,
};

const STORAGE_PREFIX = "yw:user-preferences:v1:";
const CHANGE_EVENT = "yw:user-preferences-changed";

type PreferenceChangeEvent = CustomEvent<{
  userId: string;
  preferences: UserPreferences;
}>;

export type NetworkHints = {
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
};

export function getCurrentNetworkHints(): NetworkHints | null {
  if (typeof navigator === "undefined") return null;
  return (
    navigator as Navigator & {
      connection?: NetworkHints;
    }
  ).connection ?? null;
}

function storageKey(userId?: string | null) {
  return `${STORAGE_PREFIX}${userId || "guest"}`;
}

function isDailyLimit(value: unknown): value is DailyLimitMinutes {
  return value === null || value === 30 || value === 60 || value === 120;
}

export function normalizeUserPreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_USER_PREFERENCES };
  }
  const raw = value as Partial<Record<UserPreferenceKey, unknown>>;
  return {
    dataSaver: typeof raw.dataSaver === "boolean"
      ? raw.dataSaver
      : DEFAULT_USER_PREFERENCES.dataSaver,
    uploadHighestQuality: typeof raw.uploadHighestQuality === "boolean"
      ? raw.uploadHighestQuality
      : DEFAULT_USER_PREFERENCES.uploadHighestQuality,
    whoCanMessage: raw.whoCanMessage === "following" ? "following" : "everyone",
    readReceipts: typeof raw.readReceipts === "boolean"
      ? raw.readReceipts
      : DEFAULT_USER_PREFERENCES.readReceipts,
    hideOffensiveComments: typeof raw.hideOffensiveComments === "boolean"
      ? raw.hideOffensiveComments
      : DEFAULT_USER_PREFERENCES.hideOffensiveComments,
    hiddenWords: Array.isArray(raw.hiddenWords)
      ? [...new Set(
          raw.hiddenWords
            .filter((word): word is string => typeof word === "string")
            .map((word) => word.trim().slice(0, 60))
            .filter(Boolean),
        )].slice(0, 50)
      : [],
    dailyLimitMinutes: isDailyLimit(raw.dailyLimitMinutes)
      ? raw.dailyLimitMinutes
      : DEFAULT_USER_PREFERENCES.dailyLimitMinutes,
  };
}

export function getUserPreferences(userId?: string | null): UserPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_USER_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? normalizeUserPreferences(JSON.parse(raw)) : { ...DEFAULT_USER_PREFERENCES };
  } catch (error) {
    console.warn("[settings] Could not read saved preferences", error);
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export function setUserPreference<K extends UserPreferenceKey>(
  userId: string | null | undefined,
  key: K,
  value: UserPreferences[K],
) {
  const next = normalizeUserPreferences({
    ...getUserPreferences(userId),
    [key]: value,
  });
  if (typeof window === "undefined") return next;

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent<PreferenceChangeEvent["detail"]>(CHANGE_EVENT, {
        detail: { userId: userId || "guest", preferences: next },
      }),
    );
  } catch (error) {
    console.error("[settings] Could not save preferences", error);
  }
  return next;
}

export function useUserPreferences(userId?: string | null) {
  const [preferences, setPreferences] = useState(() => getUserPreferences(userId));
  const normalizedUserId = userId || "guest";

  useEffect(() => {
    setPreferences(getUserPreferences(userId));

    const onPreferenceChange = (event: Event) => {
      const detail = (event as PreferenceChangeEvent).detail;
      if (detail?.userId === normalizedUserId) {
        setPreferences(normalizeUserPreferences(detail.preferences));
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey(userId)) {
        setPreferences(getUserPreferences(userId));
      }
    };
    window.addEventListener(CHANGE_EVENT, onPreferenceChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onPreferenceChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [normalizedUserId, userId]);

  const savePreference = useCallback(
    <K extends UserPreferenceKey>(key: K, value: UserPreferences[K]) => {
      setPreferences(setUserPreference(userId, key, value));
    },
    [userId],
  );

  return { preferences, savePreference };
}

export function shouldUseDataSaverOnNetwork(
  enabled: boolean,
  network: NetworkHints | null | undefined,
) {
  if (!enabled || !network) return false;
  const type = network.type?.toLowerCase();
  const effectiveType = network.effectiveType?.toLowerCase();
  return (
    type === "cellular" ||
    network.saveData === true ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g"
  );
}

const STANDARD_OFFENSIVE_WORDS = [
  "asshole",
  "bastard",
  "bitch",
  "bullshit",
  "cunt",
  "dick",
  "fuck",
  "motherfucker",
  "shit",
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWordOrPhrase(text: string, phrase: string) {
  const terms = phrase.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return false;
  const pattern = terms.map(escapeRegExp).join("\\s+");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}_])${pattern}($|[^\\p{L}\\p{N}_])`,
    "iu",
  ).test(text);
}

export function commentMatchesUserFilters(
  text: string,
  preferences: Pick<UserPreferences, "hideOffensiveComments" | "hiddenWords">,
) {
  if (
    preferences.hideOffensiveComments &&
    STANDARD_OFFENSIVE_WORDS.some((word) => containsWordOrPhrase(text, word))
  ) {
    return true;
  }
  return preferences.hiddenWords.some((word) => containsWordOrPhrase(text, word));
}
