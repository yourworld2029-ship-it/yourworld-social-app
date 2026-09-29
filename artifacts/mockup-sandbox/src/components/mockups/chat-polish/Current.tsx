import "./_group.css";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";

type PreviewMoment = {
  available: boolean;
  mediaUrl: string | null;
  kind?: "photo" | "video";
};

function MomentReplyCard({ preview }: { preview: PreviewMoment }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const canOpen = preview.available && Boolean(preview.mediaUrl) && failedUrl !== preview.mediaUrl;

  return (
    <button
      type="button"
      className={`group mb-2 flex w-full items-center gap-2 rounded-xl border border-white/15 bg-black/20 p-2 text-left ${
        canOpen ? "transition hover:border-white/35 hover:bg-black/30" : "cursor-default opacity-80"
      }`}
    >
      <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-zinc-900 text-[9px] text-zinc-400 ring-1 ring-white/15">
        {canOpen && preview.mediaUrl ? (
          preview.kind === "video" ? (
            <video
              src={preview.mediaUrl}
              muted
              playsInline
              preload="none"
              onError={() => setFailedUrl(preview.mediaUrl)}
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={preview.mediaUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailedUrl(preview.mediaUrl)}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <span>Unavailable</span>
        )}
        {canOpen && <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
          Replying to Moment
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-white/90">
          {canOpen ? "Tap to view" : "Moment unavailable"}
        </span>
      </span>
      {canOpen && <span className="text-lg leading-none text-white/60">›</span>}
    </button>
  );
}

function SharedMediaMessageCard() {
  const [poster, setPoster] = useState<string | null>(null);
  useEffect(() => {
    setPoster("https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85");
  }, []);

  return (
    <button
      type="button"
      className="group mt-2.5 block w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#090a0e] text-left shadow-lg"
    >
      <span className="relative block aspect-video w-full overflow-hidden bg-zinc-950">
        {poster ? (
          <img src={poster} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-violet-950/70 via-zinc-950 to-fuchsia-950/40">
            <Play className="h-8 w-8 fill-white/20 text-white/75" />
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-white/15 text-white shadow-xl backdrop-blur-md">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </span>
      </span>
      <span className="block p-3">
        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-fuchsia-200/75">
          Video · Tap to play
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-white/95">
          Night Drive Through the City
        </span>
      </span>
    </button>
  );
}

export function Current() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
      <div className="mx-auto flex min-h-screen max-w-[402px] flex-col border-x border-white/5 bg-[#090a0f]">
        <div className="flex h-11 items-center justify-between px-6 text-[11px] font-semibold text-white/80">
          <span>9:41</span><span>••• ▰</span>
        </div>
        <header className="flex h-[66px] items-center gap-3 border-b border-white/5 px-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-700 text-sm font-bold">A</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Aarav Mehta</p>
            <p className="mt-0.5 text-[10px] text-white/45">Active now</p>
          </div>
          <span className="text-xl text-white/70">☎</span>
          <span className="text-xl text-white/70">⋮</span>
        </header>

        <section className="flex-1 space-y-4 overflow-hidden bg-zinc-950/50 p-4">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-zinc-800/70 px-3 py-1 text-center text-[11px] text-zinc-400">
            Missed Video Call <time className="text-[10px] text-zinc-500">3m ago</time>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[78%] rounded-2xl rounded-bl-sm border border-zinc-700/50 bg-zinc-800/90 px-4 py-2.5 text-sm leading-relaxed text-zinc-100">
              Missed Call
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm leading-relaxed text-white">
              That sunset was unreal!
              <MomentReplyCard preview={{ available: true, mediaUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=240&q=80", kind: "photo" }} />
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm leading-relaxed text-white">
              <p>Shared a video: Night Drive Through the City</p>
              <SharedMediaMessageCard />
            </div>
          </div>
        </section>

        <footer className="flex h-[66px] items-center gap-3 border-t border-white/5 px-4">
          <span className="text-xl text-white/60">＋</span>
          <div className="h-10 flex-1 rounded-full border border-white/10 bg-white/5" />
          <span className="text-xl text-white/60">⌁</span>
        </footer>
      </div>
    </main>
  );
}