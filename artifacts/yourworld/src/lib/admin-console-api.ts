import { supabase } from "@/integrations/supabase/client";

export type AdminConsoleReadOperation =
  | "console"
  | "payoutRequests"
  | "internationalPayoutKyc"
  | "sportsVerification"
  | "awardVerification";

type AdminConsoleApiEnvelope = {
  data?: unknown;
  error?: string;
};

export async function readAdminConsoleApi<T>(
  operation: AdminConsoleReadOperation,
): Promise<T> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error("Your session has expired. Sign in again and retry.");
  }

  const appOrigin =
    typeof window !== "undefined" && window.location.origin === "https://localhost"
      ? import.meta.env.VITE_APP_URL
      : window.location.origin;
  if (!appOrigin) {
    throw new Error("The Admin Console service URL is not configured.");
  }

  const response = await fetch(new URL("/admin-console-data", appOrigin), {
    method: "POST",
    credentials: "omit",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ operation }),
  });

  let envelope: AdminConsoleApiEnvelope;
  try {
    envelope = (await response.json()) as AdminConsoleApiEnvelope;
  } catch {
    throw new Error(`Admin Console returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(
      typeof envelope.error === "string"
        ? envelope.error
        : `Admin Console request failed (HTTP ${response.status}).`,
    );
  }
  if (!envelope || !("data" in envelope)) {
    throw new Error("Admin Console returned no data. Refresh and try again.");
  }
  return envelope.data as T;
}
