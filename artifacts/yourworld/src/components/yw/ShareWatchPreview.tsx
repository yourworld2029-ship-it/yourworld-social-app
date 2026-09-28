import { useEffect, useId, useState } from "react";
import { Download, Heart, MessageCircle, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShareWatchPreviewProps = {
  /** A browser-playable video URL, supplied by the public share route. */
  mediaUrl: string;
  title: string;
  creatorName: string;
  description?: string | null;
  apkUrl: string;
  creatorHandle?: string | null;
  posterUrl?: string | null;
  className?: string;
};

const INTERACTION_PROMPT = "Download the YourWorld app to interact with creators";

/**
 * Public, read-only watch surface for people arriving from a shared link.
 * The interaction controls intentionally never mutate social state: they
 * explain the app handoff instead.
 */
export function ShareWatchPreview({
  mediaUrl,
  title,
  creatorName,
  description,
  apkUrl,
  creatorHandle,
  posterUrl,
  className,
}: ShareWatchPreviewProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!promptOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPromptOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [promptOpen]);

  const openInteractionPrompt = () => setPromptOpen(true);

  return (
    <>
      <article
        className={cn(
          "w-full overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0b0c10] text-zinc-100 shadow-[0_24px_80px_rgba(0,0,0,0.38)]",
          className,
        )}
        data-testid="card-share-watch-preview"
      >
        <div className="relative bg-[#050608]">
          <video
            className="block max-h-[78svh] min-h-[13rem] w-full object-contain sm:max-h-[82svh]"
            src={mediaUrl}
            poster={posterUrl ?? undefined}
            controls
            playsInline
            preload="none"
            aria-label={`Watch ${title}`}
            data-testid="video-share-watch"
          />
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/75">
                Shared from YourWorld
              </p>
              <h1
                className="text-balance text-xl font-bold leading-tight tracking-[-0.025em] text-zinc-50 sm:text-2xl"
                data-testid="text-share-watch-title"
              >
                {title}
              </h1>
              <p className="truncate text-sm text-zinc-400" data-testid="text-share-watch-creator">
                {creatorName}
                {creatorHandle ? <span className="text-zinc-600"> · @{creatorHandle.replace(/^@/, "")}</span> : null}
              </p>
            </div>

            <a
              href={apkUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-300 px-3.5 py-2.5 text-xs font-bold text-[#1b0b20] shadow-[0_8px_24px_rgba(232,121,249,0.16)] transition-transform hover:bg-fuchsia-200 active:scale-[0.97]"
              data-testid="link-share-apk-download"
            >
              <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
              <span className="hidden sm:inline">Get the app</span>
              <span className="sm:hidden">APK</span>
            </a>
          </div>

          {description ? (
            <p
              className="max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-300"
              data-testid="text-share-watch-description"
            >
              {description}
            </p>
          ) : null}

          <div className="flex items-center gap-2 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={openInteractionPrompt}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.055] px-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.1] active:scale-[0.98]"
              data-testid="button-share-like"
            >
              <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Like</span>
            </button>
            <button
              type="button"
              onClick={openInteractionPrompt}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.055] px-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.1] active:scale-[0.98]"
              data-testid="button-share-comment"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Comment</span>
            </button>
            <button
              type="button"
              onClick={openInteractionPrompt}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#101116] transition-colors hover:bg-zinc-200 active:scale-[0.98]"
              data-testid="button-share-follow"
            >
              <UserPlus className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Follow</span>
            </button>
          </div>
        </div>
      </article>

      {promptOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#020204]/80 p-3 backdrop-blur-sm sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPromptOpen(false);
          }}
          data-testid="overlay-share-interaction-prompt"
        >
          <section
            aria-labelledby={dialogTitleId}
            aria-modal="true"
            className="relative w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-white/[0.1] bg-[#111218] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            role="dialog"
            data-testid="dialog-share-interaction-prompt"
          >
            <button
              type="button"
              aria-label="Close prompt"
              onClick={() => setPromptOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.08] hover:text-zinc-200"
              data-testid="button-close-share-prompt"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-fuchsia-300/15 text-fuchsia-200">
              <Download className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 id={dialogTitleId} className="pr-6 text-lg font-bold tracking-[-0.02em] text-zinc-50">
              {INTERACTION_PROMPT}
            </h2>
            <p className="mt-2 text-sm leading-5 text-zinc-400">
              Join the conversation, save favorites, and keep your feed close.
            </p>
            <a
              href={apkUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-300 px-4 text-sm font-bold text-[#1b0b20] transition-colors hover:bg-fuchsia-200 active:scale-[0.98]"
              data-testid="link-prompt-apk-download"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download the Android app
            </a>
          </section>
        </div>
      ) : null}
    </>
  );
}
