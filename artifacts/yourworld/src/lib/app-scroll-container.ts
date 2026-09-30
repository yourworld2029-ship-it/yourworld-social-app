export const APP_SCROLL_RESTORATION_ID = "yourworld-app";

export function getAppScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(
    `[data-scroll-restoration-id="${APP_SCROLL_RESTORATION_ID}"]`,
  );
}