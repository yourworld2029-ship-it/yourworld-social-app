import { useEffect, useRef, useState } from "react";
import { fitImageToScreen, imageHeaderDimensions } from "./screen-image-sizing";

// A single decoder job bounds peak memory while a new feed window appears.
let decodeQueue: Promise<unknown> = Promise.resolve();
function serializeDecode<T>(job: () => Promise<T>): Promise<T> {
  const next = decodeQueue.then(job, job);
  decodeQueue = next.catch(() => {});
  return next;
}

export function screenImageBounds() {
  return {
    width: typeof window === "undefined" ? 720 : Math.min(1280, Math.max(1, window.innerWidth)),
    height: typeof window === "undefined" ? 1280 : Math.min(1920, Math.max(1, window.innerHeight)),
  };
}

async function resizeImage(source: string, signal: AbortSignal): Promise<Blob> {
  signal.throwIfAborted();
  const response = await fetch(source, { signal });
  if (!response.ok) throw new Error(`Thumbnail fetch failed (${response.status})`);
  const blob = await response.blob();
  signal.throwIfAborted();
  const bounds = screenImageBounds();
  const dimensions = imageHeaderDimensions(await blob.slice(0, 128 * 1024).arrayBuffer());
  const size = dimensions ? fitImageToScreen(dimensions.width, dimensions.height, bounds.width, bounds.height) : null;
  // Already compact uploads need no decode/re-encode at all.
  if (size && dimensions && size.width === dimensions.width && size.height === dimensions.height) return blob;
  if (typeof createImageBitmap !== "function") throw new Error("Screen-sized image decoding is unavailable");
  const bitmap = await createImageBitmap(blob, {
    resizeWidth: size?.width ?? bounds.width,
    resizeQuality: "medium",
  });
  const canvas = document.createElement("canvas");
  try {
    signal.throwIfAborted();
    const output = fitImageToScreen(bitmap.width, bitmap.height, bounds.width, bounds.height);
    canvas.width = output.width;
    canvas.height = output.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Thumbnail canvas is unavailable");
    context.drawImage(bitmap, 0, 0, output.width, output.height);
    const resized = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Thumbnail encoding failed")), "image/webp", 0.82);
    });
    signal.throwIfAborted();
    return resized;
  } finally {
    bitmap.close();
    canvas.width = canvas.height = 0;
  }
}

/** Only retain a screen-sized image for cards in/near the viewport. No persistent cache. */
export function useScreenImage(source: string | null | undefined, eager = false) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(eager);
  const [result, setResult] = useState<{ key: string; url: string | null; error: boolean; signal: AbortSignal } | null>(null);
  useEffect(() => {
    if (eager || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { rootMargin: "120px", threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!source || !visible || source.startsWith("data:image/svg")) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    void serializeDecode(async () => {
      const blob = await resizeImage(source, controller.signal);
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setResult({ key: source, url: objectUrl, error: false, signal: controller.signal });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.warn("[Thumbnail] Unable to prepare screen-sized image", error);
        setResult({ key: source, url: null, error: true, signal: controller.signal });
      }
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, visible]);
  const current = visible && result && result.key === source && !result.signal.aborted ? result : null;
  return {
    ref,
    source: source?.startsWith("data:image/svg") ? source : current?.url ?? null,
    error: current?.error ?? false,
  };
}