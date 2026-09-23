import { useEffect, useRef } from "react";

type CaptureKind = "screenshot" | "recording";

type CaptureOptions = {
  onBeforeCapture?: (kind: CaptureKind) => void;
  onRecover?: () => void;
};

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
  options: CaptureOptions = {},
) {
  const cb = useRef(onCapture);
  cb.current = onCapture;
  const beforeCapture = useRef(options.onBeforeCapture);
  beforeCapture.current = options.onBeforeCapture;
  const recover = useRef(options.onRecover);
  recover.current = options.onRecover;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      recover.current?.();
      return;
    }
    let last = 0;
    const fire = (kind: CaptureKind) => {
      beforeCapture.current?.(kind);
      const now = Date.now();
      if (now - last < 4000) return;
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
      const ctrlCaptureShortcut =
        e.ctrlKey && e.shiftKey && ["3", "4", "5", "s"].includes(key);
      const printScreen = e.key === "PrintScreen";
      if (!printScreen && !macCaptureShortcut && !windowsSnipShortcut && !ctrlCaptureShortcut) return;
      e.preventDefault();
      e.stopPropagation();
      fire(macCaptureShortcut && key === "5" ? "recording" : "screenshot");
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") fire("screenshot");
      else recover.current?.();
    };
    const onBlur = () => fire("screenshot");
    const onFocus = () => recover.current?.();
    const onBeforePrint = () => beforeCapture.current?.("screenshot");
    const onAfterPrint = () => recover.current?.();
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 3) fire("screenshot");
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("blur", onBlur, true);
    window.addEventListener("focus", onFocus, true);
    window.addEventListener("beforeprint", onBeforePrint, true);
    window.addEventListener("afterprint", onAfterPrint, true);
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVisibility, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", onBlur, true);
      window.removeEventListener("focus", onFocus, true);
      window.removeEventListener("beforeprint", onBeforePrint, true);
      window.removeEventListener("afterprint", onAfterPrint, true);
      window.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("visibilitychange", onVisibility, true);
      recover.current?.();
    };
  }, [enabled]);
}
