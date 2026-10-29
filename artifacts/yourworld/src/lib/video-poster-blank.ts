/** Reject genuinely black opening frames, not letterboxing or dark scenes. */
export function isBlackVideoPoster(pixels: ArrayLike<number>): boolean {
  const count = Math.floor(pixels.length / 4);
  if (!count) return false;
  let black = 0;
  for (let i = 0; i < count * 4; i += 4) {
    if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) <= 16) black++;
  }
  return black / count >= 0.99;
}

export function hasBlackVideoPoster(source: CanvasImageSource): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(source, 0, 0, 32, 32);
    return isBlackVideoPoster(context.getImageData(0, 0, 32, 32).data);
  } catch {
    // Cross-origin images without canvas access remain valid image candidates.
    return false;
  }
}
