import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, AlertCircle, X, Loader2, UploadCloud, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ProgressFn } from "@/lib/storage-upload";
import type { UploadByteProgress } from "@/lib/storage-upload-request";
import {
  shouldUseNativeUploadGuard,
  startNativeMediaUploadGuard,
  type NativeMediaUploadGuard,
} from "@/lib/upload-background";
import {
  acquireMediaUploadLock,
  releaseMediaUploadLock,
  useMediaConcurrency,
} from "@/lib/media-concurrency";

export type UploadKind = "reel" | "video" | "post" | "moment";
export type UploadProgressReporter = ProgressFn;
export type UploadRunResult = { error: string | null; cancelled?: boolean };

export type UploadTask = {
  id: string;
  kind: UploadKind;
  label: string;
  thumbnail?: string | null;
  previewUrl?: string | null;
  ownerId?: string | null;
  caption?: string | null;
  /** Destination to open once the upload finishes. */
  viewTo: string;
  progress: number;
  bytesUploaded?: number | null;
  bytesTotal?: number | null;
  status: "uploading" | "processing" | "done" | "error";
  error?: string | null;
  detail?: string | null;
  retry?: () => void;
};

function readableTaskError(error: unknown) {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  return "Upload failed";
}

type Ctx = {
  tasks: UploadTask[];
  isMediaUploadInProgress: boolean;
  /** Runs an upload in the background while the user keeps browsing. */
  startUpload: (
    meta: {
      kind: UploadKind;
      label: string;
      thumbnail?: string | null;
      previewUrl?: string | null;
      viewTo: string;
      ownerId?: string | null;
      caption?: string | null;
      /** Marks video posts whose upload should be protected while Android is backgrounded. */
      isVideo?: boolean;
      /** Scheduled posts are queued successfully, but are not published yet. */
      notifyOnSuccess?: boolean;
    },
    runner: (
      onProgress: UploadProgressReporter,
      signal: AbortSignal,
    ) => Promise<UploadRunResult>,
    onStarted?: (id: string) => void,
  ) => Promise<UploadRunResult>;
  updatePreviewThumbnail: (id: string, thumbnail: string) => void;
  dismiss: (id: string) => void;
};

type UploadActions = Omit<Ctx, "tasks">;
export type PendingVideoUploadSummary = ReadonlyArray<{
  id: string;
  ownerId: string | null;
}>;

