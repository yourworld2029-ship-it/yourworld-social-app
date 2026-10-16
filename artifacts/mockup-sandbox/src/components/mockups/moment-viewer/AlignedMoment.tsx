import { useState } from "react";
import { Download, Heart, Send, Volume2, X } from "lucide-react";
import "./_group.css";

const progress = [100, 56, 0];

export function AlignedMoment() {
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

      <div className="pointer-events-none absolute left-2 right-2 top-[28px] z-20 flex gap-1">
        {progress.map((value, index) => (
          <div key={index} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
          </div>
        ))}
      </div>

      {/* Header clears the progress row and uses a gentle entrance motion. */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pb-5 pt-[calc(max(env(safe-area-inset-top,0px),28px)+14px)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/55 bg-neutral-800 shadow-[0_2px_14px_rgba(0,0,0,0.28)]">
            <img
              src="/__mockup/images/moment-scene-preview.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold text-white drop-shadow-md">Chiarg</span>
            <span className="shrink-0 text-[11px] font-medium text-white/75">5h</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Mute" className="rounded-full border border-white/25 bg-black/25 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-transform duration-200 ease-out active:scale-[0.96]">
            <Volume2 className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Close" className="rounded-full border border-white/25 bg-black/25 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-transform duration-200 ease-out active:scale-[0.96]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Matching 48px controls keep the bottom row level and easy to tap. */}
      <footer className="absolute inset-x-3 bottom-0 z-30 flex items-center gap-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent pb-[max(env(safe-area-inset-bottom,0px),16px)] pt-3">
        <form className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-black/45 via-violet-950/35 to-fuchsia-950/40 px-3 shadow-[0_8px_24px_rgba(8,5,25,0.38)] ring-1 ring-white/[0.06] backdrop-blur-2xl transition-[border-color,box-shadow] duration-200 focus-within:border-fuchsia-100/55 focus-within:ring-fuchsia-200/20">
          <input
            readOnly
            value=""
            placeholder="Send a reply..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/55 focus:outline-none"
          />
          <button type="button" aria-label="Send reply" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/10">
            <Send className="h-4 w-4" />
          </button>
        </form>
        <button
          type="button"
          aria-label="Like moment"
          aria-pressed={liked}
          onClick={() => setLiked((current) => !current)}
          className="flex h-12 min-w-[72px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-gradient-to-b from-white/[0.16] to-white/[0.09] px-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-[transform,border-color,background-color] duration-200 ease-out active:scale-[0.96]"
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
          <span className="min-w-3 text-xs font-semibold tabular-nums">0</span>
        </button>
        <button
          type="button"
          aria-label="Download"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/25 bg-gradient-to-b from-white/[0.16] to-white/[0.09] text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-[transform,border-color,background-color] duration-200 ease-out active:scale-[0.96]"
        >
          <Download className="h-5 w-5" />
        </button>
      </footer>
    </main>
  );
}
