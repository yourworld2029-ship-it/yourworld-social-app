import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type ChatVideoPlayerProps = {
  src: string;
  mimeType?: string;
  label: string;
  className?: string;
  autoPlay?: boolean;
  preload?: "none" | "metadata" | "auto";
  showLargePlayButton?: boolean;
  onEnded?: () => void;
  onError?: () => void;
};

function formatVideoTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ChatVideoPlayer({
  src,
  mimeType,
  label,
  className = "",
  autoPlay = false,
  preload = "metadata",
  showLargePlayButton = true,
  onEnded,
  onError,
}: ChatVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoadFailed(false);
    if (!video) return;
    video.load();
    if (!autoPlay) return;

    let active = true;
    void video.play().then(
      () => {
        if (active) setPlaying(true);
      },
      () => {
        if (active) setPlaying(false);
      },
    );
    return () => {
      active = false;
    };
  }, [autoPlay, mimeType, src]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, []);

  const seek = (value: string) => {
    const nextTime = Number(value);
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextTime)) return;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div
      className={`relative flex h-full min-h-[180px] w-full items-center justify-center overflow-hidden bg-black ${className}`}
    >
      <video
        ref={videoRef}
        aria-label={label}
        autoPlay={autoPlay}
        playsInline
        preload={preload}
        controls={false}
        onClick={togglePlayback}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={onEnded}
        onError={() => {
          setLoadFailed(true);
          onError?.();
        }}
        className="h-full w-full object-contain"
      >
        <source src={src} type={mimeType || undefined} />
      </video>

      {showLargePlayButton && !playing && !loadFailed ? (
        <button
          type="button"
          aria-label={`Play ${label.toLowerCase()}`}
          onClick={togglePlayback}
          className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/55 text-white shadow-lg"
        >
          <Play size={23} className="ml-0.5 fill-current" />
        </button>
      ) : null}

      {loadFailed ? (
        <div
          role="status"
          className="absolute inset-0 grid place-items-center bg-black px-6 text-center text-sm text-white/75"
        >
          Video could not be loaded.
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-7">
        <button
          type="button"
          aria-label={playing ? "Pause video" : "Play video"}
          onClick={togglePlayback}
          disabled={loadFailed}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white disabled:opacity-40"
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5 fill-current" />}
        </button>
        <span className="min-w-[2.4rem] text-center font-mono text-[10px] text-white/90">
          {formatVideoTime(currentTime)}
        </span>
        <input
          type="range"
          aria-label="Seek video"
          min={0}
          max={Math.max(duration, 0.1)}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          disabled={loadFailed || duration <= 0}
          onChange={(event) => seek(event.currentTarget.value)}
          className="h-1 min-w-0 flex-1 cursor-pointer accent-white disabled:cursor-default"
        />
        <span className="min-w-[2.4rem] text-center font-mono text-[10px] text-white/90">
          {formatVideoTime(duration)}
        </span>
      </div>
    </div>
  );
}
