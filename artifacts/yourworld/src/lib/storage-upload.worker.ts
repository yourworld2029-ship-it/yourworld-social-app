import { Upload } from "tus-js-client";

type StartUploadMessage = {
  type: "start";
  endpoint: string;
  bucket: string;
  path: string;
  blob: Blob;
  contentType: string;
  token: string;
  supabaseKey: string;
  cacheControl: string;
  chunkSize: number;
  retryDelays: number[];
};

type WorkerRequest = StartUploadMessage | { type: "resume" };

type WorkerResponse =
  | { type: "progress"; bytesSent: number; bytesTotal: number }
  | { type: "success" }
  | { type: "offline" }
  | { type: "error"; message: string };

type WorkerScope = {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
};

const workerScope = self as unknown as WorkerScope;
let activeUpload: Upload | null = null;

workerScope.onmessage = ({ data }) => {
  if (data.type === "resume") {
    activeUpload?.start();
    return;
  }
  if (data.type !== "start") return;

  activeUpload = new Upload(data.blob, {
    endpoint: data.endpoint,
    headers: {
      Authorization: `Bearer ${data.token}`,
      apikey: data.supabaseKey,
      "x-upsert": "false",
    },
    metadata: {
      bucketName: data.bucket,
      objectName: data.path,
      contentType: data.contentType,
      cacheControl: data.cacheControl,
    },
    chunkSize: data.chunkSize,
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    retryDelays: data.retryDelays,
    onProgress: (bytesSent, bytesTotal) => {
      workerScope.postMessage({
        type: "progress",
        bytesSent,
        bytesTotal,
      });
    },
    onSuccess: () => {
      workerScope.postMessage({ type: "success" });
    },
    onError: (error) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        workerScope.postMessage({ type: "offline" });
        return;
      }
      workerScope.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "The resumable upload failed.",
      });
    },
  });

  try {
    activeUpload.start();
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Could not start the resumable upload.",
    });
  }
};