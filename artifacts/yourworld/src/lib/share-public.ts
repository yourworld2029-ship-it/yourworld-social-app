import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { buildPublicAppUrl } from "@/lib/public-app-url";

export type PublicShareOptions = {
  title: string;
  text: string;
  url: string;
  dialogTitle?: string;
};

export type PublicShareResult = "shared" | "copied" | "dismissed";

function isShareDismissal(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown; name?: unknown };
  return (
    candidate.name === "AbortError" ||
    candidate.code === "ERR_SHARE_CANCELLED" ||
    (typeof candidate.message === "string" &&
      /\b(cancelled|canceled)\b/i.test(candidate.message))
  );
}

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  if (typeof document === "undefined") {
    throw new Error("Clipboard access is unavailable.");
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Clipboard access is unavailable.");
}

export async function sharePublicContent(
  options: PublicShareOptions,
): Promise<PublicShareResult> {
  const url = buildPublicAppUrl(options.url);
  const payload = {
    title: options.title || "YourWorld",
    text: options.text || options.title || "Shared from YourWorld",
    url,
    dialogTitle: options.dialogTitle || "Share with",
  };

  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share(payload);
      return "shared";
    } catch (error) {
      if (isShareDismissal(error)) return "dismissed";
      if (typeof navigator === "undefined" || !navigator.share) throw error;
    }
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (isShareDismissal(error)) return "dismissed";
      throw error;
    }
  }

  await copyText(url);
  return "copied";
}
