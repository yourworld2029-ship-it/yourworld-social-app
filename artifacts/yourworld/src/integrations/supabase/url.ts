const SUPABASE_HOST_SUFFIX = ".supabase.co";

/**
 * Supabase clients require the project origin, not a PostgREST endpoint.
 * Replit's Supabase connector may expose a URL ending in /rest/v1; strip any
 * path, query, or hash before supabase-js appends its own service routes.
 */
export function normalizeSupabaseProjectUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("SUPABASE_URL must be a valid HTTPS URL.");
  }

  if (url.protocol !== "https:" || !url.hostname.endsWith(SUPABASE_HOST_SUFFIX)) {
    throw new Error("SUPABASE_URL must use the HTTPS project origin ending in .supabase.co.");
  }

  return url.origin;
}