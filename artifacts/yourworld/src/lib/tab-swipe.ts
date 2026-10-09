export type TabSwipeDestination = "/" | "/chat";

const MIN_HORIZONTAL_DISTANCE = 72;

export function resolveTabSwipeDestination(
  pathname: string,
  deltaX: number,
  deltaY: number,
): TabSwipeDestination | null {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return null;

  const horizontalDistance = Math.abs(deltaX);
  const verticalDistance = Math.abs(deltaY);
  if (
    horizontalDistance < MIN_HORIZONTAL_DISTANCE ||
    verticalDistance > Math.max(36, horizontalDistance * 0.7)
  ) {
    return null;
  }

  if (pathname === "/" && deltaX < 0) return "/chat";
  if ((pathname === "/chat" || pathname === "/chat/") && deltaX > 0) {
    return "/";
  }

  return null;
}
