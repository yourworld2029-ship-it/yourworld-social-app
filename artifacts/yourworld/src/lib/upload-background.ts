import { Capacitor, registerPlugin } from "@capacitor/core";
import type { UploadByteProgress } from "@/lib/storage-upload-request";

type NativeUploadResiliencePlugin = {
  start(options: { uploadId: string; title: string }): Promise<void>;
  update(options: {
    uploadId: string;
    progress: number;
    detail?: string;
    bytesUploaded?: number;
    bytesTotal?: number;
    clearByteProgress?: boolean;
  }): Promise<void>;
  stop(options: { uploadId: string }): Promise<void>;
  complete(options: { uploadId: string }): Promise<void>;
};

export type NativeVideoUploadGuard = {
  update(
    progress: number,
    detail?: string,
    byteProgress?: UploadByteProgress | null,
  ): void;
  stop(): Promise<void>;
  complete(): Promise<void>;
};

const NativeUploadResilience =
  registerPlugin<NativeUploadResiliencePlugin>("UploadResilience");

export async function startNativeVideoUploadGuard(
  uploadId: string,
  title: string,
): Promise<NativeVideoUploadGuard | null> {
  if (typeof window === "undefined" || Capacitor.getPlatform() !== "android") {
    return null;
  }

  try {
    await NativeUploadResilience.start({ uploadId, title });
  } catch (error) {
    console.error("Android upload foreground protection could not start", error);
    throw new Error("Android could not start the required upload notification. Try again.", {
      cause: error,
    });
  }

  let lastUpdate = "";
  return {
    update(progress, detail, byteProgress) {
      const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
      const normalizedDetail = detail?.trim() ?? "";
      const byteKey = byteProgress
        ? `${byteProgress.bytesUploaded}:${byteProgress.bytesTotal}`
        : byteProgress === null
          ? "clear"
          : "keep";
      const updateKey = `${safeProgress}:${normalizedDetail}:${byteKey}`;
      if (updateKey === lastUpdate) return;
      lastUpdate = updateKey;
      void NativeUploadResilience.update({
        uploadId,
        progress: safeProgress,
        detail: normalizedDetail || undefined,
        ...(byteProgress === null
          ? { clearByteProgress: true }
          : byteProgress
            ? {
                bytesUploaded: byteProgress.bytesUploaded,
                bytesTotal: byteProgress.bytesTotal,
              }
            : {}),
      }).catch((error) => {
        console.warn("Android upload notification could not be updated", error);
      });
    },
    async stop() {
      try {
        await NativeUploadResilience.stop({ uploadId });
      } catch (error) {
        console.warn("Android upload foreground protection could not stop", error);
      }
    },
    async complete() {
      try {
        await NativeUploadResilience.complete({ uploadId });
      } catch (error) {
        console.warn("Android upload completion notification could not be shown", error);
        await NativeUploadResilience.stop({ uploadId }).catch(() => {});
      }
    },
  };
}