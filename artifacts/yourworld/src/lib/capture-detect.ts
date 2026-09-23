import { useEffect, useRef } from "react";

export type CaptureKind = "screenshot" | "recording";

/**
 * Best-effort screenshot / screen-recording detection.
 * Browsers cannot observe OS captures directly. Keep screenshot detection
 * limited to explicit desktop keyboard shortcuts; focus, visibility, touch,
 * and print lifecycle events are too noisy on mobile web.
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

    const isDesktop =
      !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) &&
      !("ontouchstart" in window);

    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const macCaptureShortcut =
        e.metaKey && e.shiftKey && ["3", "4", "5"].includes(key);
      const windowsSnipShortcut =
        e.shiftKey &&
        key === "s" &&
        (e.metaKey || e.getModifierState?.("OS") === true);
      const printScreen = e.key === "PrintScreen";
      if (!printScreen && !macCaptureShortcut && !windowsSnipShortcut) return;
      e.preventDefault();
      e.stopPropagation();
      fire("screenshot");
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

    if (isDesktop) {
      window.addEventListener("keydown", onKey, true);
      window.addEventListener("keyup", onKey, true);
    }
    return () => {
      if (isDesktop) {
        window.removeEventListener("keydown", onKey, true);
        window.removeEventListener("keyup", onKey, true);
      }
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
