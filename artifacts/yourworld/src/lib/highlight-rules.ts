export const MAX_HIGHLIGHTS = 10;
export const MAX_HIGHLIGHTS_MESSAGE =
  "Limit Reached: You can create a maximum of 10 highlights. Please delete an existing highlight to add a new one.";

export function isHighlightVideoType(mediaType: string | null | undefined): boolean {
  const normalized = mediaType?.toLowerCase() ?? "";
  return normalized === "video" || normalized.startsWith("video/");
}

export function videoPreviewUrl(source: string | null | undefined): string | undefined {
  if (!source) return undefined;
  return `${source.split("#", 1)[0]}#t=0.001`;
}