import { useEffect, useRef, useState } from "react";
import { Heart, Send, SwitchCamera, Users, X } from "lucide-react";
import { ProfileAvatar } from "./ProfileAvatar";

export type LiveStreamHudMode = "broadcaster" | "viewer";

export type LiveStreamComment = {
  id: string;
  username: string;
  avatarUrl: string | null;
  message: string;
};

export type LiveStreamReaction = {
  id: string;
};

export type LiveStreamHudProps = {
  mode: LiveStreamHudMode;
  stream: MediaStream | null;
  title: string;
  durationSeconds: number;
  viewerCount: number;
  isFrontCamera: boolean;
  comments: LiveStreamComment[];
  commentText: string;
  reactions: LiveStreamReaction[];
  onCommentTextChange: (value: string) => void;
  onSendComment: () => void;
  onFlipCamera: () => void;
  onEnd: () => void;
  onReact: () => void;
};

type FloatingHeart = {
  id: string;
  lane: 0 | 1 | 2;
};

function formatDuration(durationSeconds: number) {
  const safeDuration = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(safeDuration / 3600);
  const minutes = Math.floor((safeDuration % 3600) / 60);
  const seconds = safeDuration % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatViewerCount(viewerCount: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    Math.max(0, viewerCount),
  );
}

export function LiveStreamHud({
  mode,
  stream,
  title,
  durationSeconds,
  viewerCount,
  isFrontCamera,
  comments,
  commentText,
  reactions,
  onCommentTextChange,
  onSendComment,
  onFlipCamera,
  onEnd,
  onReact,
}: LiveStreamHudProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const seenReactionIds = useRef(new Set<string>());
  const hasPrimedReactions = useRef(false);
  const heartSequence = useRef(0);
  const heartTimeouts = useRef<number[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const latestCommentId = comments[comments.length - 1]?.id;
  const isBroadcaster = mode === "broadcaster";
  const mirrorPreview = isBroadcaster && isFrontCamera;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    if (stream) {
      void video.play().catch(() => {});
    }

    return () => {
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    const commentsElement = commentsRef.current;
    if (!commentsElement) return;

    commentsElement.scrollTo({
      top: commentsElement.scrollHeight,
      behavior: "smooth",
    });
  }, [comments.length, latestCommentId]);

  useEffect(() => {
    const reactionIds = new Set(reactions.map((reaction) => reaction.id));

    if (!hasPrimedReactions.current) {
      hasPrimedReactions.current = true;
      seenReactionIds.current = reactionIds;
      return;
    }

    const incomingReactions = reactions.filter(
      (reaction) => !seenReactionIds.current.has(reaction.id),
    );
    seenReactionIds.current = reactionIds;

    if (incomingReactions.length === 0) return;

    const nextHearts = incomingReactions.map(() => {
      const sequence = heartSequence.current++;
      return {
        id: `heart-${sequence}`,
        lane: (sequence % 3) as FloatingHeart["lane"],
      };
    });

    setFloatingHearts((currentHearts) => [...currentHearts, ...nextHearts].slice(-8));

    nextHearts.forEach((heart) => {
      let timeoutId = 0;
      timeoutId = window.setTimeout(() => {
        setFloatingHearts((currentHearts) =>
          currentHearts.filter((currentHeart) => currentHeart.id !== heart.id),
        );
        heartTimeouts.current = heartTimeouts.current.filter((id) => id !== timeoutId);
      }, 2400);
      heartTimeouts.current.push(timeoutId);
    });
  }, [reactions]);

  useEffect(
    () => () => {
      heartTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    },
    [],
  );

  return (
    <section
      className="fixed inset-0 z-[70] isolate h-[100dvh] w-full overflow-hidden bg-[#120d12] text-white"
      aria-label={isBroadcaster ? "Live broadcast preview" : "Live broadcast"}
    >
      <style>{`
        @keyframes yw-live-heart-rise {
          0% {
            opacity: 0;
            transform: translate3d(0, 16px, 0) scale(0.62) rotate(-7deg);
          }
          14% {
            opacity: 1;
          }
          72% {
            opacity: 0.88;
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -188px, 0) scale(1.12) rotate(8deg);
          }
        }

        .yw-live-heart {
          animation: yw-live-heart-rise 2.3s cubic-bezier(0.2, 0.72, 0.28, 1) forwards;
          will-change: transform, opacity;
        }

        .yw-live-heart--left {
          left: 12%;
        }

        .yw-live-heart--center {
          left: 34%;
        }

        .yw-live-heart--right {
          left: 55%;
        }

        @media (prefers-reduced-motion: reduce) {
          .yw-live-heart {
            animation-duration: 0.01ms;
          }
        }
      `}</style>

      <video
        ref={videoRef}
        autoPlay
        muted={isBroadcaster}
        playsInline
        data-testid="video-live-stream"
        aria-label={isBroadcaster ? "Your live camera preview" : "Live video"}
        className="absolute inset-0 h-full w-full bg-[#120d12] object-cover"
        style={{ transform: mirrorPreview ? "scaleX(-1)" : undefined }}
      />

      {!stream && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[#120d12]/90 px-8 text-center"
          data-testid="status-live-stream-unavailable"
        >
          <div className="max-w-xs">
            <span className="mx-auto mb-4 block h-2.5 w-2.5 rounded-full bg-[#ff335f]" />
            <p className="text-sm font-semibold tracking-tight text-white/90">
              {isBroadcaster ? "Waiting for your camera" : "Waiting for the live video"}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/55">
              {isBroadcaster
                ? "Your camera preview will appear here when the stream is ready."
                : "The broadcaster is connecting. Stay close, the live room will update shortly."}
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,5,9,0.72),transparent_26%,transparent_52%,rgba(8,5,9,0.88))]" />

      <header className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-[#f12e50] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-white shadow-[0_5px_22px_rgba(241,46,80,0.28)]"
              data-testid="status-live"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              Live
            </span>
            <span
              className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 font-mono text-[11px] font-bold tabular-nums text-white backdrop-blur-xl"
              data-testid="text-live-duration"
              aria-label={`Live for ${formatDuration(durationSeconds)}`}
            >
              {formatDuration(durationSeconds)}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-xl"
              data-testid="text-live-viewer-count"
              aria-label={`${viewerCount} viewers`}
            >
              <Users className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
              {formatViewerCount(viewerCount)}
            </span>
          </div>
          <p
            className="mt-3 max-w-[min(70vw,28rem)] truncate text-sm font-semibold tracking-[-0.01em] text-white/90"
            data-testid="text-live-title"
          >
            {title || "YourWorld live"}
          </p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
            {isBroadcaster ? "Broadcasting now" : "Live now"}
          </p>
        </div>

        {isBroadcaster && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onFlipCamera}
              data-testid="button-live-flip-camera"
              aria-label={isFrontCamera ? "Switch to rear camera" : "Switch to front camera"}
              title={isFrontCamera ? "Switch to rear camera" : "Switch to front camera"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white shadow-lg backdrop-blur-xl transition-transform hover:bg-black/70 active:scale-95"
            >
              <SwitchCamera className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onEnd}
              data-testid="button-live-end"
              aria-label="End live broadcast"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f12e50] px-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-lg shadow-[#f12e50]/20 transition-transform hover:bg-[#ff4363] active:scale-95"
            >
              <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              End
            </button>
          </div>
        )}
      </header>

      <div className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] left-0 right-0 flex justify-end px-4 sm:px-6">
        <div className="relative h-52 w-full max-w-sm">
          {floatingHearts.map((heart) => (
            <Heart
              key={heart.id}
              className={`yw-live-heart absolute bottom-0 h-7 w-7 fill-[#ff4d73] text-[#ff4d73] drop-shadow-[0_5px_12px_rgba(255,55,100,0.46)] ${
                heart.lane === 0
                  ? "yw-live-heart--left"
                  : heart.lane === 1
                    ? "yw-live-heart--center"
                    : "yw-live-heart--right"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div
        ref={commentsRef}
        className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+4.9rem)] left-0 z-10 flex max-h-[38dvh] w-[min(88vw,27rem)] flex-col gap-2 overflow-y-auto overscroll-contain px-4 pb-2 pt-8 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
        aria-live="polite"
        data-testid="list-live-comments"
      >
        {comments.length === 0 ? (
          <p className="w-fit max-w-[15rem] rounded-2xl border border-white/10 bg-black/35 px-3.5 py-2.5 text-xs leading-5 text-white/60 backdrop-blur-xl">
            The live chat is open. Say hello.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex w-fit max-w-full items-end gap-2.5 rounded-2xl border border-white/10 bg-black/45 py-2 pl-2 pr-3 backdrop-blur-xl"
              data-testid={`comment-live-${comment.id}`}
            >
              <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#3b2030] ring-1 ring-white/15">
                <ProfileAvatar
                  user={{ username: comment.username, avatar_url: comment.avatarUrl }}
                />
              </span>
              <p className="min-w-0 text-[12px] leading-[1.35] text-white/90">
                <span
                  className="mr-1 font-bold text-white"
                  data-testid={`text-live-comment-username-${comment.id}`}
                >
                  {comment.username}
                </span>
                <span data-testid={`text-live-comment-message-${comment.id}`}>
                  {comment.message}
                </span>
              </p>
            </div>
          ))
        )}
      </div>

      <form
        className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (commentText.trim()) onSendComment();
        }}
      >
        <label className="sr-only" htmlFor="live-comment-input">
          Write a comment
        </label>
        <input
          id="live-comment-input"
          type="text"
          value={commentText}
          onChange={(event) => onCommentTextChange(event.currentTarget.value)}
          placeholder="Add a comment"
          autoComplete="off"
          maxLength={500}
          data-testid="input-live-comment"
          className="h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-black/55 px-4 text-sm text-white outline-none backdrop-blur-xl transition-colors placeholder:text-white/48 focus:border-white/35 focus:bg-black/70"
        />
        <button
          type="submit"
          onClick={() => {
            if (!commentText.trim()) return;
          }}
          disabled={!commentText.trim()}
          data-testid="button-live-send-comment"
          aria-label="Send comment"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/12 text-white backdrop-blur-xl transition-transform hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Send className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onReact}
          data-testid="button-live-react"
          aria-label="Send a heart reaction"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ff5578]/35 bg-[#ff5578]/15 text-[#ff7793] backdrop-blur-xl transition-transform hover:bg-[#ff5578]/25 active:scale-95"
        >
          <Heart className="h-[19px] w-[19px] fill-current" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}