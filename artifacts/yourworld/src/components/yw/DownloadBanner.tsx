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
          Downloading {visibleTask.title}... {visibleTask.percent}%
        </span>
        <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-pink-400 to-violet-400 transition-[width] duration-150"
            style={{ width: `${visibleTask.percent}%` }}
          />
        </span>
      </div>
    </div>
  );
}