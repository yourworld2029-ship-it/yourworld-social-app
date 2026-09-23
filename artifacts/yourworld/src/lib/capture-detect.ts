import { useEffect, useRef } from "react";

export type CaptureKind = "screenshot" | "recording";

/**
 * Native-only screenshot / screen-recording bridge.
 *
 * Standard web browsers do not expose reliable OS capture signals. The chat
 * listens only for an explicit event dispatched by a native wrapper; it never
 * observes focus, visibility, print, touch, keyboard, or screen-share events.
 */
export function useCaptureDetect(
  enabled: boolean,
  onCapture: (kind: CaptureKind) => void,
) {
  const cb = useRef(onCapture);
  cb.current = onCapture;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const onNativeCapture = (event: Event) => {
      const detail = (event as CustomEvent<{ kind?: unknown }>).detail;
      const kind = detail?.kind;
      if (kind === "screenshot" || kind === "recording") cb.current(kind);
    };
    window.addEventListener("yw:native-capture", onNativeCapture);
    return () => {
      window.removeEventListener("yw:native-capture", onNativeCapture);
    };
  }, [enabled]);
}
