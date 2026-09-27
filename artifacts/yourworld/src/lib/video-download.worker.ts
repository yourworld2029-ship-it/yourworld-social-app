import { fetchVideoBlob } from "@/lib/video-download-transport";

type StartMessage = {
  type: "start";
  src: string;
  fileName: string;
};

type WorkerRequest = StartMessage;

type WorkerResponse =
  | { type: "progress"; percent: number }
  | {
      type: "bytes";
      bytesTransferred: number;
      totalBytes: number;
    }
  | { type: "complete"; blob: Blob }
  | { type: "error"; message: string };

type WorkerScope = {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.onmessage = ({ data }) => {
  if (data.type !== "start") return;
  void fetchVideoBlob(
    data.src,
    (percent) => workerScope.postMessage({ type: "progress", percent }),
    data.fileName,
    (bytesTransferred, totalBytes) =>
      workerScope.postMessage({ type: "bytes", bytesTransferred, totalBytes }),
  )
    .then((blob) => workerScope.postMessage({ type: "complete", blob }))
    .catch((error: unknown) =>
      workerScope.postMessage({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "The video download failed.",
      }),
    );
};