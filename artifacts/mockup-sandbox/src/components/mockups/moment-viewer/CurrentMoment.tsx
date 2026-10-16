import { useState } from "react";
import { Download, Heart, Send, Volume2, X } from "lucide-react";
import "./_group.css";

const progress = [100, 56, 0];

export function CurrentMoment() {
  const [liked, setLiked] = useState(false);

  return (
    <main className="moment-mockup relative h-screen min-h-[700px] w-full overflow-hidden bg-black text-white">
      <img
        src="/__mockup/images/moment-scene-preview.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/[0.08]" />
      <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center justify-between px-5 text-[11px] font-semibold text-white drop-shadow">
        <span>3:33</span>
        <span>◖◖　● 95%</span>
      </div>

      {/* Extracted progress positioning from the Moment route. */}
      <div className="pointer-events-none absolute left-2 right-2 top-[28px] z-20 flex gap-1">
        {progress.map((value, index) => (
          <div key={index} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
          </div>
        ))}
      </div>

      {/* Current header uses the same top inset as the progress bars. */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pb-5 pt-7">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/50 bg-neutral-800">
            <img
              src="/__mockup/images/moment-scene-preview.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold text-white drop-shadow-md">Chiarg</span>
            <span className="shrink-0 text-[11px] font-medium text-white/70">5h</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Mute" className="rounded-full border border-white/25 bg-white/10 p-2.5">
            <Volume2 className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Close" className="rounded-full border border-white/25 bg-white/10 p-2.5">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Current footer controls retain their original, uneven intrinsic heights. */}
      <footer className="absolute inset-x-3 bottom-0 z-30 flex items-center gap-2 bg-gradient-to-t from-black/80 via-black/45 to-transparent pb-4 pt-3">
        <form className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-fuchsia-100/30 bg-gradient-to-r from-white/[0.16] via-violet-200/[0.12] to-fuchsia-200/[0.16] px-3 py-1.5 shadow-[0_10px_30px_rgba(8,5,25,0.38)] ring-1 ring-white/10 backdrop-blur-2xl">
          <input
            readOnly
            value=""
            placeholder="Send a reply..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
          />
          <button type="button" aria-label="Send reply" className="shrink-0 text-white">
            <Send className="h-4 w-4" />
          </button>
        </form>
        <button
          type="button"
          aria-label="Like moment"
          aria-pressed={liked}
          onClick={() => setLiked((current) => !current)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-2.5 text-white shadow-lg shadow-black/10 backdrop-blur-xl"
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
          <span className="min-w-3 text-xs font-semibold tabular-nums">0</span>
        </button>
        <button type="button" aria-label="Download" className="rounded-full border border-white/25 bg-white/10 p-2.5 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
          <Download className="h-5 w-5" />
        </button>
      </footer>
    </main>
  );
}
