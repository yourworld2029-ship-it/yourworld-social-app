import { useEffect, useRef } from "react";
import { isNativeAndroid, listenForAndroidCaptureEvents } from "./native-privacy";

export type CaptureKind = "screenshot" | "recording";

/**
 * Screenshot / screen-recording detection.
 *
 * Web browsers do not expose a reliable OS screenshot signal. Chat surfaces
 * use blur/visibility as a best-effort fallback; Android can report recording
 * visibility on API 35+ while other native wrappers may dispatch the custom event.
 */
export function useCaptureDetect(
  enabled: boolean,
  onCapture: (kind: CaptureKind) => void,
  options?: {
    screenshotEnabled?: boolean;
    recordingEnabled?: boolean;
    protectedElementId?: string;
  },
) {
  const cb = useRef(onCapture);
  cb.current = onCapture;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const screenshotEnabled = options?.screenshotEnabled ?? enabled;
    const recordingEnabled = options?.recordingEnabled ?? enabled;
    if (!screenshotEnabled && !recordingEnabled) return;
    const protectedElementId = options?.protectedElementId ?? "chat-messages-container";
    let lastScreenshotAt = 0;
    const protectedElement = document.getElementById(protectedElementId);
    let originalFilter = "";
    let blurApplied = false;
    const clearProtection = () => {
      if (protectedElement && blurApplied) {
        if (protectedElement.style.filter === "blur(35px)") {
          protectedElement.style.filter = originalFilter;
        }
        blurApplied = false;
      }
    };

    const applyProtection = () => {
      if (!screenshotEnabled || !protectedElement) return false;
      if (!blurApplied) {
        originalFilter = protectedElement.style.filter;
        protectedElement.style.filter = "blur(35px)";
        blurApplied = true;
      }
      return true;
    };

    const handleCapture = (kind: CaptureKind) => {
      if (kind === "screenshot") {
        if (!screenshotEnabled) return;
        const now = Date.now();
        if (now - lastScreenshotAt < 3_000) return;
        lastScreenshotAt = now;
      } else if (!recordingEnabled) {
        return;
      }
      cb.current(kind);
    };

    const hasEditableFocus = () => {
      const active = document.activeElement;
      return (
        active instanceof HTMLElement &&
        (active.isContentEditable ||
          active.matches("input, textarea, select, [contenteditable='true']"))
      );
    };

    const detectWebScreenshot = () => {
      if (!screenshotEnabled || isNativeAndroid() || hasEditableFocus()) return;
      const now = Date.now();
      if (now - lastScreenshotAt < 3_000) return;
      if (!applyProtection()) return;
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
    const stopNativeMonitoring = recordingEnabled
      ? listenForAndroidCaptureEvents(handleCapture)
      : undefined;
    const webScreenshotFallbackEnabled = screenshotEnabled && !isNativeAndroid();
    if (webScreenshotFallbackEnabled) {
      window.addEventListener("blur", onWindowBlur);
      window.addEventListener("focus", onWindowFocus);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    return () => {
      window.removeEventListener("yw:native-capture", onNativeCapture);
      stopNativeMonitoring?.();
      if (webScreenshotFallbackEnabled) {
        window.removeEventListener("blur", onWindowBlur);
        window.removeEventListener("focus", onWindowFocus);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        clearProtection();
      }
    };
  }, [
    enabled,
    options?.protectedElementId,
    options?.recordingEnabled,
    options?.screenshotEnabled,
  ]);
}
