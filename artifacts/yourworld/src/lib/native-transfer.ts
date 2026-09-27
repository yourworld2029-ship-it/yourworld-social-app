import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle,
} from "@capacitor/core";

export type NativeTransferKind = "upload" | "download";
export type NativeTransferStatus = "queued" | "running" | "complete" | "error";

export type NativeTransferSnapshot = {
  id: string;
  kind: NativeTransferKind;
  status: NativeTransferStatus;
  bytesTransferred: number;
  totalBytes: number;
  bytesPerSecond: number;
  error?: string;
  storagePath?: string;
  relativePath?: string;
  metadata?: Record<string, unknown>;
};

type TransferPlugin = {
  beginUpload(options: { id: string; fileName: string }): Promise<void>;
  appendUploadChunk(options: { id: string; base64: string }): Promise<void>;
  enqueueUpload(options: {
    id: string;
    endpoint: string;
    token: string;
    apiKey: string;
    bucket: string;
    path: string;
    contentType: string;
    cacheControl: string;
    totalBytes: number;
  }): Promise<void>;
  enqueueDownload(options: {
    id: string;
    url: string;
    fileName: string;
    title: string;
    totalBytes?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  getTransfers(): Promise<NativeTransferSnapshot[]>;
  getDownloadUri(options: { relativePath: string }): Promise<{ uri: string }>;
  deleteDownload(options: { relativePath: string }): Promise<void>;
  discardUpload(options: { id: string }): Promise<void>;
  addListener(
    eventName: "transferProgress",
    listener: (event: NativeTransferSnapshot) => void,
  ): Promise<PluginListenerHandle>;
};

export const nativeTransfer = registerPlugin<TransferPlugin>("Transfer");

export function supportsNativeTransfers() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function createNativeTransferId(kind: NativeTransferKind) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${kind}-${random}`.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function getNativeTransferSnapshot(id: string) {
  const snapshots = await nativeTransfer.getTransfers();
  return snapshots.find((snapshot) => snapshot.id === id) ?? null;
}

export async function getNativeDownloadUri(relativePath: string) {
  const { uri } = await nativeTransfer.getDownloadUri({ relativePath });
  return Capacitor.convertFileSrc(uri);
}