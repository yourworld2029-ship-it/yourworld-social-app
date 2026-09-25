export type AuthActionType =
  | "post-like"
  | "video-like"
  | "reel-like"
  | "comment-like"
  | "post-comment"
  | "post-reply"
  | "video-comment"
  | "video-reply"
  | "follow-user"
  | "profile-message"
  | "open-chat"
  | "live-comment";

export type AuthActionPayload = {
  text?: string;
  parentId?: string;
};

export type PendingAuthAction = {
  type: AuthActionType;
  targetId: string;
  returnTo: string;
  payload?: AuthActionPayload;
  createdAt: number;
};

export type AuthActionInput = {
  type: AuthActionType;
  targetId: string;
  payload?: AuthActionPayload;
};

const ACTION_KEY = "yw.pending-auth-action";
const RETURN_KEY = "yw.auth-return-to";
const INTERNAL_ORIGIN = "https://yourworld.invalid";
const ACTION_MAX_AGE_MS = 45 * 60 * 1000;

export function safeInternalPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return fallback;
    if (
      url.pathname === "/auth" ||
      url.pathname.startsWith("/auth/") ||
      url.pathname === "/reset-password" ||
      url.pathname.startsWith("/reset-password/") ||
      url.pathname === "/verify-2fa" ||
      url.pathname.startsWith("/verify-2fa/")
    ) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function rememberAuthReturnTo(path: string) {
  try {
    storage()?.setItem(RETURN_KEY, safeInternalPath(path));
  } catch {
    // The auth redirect still works when session storage is unavailable.
  }
}

export function clearAuthReturnTo() {
  try {
    storage()?.removeItem(RETURN_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

export function getAuthReturnTo(redirect?: string): string {
  const pending = getPendingAuthAction();
  if (pending) return pending.returnTo;

  try {
    const stored = storage()?.getItem(RETURN_KEY);
    if (stored) return safeInternalPath(stored);
  } catch {
    // Fall through to the validated route search value.
  }

  return safeInternalPath(redirect);
}

export function savePendingAuthAction(
  input: AuthActionInput,
  returnTo: string,
): PendingAuthAction {
  const action: PendingAuthAction = {
    ...input,
    returnTo: safeInternalPath(returnTo),
    createdAt: Date.now(),
  };
  try {
    storage()?.setItem(ACTION_KEY, JSON.stringify(action));
    rememberAuthReturnTo(action.returnTo);
  } catch {
    // The sign-in prompt still opens if the browser blocks storage.
  }
  return action;
}

export function getPendingAuthAction(): PendingAuthAction | null {
  try {
    const value = storage()?.getItem(ACTION_KEY);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Partial<PendingAuthAction>;
    if (
      typeof candidate.type !== "string" ||
      typeof candidate.targetId !== "string" ||
      typeof candidate.returnTo !== "string" ||
      typeof candidate.createdAt !== "number" ||
      Date.now() - candidate.createdAt > ACTION_MAX_AGE_MS ||
      Date.now() < candidate.createdAt
    ) {
      clearPendingAuthAction();
      return null;
    }

    return {
      type: candidate.type as AuthActionType,
      targetId: candidate.targetId,
      returnTo: safeInternalPath(candidate.returnTo),
      payload:
        candidate.payload && typeof candidate.payload === "object"
          ? {
              text:
                typeof candidate.payload.text === "string"
                  ? candidate.payload.text
                  : undefined,
              parentId:
                typeof candidate.payload.parentId === "string"
                  ? candidate.payload.parentId
                  : undefined,
            }
          : undefined,
      createdAt: candidate.createdAt,
    };
  } catch {
    clearPendingAuthAction();
    return null;
  }
}

export function clearPendingAuthAction() {
  try {
    storage()?.removeItem(ACTION_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

export function consumePendingAuthAction(
  type: AuthActionType,
  targetId: string,
  currentPath: string,
): PendingAuthAction | null {
  const pending = getPendingAuthAction();
  if (
    !pending ||
    pending.type !== type ||
    (targetId !== "*" && pending.targetId !== targetId) ||
    pending.returnTo !== safeInternalPath(currentPath)
  ) {
    return null;
  }

  clearPendingAuthAction();
  clearAuthReturnTo();
  return pending;
}