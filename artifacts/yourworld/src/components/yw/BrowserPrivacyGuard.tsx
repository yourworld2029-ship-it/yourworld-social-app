import { useEffect, useRef, type ReactNode } from "react";

type BrowserPrivacyGuardProps = {
  pathname: string;
  children: ReactNode;
};

function isSensitivePath(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";

  return (
    path === "/" ||
    path === "/reels" ||
    path.startsWith("/reels/") ||
    path === "/chat" ||
    path.startsWith("/chat/") ||
    path === "/orbit" ||
    path.startsWith("/orbit/") ||
    path === "/moment" ||
    path.startsWith("/moment/") ||
    path === "/video" ||
    path.startsWith("/video/") ||
    path === "/live" ||
    path.startsWith("/live/") ||
    path === "/u" ||
    path.startsWith("/u/")
  );
}

export function BrowserPrivacyGuard({
  pathname,
  children,
}: BrowserPrivacyGuardProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const active = isSensitivePath(pathname);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!active || !surface) return;

    const documentRoot = document.documentElement;
    let shortcutResetTimer: number | null = null;
    const conceal = () => documentRoot.classList.add("yw-privacy-obscured");
    const revealWhenForegrounded = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        documentRoot.classList.remove("yw-privacy-obscured");
      }
    };
    const onWindowFocus = () => {
      if (document.visibilityState === "visible") {
        documentRoot.classList.remove("yw-privacy-obscured");
      }
    };
    const onAppResume = () => {
      documentRoot.classList.remove("yw-privacy-obscured");
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") conceal();
      else revealWhenForegrounded();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const printShortcut = (event.ctrlKey || event.metaKey) && key === "p";
      const screenshotShortcut =
        event.code === "PrintScreen" ||
        (event.metaKey &&
          event.shiftKey &&
          ["Digit3", "Digit4", "Digit5", "KeyS"].includes(event.code));

      if (!printShortcut && !screenshotShortcut) return;
      event.preventDefault();

      if (screenshotShortcut) {
        conceal();
        if (shortcutResetTimer !== null) {
          window.clearTimeout(shortcutResetTimer);
        }
        shortcutResetTimer = window.setTimeout(() => {
          shortcutResetTimer = null;
          revealWhenForegrounded();
        }, 1800);
      }
    };
    const blockBrowserAction = (event: Event) => event.preventDefault();
    const onBeforePrint = () => {
      documentRoot.classList.add("yw-print-blocked", "yw-privacy-obscured");
    };
    const onAfterPrint = () => {
      documentRoot.classList.remove("yw-print-blocked");
      revealWhenForegrounded();
    };

    documentRoot.classList.add("yw-sensitive-route");
    if (document.visibilityState === "hidden") conceal();
    window.addEventListener("blur", conceal);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("yw-app-resume", onAppResume);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("contextmenu", blockBrowserAction, true);
    document.addEventListener("dragstart", blockBrowserAction, true);

    return () => {
      if (shortcutResetTimer !== null) window.clearTimeout(shortcutResetTimer);
      window.removeEventListener("blur", conceal);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("yw-app-resume", onAppResume);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("contextmenu", blockBrowserAction, true);
      document.removeEventListener("dragstart", blockBrowserAction, true);
      documentRoot.classList.remove(
        "yw-sensitive-route",
        "yw-privacy-obscured",
        "yw-print-blocked",
      );
    };
  }, [active]);

  return (
    <div
      ref={surfaceRef}
      className={active ? "yw-sensitive-view" : undefined}
    >
      {children}
    </div>
  );
}