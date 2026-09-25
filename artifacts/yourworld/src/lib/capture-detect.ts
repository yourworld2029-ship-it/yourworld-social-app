import { useEffect, useRef } from "react";

export type CaptureKind = "screenshot" | "recording";

/**
 * Screenshot / screen-recording detection.
 *
 * Web browsers do not expose a reliable OS screenshot signal. Chat surfaces
 * use blur/visibility as a best-effort fallback; native wrappers can dispatch
 * `yw:native-capture` for an explicit capture notification.
 */
export function useCaptureDetect(
  enabled: boolean,
  onCapture: (kind: CaptureKind) => void,
  options?: { screenshotEnabled?: boolean; protectedElementId?: string },
) {
  const cb = useRef(onCapture);
  cb.current = onCapture;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const screenshotEnabled = options?.screenshotEnabled ?? enabled;
    const protectedElementId = options?.protectedElementId ?? "chat-messages-container";
    let lastScreenshotAt = 0;
    const protectedElement = document.getElementById(protectedElementId);
    let shield: HTMLDivElement | null = null;
    let shieldTracking = false;

    const positionShield = () => {
      if (!protectedElement || !shield) return;
      const rect = protectedElement.getBoundingClientRect();
      shield.style.display = rect.width > 0 && rect.height > 0 ? "block" : "none";
      shield.style.left = `${rect.left}px`;
      shield.style.top = `${rect.top}px`;
      shield.style.width = `${rect.width}px`;
      shield.style.height = `${rect.height}px`;
    };
    const clearProtection = () => {
      if (shieldTracking) {
        window.removeEventListener("scroll", positionShield, true);
        window.removeEventListener("resize", positionShield);
        shieldTracking = false;
      }
      shield?.remove();
      shield = null;
    };

    const applyProtection = () => {
      if (!screenshotEnabled || !protectedElement || !document.body) return false;
      if (!shield) {
        shield = document.createElement("div");
        shield.setAttribute("aria-hidden", "true");
        shield.dataset.ywCaptureShield = "true";
        shield.style.cssText =
          "position:fixed;z-index:2147483647;background:#000;pointer-events:none;";
        document.body.appendChild(shield);
      }
      // Place an opaque shield synchronously, before any alert/network work.
      positionShield();
      if (!shieldTracking) {
        window.addEventListener("scroll", positionShield, true);
        window.addEventListener("resize", positionShield);
        shieldTracking = true;
      }
      return true;
    };

    const handleCapture = (kind: CaptureKind) => {
      if (screenshotEnabled) applyProtection();
      if (kind === "screenshot") {
        if (!screenshotEnabled) return;
        const now = Date.now();
        if (now - lastScreenshotAt < 3_000) return;
        lastScreenshotAt = now;
      }
      cb.current(kind);
    };

    const detectWebScreenshot = () => {
      if (!applyProtection()) return;
      const now = Date.now();
      if (now - lastScreenshotAt < 3_000) return;
      lastScreenshotAt = now;
      cb.current("screenshot");
    };

    const onWindowFocus = () => {
      if (document.visibilityState === "visible") clearProtection();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        clearProtection();
      } else {
        detectWebScreenshot();
      }
    };
    const onWindowBlur = () => {
      detectWebScreenshot();
    };
    const onNativeCapture = (event: Event) => {
      const detail = (event as CustomEvent<{ kind?: unknown }>).detail;
      const kind = detail?.kind;
      if (kind === "screenshot" || kind === "recording") handleCapture(kind);
    };

    window.addEventListener("yw:native-capture", onNativeCapture);
    if (screenshotEnabled) {
      window.addEventListener("blur", onWindowBlur);
      window.addEventListener("focus", onWindowFocus);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    return () => {
      window.removeEventListener("yw:native-capture", onNativeCapture);
      if (screenshotEnabled) {
        window.removeEventListener("blur", onWindowBlur);
        window.removeEventListener("focus", onWindowFocus);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        clearProtection();
      }
    };
  }, [enabled, options?.protectedElementId, options?.screenshotEnabled]);
}
