import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeUploadResiliencePlugin = {
  start(options: { uploadId: string; title: string }): Promise<void>;
  update(options: {
    uploadId: string;
    progress: number;
    detail?: string;
  }): Promise<void>;
  stop(options: { uploadId: string }): Promise<void>;
};

export type NativeVideoUploadGuard = {
  update(progress: number, detail?: string): void;
  stop(): Promise<void>;
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
    console.warn("Android upload foreground protection could not start", error);
    return null;
  }

  let lastUpdate = "";
  return {
    update(progress, detail) {
      const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
      const normalizedDetail = detail?.trim() ?? "";
      const updateKey = `${safeProgress}:${normalizedDetail}`;
      if (updateKey === lastUpdate) return;
      lastUpdate = updateKey;
      void NativeUploadResilience.update({
        uploadId,
        progress: safeProgress,
        detail: normalizedDetail || undefined,
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
  };
}