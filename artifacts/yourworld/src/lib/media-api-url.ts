import { Capacitor } from "@capacitor/core";

/** Bundled WebViews serve local assets, not the hosted Express API. */
export function mediaApiUrl(path: string) {
  return resolveMediaApiUrl(path, Capacitor.isNativePlatform(), import.meta.env.VITE_APP_URL);
}

export function resolveMediaApiUrl(path: string, native: boolean, origin?: string) {
  if (!native) return path;
  if (!origin) throw new Error("The installed app has no configured media server.");
  const url = new URL(path, origin);
  if (url.protocol !== "https:") throw new Error("The media server must use HTTPS.");
  return url.toString();
}