import { useEffect, useRef } from "react";

export type CaptureKind = "screenshot" | "recording";

/**
 * Best-effort screenshot / screen-recording detection.
 * Browsers can't observe OS captures directly, so we watch for the signals we
 * do get: PrintScreen and macOS capture shortcuts, plus the brief focus/
 * visibility loss that accompanies a system capture UI. Fires `onCapture`
 * (throttled) instead of alerting.
 */
export function useCaptureDetect(
  enabled: boolean,
  onCapture: (kind: CaptureKind) => void,
) {
  const cb = useRef(onCapture);
  cb.current = onCapture;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let last = 0;
    const fire = (kind: CaptureKind) => {
      const now = Date.now();
      if (now - last < 300) return;
      last = now;
      cb.current(kind);
    };

    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const macCaptureShortcut =
        e.metaKey && e.shiftKey && ["3", "4", "5"].includes(key);
      const windowsSnipShortcut =
        e.shiftKey &&
        key === "s" &&
        (e.metaKey || e.getModifierState?.("OS") === true);
      const ctrlPrintShortcut = e.ctrlKey && key === "p";
      const printScreen = e.key === "PrintScreen";
      if (!printScreen && !macCaptureShortcut && !windowsSnipShortcut && !ctrlPrintShortcut) return;
      e.preventDefault();
      e.stopPropagation();
      fire("screenshot");
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") fire("screenshot");
    };
    const onBlur = () => fire("screenshot");
    const onBeforePrint = () => fire("screenshot");
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 3) fire("screenshot");
    };
    const mediaDevices = navigator.mediaDevices;
    const originalGetDisplayMedia = mediaDevices?.getDisplayMedia;
    const wrappedGetDisplayMedia = originalGetDisplayMedia
      ? function (this: MediaDevices, ...args: Parameters<MediaDevices["getDisplayMedia"]>) {
          fire("recording");
          return originalGetDisplayMedia.apply(this, args);
        }
      : null;
    if (mediaDevices && wrappedGetDisplayMedia) {
      try {
        mediaDevices.getDisplayMedia = wrappedGetDisplayMedia;
      } catch {
        // Some browsers expose read-only media device methods.
      }
    }

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("blur", onBlur, true);
    window.addEventListener("beforeprint", onBeforePrint, true);
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVisibility, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", onBlur, true);
      window.removeEventListener("beforeprint", onBeforePrint, true);
      window.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("visibilitychange", onVisibility, true);
      if (mediaDevices && wrappedGetDisplayMedia && mediaDevices.getDisplayMedia === wrappedGetDisplayMedia) {
        try {
          mediaDevices.getDisplayMedia = originalGetDisplayMedia;
        } catch {
          // Some browsers expose read-only media device methods.
        }
      }
    };
  }, [enabled]);
}
