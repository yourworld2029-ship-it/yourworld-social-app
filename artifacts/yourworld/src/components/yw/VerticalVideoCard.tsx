import { MoreVertical, Play } from "lucide-react";
import { VideoPoster } from "@/components/yw/VideoPoster";
import { formatViews, type LongVideo } from "@/lib/video-data";

export function VerticalVideoCard({ video }: { video: LongVideo }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = `/video/${video.id}`;
      }}
      aria-label={`Watch ${video.title}`}
      className="group relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-zinc-900 p-0 text-left shadow-md"
    >
      <VideoPoster
        thumbnailUrl={video.thumbnailUrl}
        mediaUrl={video.mediaUrl}
        alt={video.title}
        className="w-full h-full object-cover"
      />

      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-black/70 text-white shadow-lg">
          <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" />
        </span>
      </span>

      <span
        aria-hidden="true"
        className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm"
      >
        <MoreVertical size={18} />
      </span>

      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2.5 flex flex-col justify-end">
        <span className="text-xs font-semibold text-white line-clamp-2 leading-tight">
          {video.title}
        </span>
        <span className="text-[10px] text-white/70 mt-0.5">{formatViews(video.views)}</span>
      </span>
    </button>
  );
}