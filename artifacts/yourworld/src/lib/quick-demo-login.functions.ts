import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "@/integrations/supabase/url";

/**
 * Signs the visitor into the pre-created, verified demo account.
 *
 * The account credentials are server-only Replit Secrets. Returning the
 * resulting normal Supabase session is intentional: the browser needs it for
 * the existing auth listener and RLS-backed app data.
 */
export const quickDemoLogin = createServerFn({ method: "POST" }).handler(async () => {
  const configuredUrl = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const email = process.env["SUPABASE_DEMO_EMAIL"];
  const password = process.env["SUPABASE_DEMO_PASSWORD"];

  if (!configuredUrl || !publishableKey || !email || !password) {
    throw new Error("Quick Demo Login is not configured yet.");
  }

  const client = createClient(normalizeSupabaseProjectUrl(configuredUrl), publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    console.error("[Quick Demo Login] Supabase sign-in failed", error?.message ?? "No session returned");
    throw new Error("Quick Demo Login is temporarily unavailable.");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
});