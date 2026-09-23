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
  options?: { screenshotEnabled?: boolean },
) {
  const cb = useRef(onCapture);
  cb.current = onCapture;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const screenshotEnabled = options?.screenshotEnabled ?? enabled;
    let lastWebScreenshotAt = 0;

    const isTextInputFocused = () => {
      const active = document.activeElement;
      return (
        active instanceof HTMLElement &&
        (active.matches("input, textarea") || active.isContentEditable)
      );
    };

    const detectWebScreenshot = () => {
      if (!screenshotEnabled || isTextInputFocused()) return;
      const now = Date.now();
      if (now - lastWebScreenshotAt < 4_000) return;
      lastWebScreenshotAt = now;
      cb.current("screenshot");
    };

    const onNativeCapture = (event: Event) => {
      const detail = (event as CustomEvent<{ kind?: unknown }>).detail;
      const kind = detail?.kind;
      if (kind === "screenshot" || kind === "recording") cb.current(kind);
    };
    window.addEventListener("yw:native-capture", onNativeCapture);
    if (screenshotEnabled) {
      window.addEventListener("blur", detectWebScreenshot);
      document.addEventListener("visibilitychange", detectWebScreenshot);
    }
    return () => {
      window.removeEventListener("yw:native-capture", onNativeCapture);
      if (screenshotEnabled) {
        window.removeEventListener("blur", detectWebScreenshot);
        document.removeEventListener("visibilitychange", detectWebScreenshot);
      }
    };
  }, [enabled, options?.screenshotEnabled]);
}
