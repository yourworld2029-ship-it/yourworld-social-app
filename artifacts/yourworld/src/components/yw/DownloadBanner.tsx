import { Download } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getDownloadTasksSnapshot,
  subscribeDownloadTasks,
  type DownloadTask,
} from "@/lib/yw-download";

export function DownloadBanner() {
  const tasks = useSyncExternalStore(
    subscribeDownloadTasks,
    getDownloadTasksSnapshot,
    getDownloadTasksSnapshot,
  );
  const activeTask = tasks[0] ?? null;
  const [visibleTask, setVisibleTask] = useState<DownloadTask | null>(null);
  const [closing, setClosing] = useState(false);
  const totalBytes = tasks.reduce((sum, task) => sum + (task.totalBytes ?? 0), 0);
  const downloadedBytes = tasks.reduce(
    (sum, task) => sum + (task.bytesTransferred ?? 0),
    0,
  );
  const aggregatePercent = tasks.length
    ? totalBytes > 0
      ? Math.min(99, (downloadedBytes / totalBytes) * 100)
      : tasks.reduce((sum, task) => sum + task.percent, 0) / tasks.length
    : visibleTask?.percent ?? 0;
  const transferSpeed = tasks.length
    ? tasks.reduce((sum, task) => sum + (task.bytesPerSecond ?? 0), 0)
    : visibleTask?.bytesPerSecond ?? 0;
  const speedLabel = formatTransferSpeed(transferSpeed);

  useEffect(() => {
    if (activeTask) {
      setVisibleTask(activeTask);
      setClosing(false);
      return;
    }
    if (!visibleTask) return;
    setClosing(true);
    const timeout = window.setTimeout(() => setVisibleTask(null), 320);
    return () => window.clearTimeout(timeout);
  }, [activeTask, visibleTask]);

  if (!visibleTask) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[200] flex justify-center px-3 transition-all duration-300 ${
        closing ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-sm items-center gap-2.5 rounded-full border border-white/15 bg-zinc-950/90 px-3.5 py-2 text-xs text-white shadow-2xl backdrop-blur-xl">
        <Download className="h-4 w-4 shrink-0 text-pink-300" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {tasks.length > 1
            ? `Downloading ${tasks.length} items... ${Math.round(aggregatePercent)}%`
            : `Downloading ${visibleTask.title}... ${Math.round(aggregatePercent)}%`}
          {speedLabel ? ` · ${speedLabel}` : ""}
        </span>
        <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-pink-400 to-violet-400 transition-[width] duration-150"
            style={{ width: `${aggregatePercent}%` }}
          />
        </span>
      </div>
    </div>
  );
}

function formatTransferSpeed(bytesPerSecond: number) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond < 1) return null;
  const units = ["B/s", "KiB/s", "MiB/s", "GiB/s"];
  let value = bytesPerSecond;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}