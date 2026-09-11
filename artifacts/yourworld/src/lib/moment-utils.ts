import type { AiTool, MomentEffect } from "@/lib/moment-store";

/** CSS filter chain for the selected AI camera tools + effects. */
export function aiFilterCss(ai: Partial<Record<AiTool, boolean>>, effect: MomentEffect) {
  const parts: string[] = [];
  if (ai.beauty) parts.push("brightness(1.08) saturate(1.06) contrast(0.96) blur(0.4px)");
  if (ai.filter) parts.push("hue-rotate(-12deg) saturate(1.25)");
  if (ai.background) parts.push("contrast(1.12) saturate(1.3)");
  if (ai.cartoon) parts.push("contrast(1.5) saturate(1.7) brightness(1.05)");
  if (ai.eraser) parts.push("brightness(1.02)");
  if (effect === "greenscreen") parts.push("saturate(1.4) hue-rotate(8deg)");
  return parts.join(" ") || "none";
}