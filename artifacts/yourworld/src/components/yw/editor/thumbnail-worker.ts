type ThumbnailRequest = {
  id: number;
  bitmap: ImageBitmap;
  width: number;
  height: number;
};

type ThumbnailResponse =
  | { id: number; blob: Blob }
  | { id: number; error: string };

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ThumbnailRequest>) => void) | null;
  postMessage: (message: ThumbnailResponse) => void;
};

workerScope.onmessage = async ({ data }) => {
  try {
    if (typeof OffscreenCanvas === "undefined") {
      throw new Error("OffscreenCanvas unavailable");
    }
    const canvas = new OffscreenCanvas(data.width, data.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("thumbnail canvas unavailable");
    context.drawImage(data.bitmap, 0, 0, data.width, data.height);
    data.bitmap.close();
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.65 });
    workerScope.postMessage({ id: data.id, blob });
  } catch (error) {
    try {
      data.bitmap.close();
    } catch {
      // The bitmap may already be closed after a failed encode.
    }
    workerScope.postMessage({
      id: data.id,
      error: error instanceof Error ? error.message : "thumbnail encode failed",
    });
  }
};