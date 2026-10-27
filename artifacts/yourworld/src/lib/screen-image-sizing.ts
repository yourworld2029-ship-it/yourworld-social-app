export function fitImageToScreen(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, Math.max(1, maxWidth) / Math.max(1, width),
    Math.max(1, maxHeight) / Math.max(1, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Convert a CSS viewport to a bounded physical-pixel canvas size. */
export function fitDeviceCanvasBounds(
  width: number,
  height: number,
  devicePixelRatio: number,
) {
  const ratio = Number.isFinite(devicePixelRatio)
    ? Math.min(3, Math.max(1, devicePixelRatio))
    : 1;
  return {
    width: Math.max(1, Math.min(1440, Math.round(Math.max(1, width) * ratio))),
    height: Math.max(1, Math.min(2560, Math.round(Math.max(1, height) * ratio))),
  };
}

/** Read dimensions without decoding the full image into a GPU texture. */
export function imageHeaderDimensions(bytes: ArrayBuffer): { width: number; height: number } | null {
  const view = new DataView(bytes);
  if (view.byteLength >= 24 && view.getUint32(0) === 0x89504e47) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (view.byteLength >= 30 && view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250) {
    const chunk = view.getUint32(12);
    const uint24 = (offset: number) => view.getUint8(offset) | view.getUint8(offset + 1) << 8 |
      view.getUint8(offset + 2) << 16;
    if (chunk === 0x56503858) return { width: uint24(24) + 1, height: uint24(27) + 1 };
    if (chunk === 0x5650384c) {
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (chunk === 0x56503820) return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }
  if (view.byteLength >= 4 && view.getUint16(0) === 0xffd8) {
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset++) !== 0xff) continue;
      const marker = view.getUint8(offset++);
      if (marker === 0xff || marker === 0xd8 || marker === 0x01) continue;
      if (marker === 0xda || marker === 0xd9) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > view.byteLength) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) {
        return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
      }
      offset += length;
    }
  }
  return null;
}