import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { markVideoBlobAsUploadReady } from "@/lib/video-compression";

type VideoOptimizerPlugin = {
  pickAndOptimize(): Promise<{
    cancelled: boolean;
    path?: string;
    fileName?: string;
    size?: number;
  }>;
  cancel(): Promise<void>;
  deleteOutput(options: { path: string }): Promise<void>;
  addListener(
    eventName: "optimizationProgress",
    listener: (event: { progress: number }) => void,
  ): Promise<PluginListenerHandle>;
};

const VideoOptimizer = registerPlugin<VideoOptimizerPlugin>("VideoOptimizer");

export function supportsNativeVideoOptimization() {
  return typeof window !== "undefined" && Capacitor.getPlatform() === "android";
}

export async function pickAndOptimizeNativeVideo(
  onProgress: (percent: number) => void,
): Promise<File | null> {
  let progressListener: PluginListenerHandle | null = null;
  let outputPath: string | null = null;
  try {
    progressListener = await VideoOptimizer.addListener(
      "optimizationProgress",
      ({ progress }) => onProgress(Math.max(0, Math.min(100, progress))),
    );
    const result = await VideoOptimizer.pickAndOptimize();
    if (result.cancelled) return null;
    if (!result.path || !result.fileName) {
      throw new Error("The optimized video could not be opened.");
    }
    outputPath = result.path;
    const response = await fetch(Capacitor.convertFileSrc(outputPath));
    if (!response.ok) throw new Error("Could not read the optimized video from this device.");
    const blob = await response.blob();
    if (!blob.size || (result.size && blob.size !== result.size)) {
      throw new Error("The optimized video could not be read completely.");
    }
    const file = new File([blob], result.fileName, {
      type: "video/mp4",
      lastModified: Date.now(),
    });
    markVideoBlobAsUploadReady(file);
    return file;
  } finally {
    await progressListener?.remove().catch(() => undefined);
    if (outputPath) {
      await VideoOptimizer.deleteOutput({ path: outputPath }).catch((error) => {
        console.warn("Could not clean up the temporary optimized video", error);
      });
    }
  }
}

export async function cancelNativeVideoOptimization() {
  if (!supportsNativeVideoOptimization()) return;
  await VideoOptimizer.cancel().catch(() => undefined);
}