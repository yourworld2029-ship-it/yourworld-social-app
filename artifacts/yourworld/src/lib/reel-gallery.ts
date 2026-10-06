import { registerPlugin } from "@capacitor/core";
import {
  withMediaDownloadLock,
  type MediaDownloadLease,
} from "@/lib/media-concurrency";

type ReelGalleryExportPlugin = {
  beginSave(options: {
    fileName: string;
    mimeType: "video/mp4";
  }): Promise<{ transferId: string }>;
  appendData(options: { transferId: string; base64: string }): Promise<void>;
  finishSave(options: { transferId: string }): Promise<{
    uri: string;
    sizeBytes: number;
  }>;
  cancelSave(options: { transferId: string }): Promise<void>;
};

const ReelGalleryExport = registerPlugin<ReelGalleryExportPlugin>(
  "ReelGalleryExport",
);
const GALLERY_CHUNK_BYTES = 384 * 1024;

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32 * 1024) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, Math.min(offset + 32 * 1024, bytes.length)),
    );
  }
  return btoa(binary);
}

function safeMp4FileName(name: string) {
  const stem = name
    .replace(/\.mp4$/i, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
  return `${stem || "yourworld-reel"}.mp4`;
}

/** Writes a rendered Reel MP4 into Android's shared Movies/YourWorld gallery folder. */
export async function saveReelMp4ToAndroidGallery(
  blob: Blob,
  fileName: string,
  onProgress?: (percent: number) => void,
  lease?: MediaDownloadLease,
) {
  return withMediaDownloadLock(async () => {
    if (blob.type.toLowerCase().split(";")[0] !== "video/mp4") {
      throw new Error("Only a watermarked MP4 can be saved to the Reel gallery.");
    }
    if (!blob.size) throw new Error("The watermarked Reel file is empty.");

    const { transferId } = await ReelGalleryExport.beginSave({
      fileName: safeMp4FileName(fileName),
      mimeType: "video/mp4",
    });
    try {
      for (let offset = 0; offset < blob.size; offset += GALLERY_CHUNK_BYTES) {
        const chunk = new Uint8Array(
          await blob
            .slice(offset, Math.min(offset + GALLERY_CHUNK_BYTES, blob.size))
            .arrayBuffer(),
        );
        await ReelGalleryExport.appendData({
          transferId,
          base64: toBase64(chunk),
        });
        onProgress?.(
          Math.min(99, Math.round(((offset + chunk.byteLength) / blob.size) * 100)),
        );
      }
      const result = await ReelGalleryExport.finishSave({ transferId });
      onProgress?.(100);
      return result;
    } catch (error) {
      await ReelGalleryExport.cancelSave({ transferId }).catch(() => undefined);
      throw error;
    }
  }, lease);
}