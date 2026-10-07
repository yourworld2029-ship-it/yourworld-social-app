export type FullscreenGestureZone = "brightness" | "navigation" | "volume";

export function getFullscreenGestureZone(
  startX: number,
  width: number,
): FullscreenGestureZone {
  const normalizedX = Math.min(1, Math.max(0, startX / Math.max(width, 1)));
  if (normalizedX < 0.4) return "brightness";
  if (normalizedX >= 0.6) return "volume";
  return "navigation";
}

export function isVerticalAdjustmentGesture(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaY) >= 8 && Math.abs(deltaY) >= Math.abs(deltaX) * 1.1;
}