export function formatUploadBytes(bytes: number) {
  const safeBytes = Math.max(0, Number.isFinite(bytes) ? bytes : 0);
  if (safeBytes < 1000) return `${Math.round(safeBytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = safeBytes / 1000;
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatUploadByteProgress(
  bytesUploaded?: number | null,
  bytesTotal?: number | null,
) {
  if (
    bytesUploaded == null ||
    bytesTotal == null ||
    !Number.isFinite(bytesUploaded) ||
    !Number.isFinite(bytesTotal) ||
    bytesTotal <= 0
  ) {
    return null;
  }
  return `${formatUploadBytes(bytesUploaded)} of ${formatUploadBytes(bytesTotal)} uploaded`;
}

const UploadTasksContext = createContext<UploadTask[] | null>(null);
const UploadActionsContext = createContext<UploadActions | null>(null);
const PendingVideoUploadSummaryContext =
  createContext<PendingVideoUploadSummary>([]);

export function selectPendingVideoUploadSummary(
  tasks: readonly UploadTask[],
): PendingVideoUploadSummary {
  return tasks
    .filter(
      (task) =>
        task.kind === "video" &&
        (task.status === "uploading" || task.status === "processing"),
    )
    .map((task) => ({ id: task.id, ownerId: task.ownerId ?? null }));
}

export function arePendingVideoUploadSummariesEqual(
  left: PendingVideoUploadSummary,
  right: PendingVideoUploadSummary,
) {
  return (
    left.length === right.length &&
    left.every(
      (item, index) =>
        item.id === right[index]?.id && item.ownerId === right[index]?.ownerId,
    )
  );
}

export function applyUploadTaskPatch(
  tasks: UploadTask[],
  id: string,
  next: Partial<UploadTask>,
): UploadTask[] {
  const current = tasks.find((task) => task.id === id);
  if (!current) return tasks;

  const changed = (Object.keys(next) as Array<keyof UploadTask>).some(
    (key) => current[key] !== next[key],
  );
  if (!changed) return tasks;

  return tasks.map((task) => (task.id === id ? { ...task, ...next } : task));
}

export function selectVisibleUploadTask(
  tasks: readonly UploadTask[],
): UploadTask | null {
  for (let index = tasks.length - 1; index >= 0; index -= 1) {
    const task = tasks[index];
    if (task?.status === "uploading" || task?.status === "processing") {
      return task;
    }
  }
  return tasks[tasks.length - 1] ?? null;
}

export function useUploadTasks() {
  const tasks = useContext(UploadTasksContext);
  if (!tasks) throw new Error("useUploadTasks must be used inside <UploadProvider>");
  return tasks;
}

export function useUploadActions() {
  const actions = useContext(UploadActionsContext);
  if (!actions) throw new Error("useUploadActions must be used inside <UploadProvider>");
  return actions;
}

export function usePendingVideoUploadCount(ownerId?: string | null) {
  const pendingUploads = useContext(PendingVideoUploadSummaryContext);
  return useMemo(
    () => ownerId ? pendingUploads.filter((task) => task.ownerId === ownerId).length : 0,
    [ownerId, pendingUploads],
  );
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const { isMediaUploadInProgress } = useMediaConcurrency();
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const abortControllers = useRef(new Map<string, AbortController>());
  const liveTaskIds = useRef(new Set<string>());
  const previewObjectUrls = useRef(new Map<string, string>());
  const previewVideoObjectUrls = useRef(new Map<string, string>());
  const pendingVideoSummaryRef = useRef<PendingVideoUploadSummary>([]);

  const pendingVideoSummary = useMemo(() => {
    const next = selectPendingVideoUploadSummary(tasks);
    if (arePendingVideoUploadSummariesEqual(pendingVideoSummaryRef.current, next)) {
      return pendingVideoSummaryRef.current;
    }
    pendingVideoSummaryRef.current = next;
    return next;
  }, [tasks]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      abortControllers.current.forEach((controller) => controller.abort());
      abortControllers.current.clear();
      previewObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewObjectUrls.current.clear();
      previewVideoObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewVideoObjectUrls.current.clear();
      liveTaskIds.current.clear();
    },
    [],
  );

  const patch = useCallback((id: string, next: Partial<UploadTask>) => {
    setTasks((prev) => applyUploadTaskPatch(prev, id, next));
  }, []);

  const dismiss = useCallback((id: string) => {
    abortControllers.current.get(id)?.abort();
    abortControllers.current.delete(id);
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    liveTaskIds.current.delete(id);
    const previewUrl = previewObjectUrls.current.get(id);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewObjectUrls.current.delete(id);
    }
    const videoPreviewUrl = previewVideoObjectUrls.current.get(id);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      previewVideoObjectUrls.current.delete(id);
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updatePreviewThumbnail = useCallback((id: string, thumbnail: string) => {
    if (!liveTaskIds.current.has(id)) {
      URL.revokeObjectURL(thumbnail);
      return;
    }
    const previousUrl = previewObjectUrls.current.get(id);
    if (previousUrl && previousUrl !== thumbnail) URL.revokeObjectURL(previousUrl);
    previewObjectUrls.current.set(id, thumbnail);
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, thumbnail } : task)));
  }, []);

  const startUpload = useCallback<Ctx["startUpload"]>(
    async (meta, runner, onStarted) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const usesMediaUploadLock = meta.kind === "video" || meta.kind === "reel";
      let uploadLockHeld = false;
      if (usesMediaUploadLock) {
        if (!acquireMediaUploadLock(id)) return { error: null, cancelled: true };
        uploadLockHeld = true;
      }
      let hasRun = false;
      let highestProgress = 0;
      let lastByteProgress: UploadByteProgress | null | undefined;
      liveTaskIds.current.add(id);
      if (meta.previewUrl) previewVideoObjectUrls.current.set(id, meta.previewUrl);
      setTasks((prev) => [
        ...prev,
        { id, progress: 0, status: "uploading", ...meta },
      ]);
      try {
        onStarted?.(id);
      } catch (error) {
        console.warn("Could not initialize upload preview", error);
      }

      const run = async (): Promise<UploadRunResult> => {
        if (usesMediaUploadLock && !uploadLockHeld) {
          if (!acquireMediaUploadLock(id)) return { error: null, cancelled: true };
          uploadLockHeld = true;
        }
        const isRetry = hasRun;
        hasRun = true;
        const previousTimer = timers.current.get(id);
        if (previousTimer) {
          clearTimeout(previousTimer);
          timers.current.delete(id);
        }
        const controller = new AbortController();
        abortControllers.current.set(id, controller);
        const isLongVideo = meta.kind === "video";
        const runState: Partial<UploadTask> = {
          status: isLongVideo ? "uploading" : "processing",
          error: null,
          detail: isLongVideo ? (isRetry ? "Resuming upload" : "Starting upload") : null,
          retry: undefined,
        };
        if (!isRetry) {
          runState.progress = 0;
          runState.bytesUploaded = null;
          runState.bytesTotal = null;
        }
        patch(id, runState);

        let result: UploadRunResult = { error: null };
        let nativeGuard: NativeMediaUploadGuard | null = null;
        let lastProgressAt = 0;
        let progressTimer: ReturnType<typeof setTimeout> | null = null;
        let pendingProgress: {
          percent: number;
          detail?: string;
          byteProgress?: UploadByteProgress | null;
        } | null = null;
        const applyPendingProgress = () => {
          if (!pendingProgress) return;
          const next = pendingProgress;
          pendingProgress = null;
          lastProgressAt = Date.now();
          patch(id, {
            progress: next.percent,
            status: next.detail?.toLowerCase().includes("optim") || next.percent >= 100
              ? "processing"
              : "uploading",
            detail: next.detail ?? null,
            ...(next.byteProgress === undefined
              ? {}
              : next.byteProgress === null
                ? { bytesUploaded: null, bytesTotal: null }
                : {
                    bytesUploaded: next.byteProgress.bytesUploaded,
                    bytesTotal: next.byteProgress.bytesTotal,
                  }),
          });
        };
        try {
          if (shouldUseNativeUploadGuard(meta.kind, meta.isVideo)) {
            const uploadKind =
              meta.kind === "post" ? "video" : meta.kind;
            nativeGuard = await startNativeMediaUploadGuard(
              id,
              meta.label,
              uploadKind,
            );
            if (nativeGuard && !nativeGuard.notificationsEnabled) {
              toast.warning(
                "Enable notifications to see upload progress after leaving the app.",
              );
            }
            if (isRetry && highestProgress > 0) {
              nativeGuard?.update(highestProgress, "Resuming upload", lastByteProgress);
            }
          }
          if (controller.signal.aborted) {
            result = { error: null, cancelled: true };
          } else {
            result = await runner((p, detail, byteProgress) => {
              highestProgress = Math.max(
                highestProgress,
                Math.min(100, Math.max(0, Math.round(p))),
              );
              if (byteProgress != null) lastByteProgress = byteProgress;
              else if (lastByteProgress === undefined) lastByteProgress = byteProgress;
              nativeGuard?.update(highestProgress, detail, lastByteProgress);
              pendingProgress = {
                percent: highestProgress,
                detail,
                byteProgress: lastByteProgress,
              };
              const remaining = 200 - (Date.now() - lastProgressAt);
              if (remaining <= 0) {
                if (progressTimer) clearTimeout(progressTimer);
                progressTimer = null;
                applyPendingProgress();
              } else if (!progressTimer) {
                progressTimer = setTimeout(() => {
                  progressTimer = null;
                  applyPendingProgress();
                }, remaining);
              }
            }, controller.signal);
          }
        } catch (e) {
          result = controller.signal.aborted
            ? { error: null, cancelled: true }
            : { error: readableTaskError(e) };
        } finally {
          if (progressTimer) clearTimeout(progressTimer);
          progressTimer = null;
          if (controller.signal.aborted || result.cancelled) {
            pendingProgress = null;
          } else {
            applyPendingProgress();
          }
          if (usesMediaUploadLock && uploadLockHeld) {
            releaseMediaUploadLock(id);
            uploadLockHeld = false;
          }
          if (abortControllers.current.get(id) === controller) {
            abortControllers.current.delete(id);
          }
          try {
            if (
              controller.signal.aborted ||
              result.cancelled ||
              result?.error ||
              meta.notifyOnSuccess === false
            ) {
              await nativeGuard?.stop();
            } else {
              await nativeGuard?.complete();
            }
          } catch (error) {
            console.warn("Could not finish Android upload notification", error);
          }
        }

        if (controller.signal.aborted || result.cancelled) {
          liveTaskIds.current.delete(id);
          const thumbnailUrl = previewObjectUrls.current.get(id);
          if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
          previewObjectUrls.current.delete(id);
          const videoPreviewUrl = previewVideoObjectUrls.current.get(id);
          if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
          previewVideoObjectUrls.current.delete(id);
          setTasks((prev) => prev.filter((task) => task.id !== id));
          return { error: null, cancelled: true };
        }

        if (result.error) {
          console.error(`[Background ${meta.kind} upload failed] ${result.error}`);
          patch(id, { status: "error", error: result.error, detail: null, retry: () => void run() });
          timers.current.set(id, setTimeout(() => dismiss(id), 30_000));
        } else {
          patch(id, { status: "done", progress: 100, detail: null, retry: undefined });
          timers.current.set(id, setTimeout(() => dismiss(id), 6_000));
        }
        return result;
      };

      return run();
    },
    [patch, dismiss],
  );

  // Warn before leaving while media is still uploading.
  const active = tasks.some((t) => t.status === "uploading" || t.status === "processing");
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);

  const actions = useMemo(
    () => ({
      startUpload,
      updatePreviewThumbnail,
      dismiss,
      isMediaUploadInProgress,
    }),
    [startUpload, updatePreviewThumbnail, dismiss, isMediaUploadInProgress],
  );

  return (
    <UploadActionsContext.Provider value={actions}>
      <UploadTasksContext.Provider value={tasks}>
        <PendingVideoUploadSummaryContext.Provider value={pendingVideoSummary}>
          {children}
          <UploadProgressStack />
        </PendingVideoUploadSummaryContext.Provider>
      </UploadTasksContext.Provider>
    </UploadActionsContext.Provider>
  );
}

const TITLE: Record<UploadKind, string> = {
  reel: "Uploading reel",
  video: "Uploading video",
  post: "Uploading post",
  moment: "Uploading moment",
};

function UploadProgressStack() {
  const tasks = useUploadTasks();
  const { dismiss } = useUploadActions();
  const t = selectVisibleUploadTask(tasks);
  if (!t) return null;
  const byteProgress = formatUploadByteProgress(t.bytesUploaded, t.bytesTotal);
  const subtitle =
    t.status === "error"
      ? t.error
      : t.status === "done"
        ? t.label
        : t.kind === "video"
          ? t.label || "Video upload"
          : t.kind === "reel"
            ? "Uploading reel..."
            : t.status === "processing"
              ? "Finishing up…"
              : byteProgress
                ? `${byteProgress}${t.detail && t.detail !== "Uploading" ? ` · ${t.detail}` : ""}`
                : t.detail || t.label;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-3 pt-3">
      <div
        key={t.id}
        role="status"
        aria-live="polite"
        className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-[#141418]/95 shadow-xl backdrop-blur-md"
      >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
              {t.thumbnail ? (
            <img src={t.thumbnail} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-zinc-500">
                  {t.kind === "video" ? (
                    <UploadCloud size={16} />
                  ) : (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">
                {t.status === "done" || (t.status === "processing" && t.progress >= 100)
                  ? "Upload complete"
                  : t.status === "error"
                    ? "Upload failed"
                    : t.kind === "reel"
                      ? t.label || "New reel"
                      : TITLE[t.kind]}
              </p>
              <p className="truncate text-[11px] text-zinc-400">{subtitle}</p>
            </div>

            {t.status === "done" ? (
              <Link
                to={t.viewTo}
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-[11px] font-bold text-white"
              >
                View
              </Link>
            ) : t.status === "error" ? (
              <div className="flex shrink-0 items-center gap-2">
                <AlertCircle size={18} className="text-red-400" />
                {t.retry && (
                  <button
                    onClick={t.retry}
                    className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-300"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                )}
              </div>
            ) : (
              <span className="shrink-0 text-[11px] font-bold tabular-nums text-pink-400">
                {t.progress}%
              </span>
            )}

            <button
              onClick={() => dismiss(t.id)}
              aria-label={
                t.status === "uploading" || t.status === "processing"
                  ? "Cancel and dismiss upload"
                  : "Dismiss upload notification"
              }
              className="shrink-0 text-zinc-500 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="h-0.5 w-full rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                t.status === "error"
                  ? "bg-red-500"
                  : t.status === "done"
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-pink-500 to-purple-500"
              }`}
              style={{ width: `${t.status === "done" ? 100 : t.progress}%` }}
            />
          </div>

          {t.status === "done" && (
            <span className="sr-only">
              <CheckCircle2 size={12} /> done
            </span>
          )}
      </div>
    </div>
  );
}
