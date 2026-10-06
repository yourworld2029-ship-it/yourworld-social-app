export const DEFAULT_PUBLIC_APP_URL =
  "https://your-world-social-app--yourworld2029.replit.app";

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "10.0.2.2",
  "capacitor.localhost",
]);

export function normalizePublicAppBaseUrl(value?: string | null) {
  const configured = value?.trim() || DEFAULT_PUBLIC_APP_URL;
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("PUBLIC_APP_URL must be an absolute HTTPS URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    parsed.protocol !== "https:" ||
    !hostname ||
    LOCAL_HOSTS.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".replit.dev") ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(
      "PUBLIC_APP_URL must use a public HTTPS production domain, not a local or development host.",
    );
  }

  return parsed.origin;
}

function getConfiguredPublicAppUrl() {
  try {
    return import.meta.env.VITE_APP_URL as string | undefined;
  } catch {
    // Unit tests run outside Vite; production and Capacitor builds define this value.
    return undefined;
  }
}

export function getPublicAppBaseUrl() {
  return normalizePublicAppBaseUrl(getConfiguredPublicAppUrl());
}

export function buildPublicAppUrl(
  pathOrUrl: string,
  baseUrl = getPublicAppBaseUrl(),
  currentHostname = typeof window === "undefined" ? "" : window.location.hostname,
) {
  const publicBase = normalizePublicAppBaseUrl(baseUrl);
  const parsed = new URL(pathOrUrl, `${publicBase}/`);
  const hostname = parsed.hostname.toLowerCase();
  const isLocalHost =
    LOCAL_HOSTS.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".replit.dev");
  const isCurrentWebViewHost =
    currentHostname &&
    hostname === currentHostname.toLowerCase() &&
    parsed.origin !== publicBase;

  if (isLocalHost || isCurrentWebViewHost) {
    return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, `${publicBase}/`).href;
  }

  return parsed.href;
}
