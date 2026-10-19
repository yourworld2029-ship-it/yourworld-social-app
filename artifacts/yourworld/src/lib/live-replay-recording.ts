const DATABASE_NAME = "yourworld-live-replay-recordings";
const STORE_NAME = "chunks";

type StoredChunk = {
  key: string;
  streamId: string;
  index: number;
  blob: Blob;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("streamId", "streamId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local replay storage."));
  });
}

async function storeChunk(chunk: StoredChunk) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(chunk);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save a replay segment."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Replay storage was interrupted."));
  });
  database.close();
}

async function readChunks(streamId: string) {
  const database = await openDatabase();
  const chunks = await new Promise<StoredChunk[]>((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .index("streamId")
      .getAll(IDBKeyRange.only(streamId));
    request.onsuccess = () => resolve(request.result as StoredChunk[]);
    request.onerror = () => reject(request.error ?? new Error("Could not read the replay."));
  });
  database.close();
  return chunks.sort((a, b) => a.index - b.index);
}

export async function clearLiveReplayRecording(streamId: string) {
  if (typeof indexedDB === "undefined") return;
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const index = transaction.objectStore(STORE_NAME).index("streamId");
    const request = index.openCursor(IDBKeyRange.only(streamId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear local replay data."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Could not clear local replay data."));
  });
  database.close();
}

function supportedRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return [
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
    "video/mp4",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
}

export class LiveReplayRecorder {
  private readonly streamId: string;
  private readonly video = document.createElement("video");
  private readonly canvas = document.createElement("canvas");
  private readonly canvasContext: CanvasRenderingContext2D;
  private readonly captureStream: MediaStream;
  private readonly recorder: MediaRecorder;
  private sourceStream: MediaStream;
  private frameTimer = 0;
  private chunkIndex = 0;
  private writes = Promise.resolve();
  private stopped = false;
  private stopPromise: Promise<void> | null = null;
  private storageError: Error | null = null;

  static create(streamId: string, sourceStream: MediaStream) {
    if (
      typeof document === "undefined" ||
      typeof indexedDB === "undefined" ||
      typeof MediaRecorder === "undefined" ||
      !sourceStream.getVideoTracks().some((track) => track.readyState === "live")
    ) {
      return null;
    }
    try {
      return new LiveReplayRecorder(streamId, sourceStream);
    } catch (error) {
      console.warn("[live-replay] Recording is unavailable on this device", error);
      return null;
    }
  }

  private constructor(streamId: string, sourceStream: MediaStream) {
    const mimeType = supportedRecorderMimeType();
    if (!mimeType) throw new Error("This device cannot record live video.");
    this.streamId = streamId;
    this.sourceStream = sourceStream;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = "none";
    this.video.setAttribute("aria-hidden", "true");
    this.video.style.position = "fixed";
    this.video.style.left = "-10000px";
    this.video.style.top = "0";
    this.video.style.width = "2px";
    this.video.style.height = "2px";
    document.body.appendChild(this.video);
    this.canvas.width = 720;
    this.canvas.height = 1280;
    const context = this.canvas.getContext("2d", { alpha: false });
    const capture = this.canvas.captureStream(24);
    if (!context || !capture.getVideoTracks()[0]) {
      capture.getTracks().forEach((track) => track.stop());
      this.video.remove();
      throw new Error("This device cannot capture the live video.");
    }
    this.canvasContext = context;
    this.captureStream = capture;
    const audioTrack = sourceStream.getAudioTracks().find((track) => track.readyState === "live");
    if (audioTrack) capture.addTrack(audioTrack);
    this.recorder = new MediaRecorder(capture, {
      mimeType,
      videoBitsPerSecond: 2_500_000,
      audioBitsPerSecond: 96_000,
    });
    this.recorder.ondataavailable = (event) => {
      if (!event.data.size || this.storageError) return;
      const index = this.chunkIndex++;
      this.writes = this.writes
        .then(() =>
          storeChunk({
            key: `${this.streamId}:${index.toString().padStart(10, "0")}`,
            streamId: this.streamId,
            index,
            blob: event.data,
          }),
        )
        .catch((error: unknown) => {
          this.storageError =
            error instanceof Error ? error : new Error("Could not save the replay locally.");
        });
    };
    this.recorder.onerror = (event) => {
      this.storageError =
        event instanceof ErrorEvent && event.error
          ? event.error
          : new Error("Live recording stopped unexpectedly.");
    };
    this.video.onloadedmetadata = () => this.resizeCanvas();
    this.video.srcObject = sourceStream;
    void this.video.play().catch(() => undefined);
    this.drawFrame();
    this.recorder.start(5000);
  }

  setSource(sourceStream: MediaStream) {
    if (this.stopped || sourceStream === this.sourceStream) return;
    this.sourceStream = sourceStream;
    this.video.srcObject = sourceStream;
    void this.video.play().catch(() => undefined);
  }

  private resizeCanvas() {
    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    if (width <= 0 || height <= 0) return;
    const scale = Math.min(1, 1280 / Math.max(width, height));
    const nextWidth = Math.max(2, Math.round((width * scale) / 2) * 2);
    const nextHeight = Math.max(2, Math.round((height * scale) / 2) * 2);
    if (this.canvas.width === nextWidth && this.canvas.height === nextHeight) return;
    this.canvas.width = nextWidth;
    this.canvas.height = nextHeight;
  }

  private drawFrame = () => {
    if (this.stopped) return;
    this.resizeCanvas();
    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    }
    this.frameTimer = window.setTimeout(this.drawFrame, 1000 / 24);
  };

  async finish() {
    if (!this.stopPromise) {
      this.stopPromise = new Promise<void>((resolve) => {
        if (this.recorder.state === "inactive") {
          resolve();
          return;
        }
        this.recorder.addEventListener("stop", () => resolve(), { once: true });
        try {
          this.recorder.stop();
        } catch {
          resolve();
        }
      });
    }
    await this.stopPromise;
    this.stopped = true;
    window.clearTimeout(this.frameTimer);
    this.video.pause();
    this.video.srcObject = null;
    this.video.remove();
    this.captureStream
      .getVideoTracks()
      .forEach((track) => track.stop());
    await this.writes;
    if (this.storageError) throw this.storageError;
    const chunks = await readChunks(this.streamId);
    if (chunks.length === 0) throw new Error("No live video was recorded.");
    const mimeType = chunks.find((chunk) => chunk.blob.type)?.blob.type || this.recorder.mimeType || "video/mp4";
    return {
      blob: new Blob(chunks.map((chunk) => chunk.blob), { type: mimeType }),
      mimeType,
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  discard() {
    this.stopped = true;
    window.clearTimeout(this.frameTimer);
    this.recorder.ondataavailable = null;
    this.recorder.onerror = null;
    if (this.recorder.state !== "inactive") {
      try {
        this.recorder.stop();
      } catch {
        // Media tracks can already have ended while the route is being removed.
      }
    }
    this.video.pause();
    this.video.srcObject = null;
    this.video.remove();
    this.captureStream
      .getVideoTracks()
      .forEach((track) => track.stop());
  }
}
