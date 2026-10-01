import { memo } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import type { UploadTask } from "@/lib/upload-progress";

export const PendingLongVideoUploadCard = memo(function PendingLongVideoUploadCard({
  task,
}: {
  task: UploadTask;
}) {
  const progress = Math.max(0, Math.min(100, Math.round(task.progress)));
  const status = task.status === "processing" ? "Preparing video" : "Uploading video";

  return (
    <article
      className="overflow-hidden rounded-xl border border-fuchsia-400/20 bg-[#141418]"
      data-testid={`pending-video-upload-${task.id}`}
      aria-label={`Your video ${task.label} is ${status.toLowerCase()}`}
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
        {task.thumbnail ? (
          <img
            src={task.thumbnail}
            alt=""
            className="h-full w-full object-cover opacity-75"
          />
        ) : (
          <div className="grid h-full place-items-center text-neutral-500">
            <UploadCloud aria-hidden="true" className="h-9 w-9" />
          </div>
        )}
        <div className="absolute inset-0 grid place-items-center bg-black/35">
          <div className="flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-medium text-white">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            {status}
          </div>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <h2 className="line-clamp-2 text-sm font-semibold text-white">
          {task.label || "Long video"}
        </h2>
        {task.caption ? (
          <p className="line-clamp-2 text-xs text-neutral-400">{task.caption}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <progress
            className="h-1.5 flex-1 overflow-hidden rounded-full accent-fuchsia-500"
            value={progress}
            max={100}
            aria-label={`Video upload progress: ${progress}%`}
          />
          <span className="min-w-9 text-right text-[11px] tabular-nums text-neutral-400">
            {progress}%
          </span>
        </div>
        <p className="text-[10px] text-neutral-500">
          Only you can see this while the video is being uploaded.
        </p>
      </div>
    </article>
  );
});