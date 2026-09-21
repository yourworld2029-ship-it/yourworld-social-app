import { supabase } from "@/integrations/supabase/client";
import type { Session as AuthSession } from "@supabase/supabase-js";

export type ActiveUserSession = {
  id: string;
  device_name: string;
  ip_address: string | null;
  location_city: string | null;
  last_active_at: string;
  is_current: boolean;
  created_at: string;
};

type SessionRpcRow = ActiveUserSession & {
  revoked_at?: string | null;
};

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  try {
    const encoded = accessToken.split(".")[1];
    if (!encoded) return null;
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAuthSessionId(session: AuthSession | null) {
  if (!session?.access_token) return null;
  const value = decodeJwtPayload(session.access_token)?.session_id;
  return typeof value === "string" && value ? value : null;
}

function deviceName() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const device = /iPhone/i.test(ua)
    ? "iPhone"
    : /iPad/i.test(ua)
      ? "iPad"
      : /Android/i.test(ua)
        ? "Android"
        : /Mac OS X/i.test(ua)
          ? "Mac"
          : /Windows/i.test(ua)
            ? "Windows"
            : /Linux/i.test(ua)
              ? "Linux"
              : "Browser";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  return `${device} · ${browser}`;
}

function approximateLocationCity() {
  if (typeof Intl === "undefined") return null;
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city = timezone.split("/").at(-1)?.replace(/_/g, " ");
    return city || null;
  } catch {
    return null;
  }
}

export async function registerCurrentUserSession() {
  const { data: authData } = await supabase.auth.getSession();
  if (!authData.session || !getAuthSessionId(authData.session)) {
    return { active: false, error: null as string | null };
  }

  const { data, error } = await supabase.rpc("register_current_user_session", {
    _device_name: deviceName(),
    _location_city: approximateLocationCity(),
    _ip_address: null,
  });
  if (error) return { active: false, error: error.message };

  const row = (Array.isArray(data) ? data[0] : data) as SessionRpcRow | null;
  return { active: Boolean(row && !row.revoked_at), error: null as string | null };
}

export async function currentUserSessionIsActive() {
  const { data, error } = await supabase.rpc("current_user_session_is_active");
  if (error) return { active: true, error: error.message };
  return { active: data === true, error: null as string | null };
}

export async function listActiveUserSessions(): Promise<ActiveUserSession[]> {
  const { data, error } = await supabase.rpc("list_current_user_sessions");
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []) as ActiveUserSession[];
}

export async function revokeUserSession(sessionRowId: string) {
  const { error } = await supabase.rpc("revoke_user_session", {
    _session_row_id: sessionRowId,
  });
  if (error) throw new Error(error.message);
}

export async function revokeOtherUserSessions() {
  const { data, error } = await supabase.rpc("revoke_other_user_sessions");
  if (error) throw new Error(error.message);
  return typeof data === "number" ? data : 0;
}