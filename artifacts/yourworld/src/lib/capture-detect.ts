import { useEffect, useRef } from "react";

export type CaptureKind = "screenshot" | "recording";

/**
 * Screenshot / screen-recording detection.
 *
 * Web browsers do not expose a reliable OS screenshot signal, so the web
 * fallback uses blur/visibility only when the screenshot setting is enabled.
 * Input focus is explicitly ignored because opening the mobile keyboard also
 * changes focus and visibility. Native wrappers can dispatch the explicit
 * `yw:native-capture` event for authoritative capture notifications.
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
    let inputFocus = false;
    const protectedElement = document.getElementById(protectedElementId);
    const originalFilter = protectedElement?.style.filter ?? "";

    const isTextInputFocused = () => {
      const active = document.activeElement;
      return (
        active instanceof HTMLElement &&
        (active.matches("input, textarea") || active.isContentEditable)
      );
    };

    const syncInputFocus = () => {
      inputFocus = isTextInputFocused();
    };

    const clearProtection = () => {
      if (!protectedElement) return;
      protectedElement.style.filter = originalFilter;
    };

    const applyProtection = () => {
      if (!screenshotEnabled || inputFocus || isTextInputFocused()) return false;
      if (!protectedElement) return false;
      // Apply directly before notifying React or sending the alert. This must
      // not wait for a render cycle because the capture can happen immediately.
      protectedElement.style.filter = "blur(35px)";
      return true;
    };

    const handleCapture = (kind: CaptureKind) => {
      syncInputFocus();
      if (kind === "screenshot") {
        if (!screenshotEnabled || inputFocus) return;
        const now = Date.now();
        if (now - lastScreenshotAt < 3_000) return;
        if (!applyProtection()) return;
        lastScreenshotAt = now;
      }
      cb.current(kind);
    };

    const detectWebScreenshot = () => {
      syncInputFocus();
      if (inputFocus) return;
      const now = Date.now();
      if (now - lastScreenshotAt < 3_000) return;
      if (!applyProtection()) return;
      lastScreenshotAt = now;
      cb.current("screenshot");
    };

    const onWindowFocus = () => {
      syncInputFocus();
      clearProtection();
    };
    const onVisibilityChange = () => {
      syncInputFocus();
      if (document.visibilityState === "visible") {
        clearProtection();
      } else {
        detectWebScreenshot();
      }
    };
    const onWindowBlur = () => {
      detectWebScreenshot();
    };
    const onFocusIn = () => {
      syncInputFocus();
    };
    const onFocusOut = () => {
      queueMicrotask(syncInputFocus);
    };
    const onNativeCapture = (event: Event) => {
      const detail = (event as CustomEvent<{ kind?: unknown }>).detail;
      const kind = detail?.kind;
      if (kind === "screenshot" || kind === "recording") handleCapture(kind);
    };

    syncInputFocus();
    window.addEventListener("yw:native-capture", onNativeCapture);
    if (screenshotEnabled) {
      window.addEventListener("blur", onWindowBlur);
      window.addEventListener("focus", onWindowFocus);
      document.addEventListener("visibilitychange", onVisibilityChange);
      document.addEventListener("focusin", onFocusIn);
      document.addEventListener("focusout", onFocusOut);
    }
    return () => {
      window.removeEventListener("yw:native-capture", onNativeCapture);
      if (screenshotEnabled) {
        window.removeEventListener("blur", onWindowBlur);
        window.removeEventListener("focus", onWindowFocus);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("focusout", onFocusOut);
        clearProtection();
      }
    };
  }, [enabled, options?.protectedElementId, options?.screenshotEnabled]);
}
