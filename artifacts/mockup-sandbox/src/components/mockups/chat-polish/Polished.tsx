import "./_group.css";
import { Check, ChevronRight, Phone, Play, Video } from "lucide-react";

const themes = [
  { name: "Sunset Rose", colors: "from-pink-500 via-fuchsia-500 to-violet-400" },
  { name: "Ocean Breeze", colors: "from-cyan-400 via-sky-500 to-blue-700" },
  { name: "Midnight Amethyst", colors: "from-violet-950 via-purple-800 to-fuchsia-400" },
];

export function Polished() {
  return (
    <main className="min-h-screen bg-[#07080d] text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
      <div className="relative mx-auto flex min-h-screen max-w-[402px] flex-col overflow-hidden border-x border-white/5 bg-[#090b12]">
        <div className="flex h-11 items-center justify-between px-6 text-[11px] font-semibold text-white/80">
          <span>9:41</span><span>••• ▰</span>
        </div>
        <header className="relative z-10 flex h-[66px] items-center gap-3 border-b border-white/5 bg-[#090b12]/90 px-4 backdrop-blur-xl">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-700 text-sm font-bold">A</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Aarav Mehta</p>
            <p className="mt-0.5 text-[10px] text-white/45">Active now</p>
          </div>
          <span className="text-xl text-white/70">☎</span>
          <span className="grid h-9 w-8 place-items-center rounded-lg bg-white/5 text-xl text-white">⋮</span>
        </header>

        <section className="relative flex-1 space-y-4 overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(30,40,65,0.28),transparent_60%)] p-4">
          <div className="absolute right-3 top-2 z-10 w-[204px] rounded-2xl border border-white/10 bg-[#151824]/95 p-2.5 shadow-2xl backdrop-blur-xl">
            <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/45">Chat theme</p>
            <div className="space-y-1">
              {themes.map((theme, index) => (
                <div key={theme.name} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${index === 1 ? "bg-white/[0.08]" : ""}`}>
                  <span className={`h-5 w-8 rounded-full bg-gradient-to-r ${theme.colors}`} />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-white/85">{theme.name}</span>
                  {index === 1 && <Check size={13} className="text-cyan-200" />}
                </div>
              ))}
            </div>
          </div>

          <p className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.045] px-3 py-1.5 text-[10px] font-medium text-white/65 shadow-sm">
            <Video size={13} className="text-white/50" />
            <span>Missed video call</span>
            <span className="text-white/30">·</span>
            <time className="text-white/40">3m ago</time>
          </p>
          <p className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.045] px-3 py-1.5 text-[10px] font-medium text-white/65 shadow-sm">
            <Phone size={13} className="text-white/50" />
            <span>Missed audio call</span>
            <span className="text-white/30">·</span>
            <time className="text-white/40">1h ago</time>
          </p>

          <div className="flex justify-end">
            <div className="max-w-[84%] rounded-2xl rounded-br-sm bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-lg shadow-blue-950/30">
              That sunset was unreal!
              <button type="button" className="group mt-2 flex w-full items-center gap-2.5 rounded-xl border border-white/15 bg-black/15 p-1.5 text-left transition hover:bg-black/20">
                <img
                  src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=160&q=80"
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white/90">Replied to photo Moment</span>
                <ChevronRight size={16} className="shrink-0 text-white/55 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[84%] rounded-2xl rounded-br-sm bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 p-2.5 shadow-lg shadow-blue-950/30">
              <p className="px-1 pb-1 text-sm font-medium text-white">Shared a video</p>
              <button type="button" className="group relative block aspect-video w-[256px] max-w-full overflow-hidden rounded-xl bg-slate-950 text-left">
                <img
                  src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-white/35 bg-white/20 text-white shadow-xl backdrop-blur-xl transition group-hover:scale-105">
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </span>
                </span>
                <span className="absolute inset-x-3 bottom-2.5 truncate text-xs font-semibold text-white drop-shadow-lg">
                  Night Drive Through the City
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[78%] rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.065] px-3.5 py-2.5 text-sm text-white/90">
              See you this weekend!
            </div>
          </div>
        </section>

        <footer className="flex h-[66px] items-center gap-3 border-t border-white/5 bg-[#090b12]/90 px-4">
          <span className="text-xl text-white/60">＋</span>
          <div className="h-10 flex-1 rounded-full border border-white/10 bg-white/5" />
          <span className="text-xl text-white/60">⌁</span>
        </footer>
      </div>
    </main>
  );
}