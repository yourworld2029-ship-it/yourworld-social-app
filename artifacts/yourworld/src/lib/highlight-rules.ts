export const MAX_HIGHLIGHTS = 5;
export const MAX_HIGHLIGHTS_MESSAGE =
  "Maximum 5 highlights reached. Delete an existing highlight to add a new one.";

export function isHighlightVideoType(mediaType: string | null | undefined): boolean {
  const normalized = mediaType?.toLowerCase() ?? "";
  return normalized === "video" || normalized.startsWith("video/");
}

export function videoPreviewUrl(source: string | null | undefined): string | undefined {
  if (!source) return undefined;
  return `${source.split("#", 1)[0]}#t=0.001`;
}