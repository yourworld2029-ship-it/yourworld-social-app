import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

export function IntroductionVideoPreview({
  src,
  onValidityChange,
  testId,
}: {
  src: string;
  onValidityChange: (valid: boolean) => void;
  testId?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onValidityChangeRef = useRef(onValidityChange);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationUnavailable, setDurationUnavailable] = useState(false);

  onValidityChangeRef.current = onValidityChange;

  useEffect(() => {
    setDuration(null);
    setCurrentTime(0);
    setDurationUnavailable(false);
    onValidityChangeRef.current(false);
    if (!src) return;

    let active = true;
    let finished = false;
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.muted = true;
    probe.playsInline = true;

    const applyMetadata = () => {
      if (!active || finished) return;
      finished = true;
      const seconds = probe.duration;
      const isValid =
        Number.isFinite(seconds) &&
        seconds >= 5 &&
        seconds <= 50 &&
        probe.videoHeight > probe.videoWidth;
      setDuration(Number.isFinite(seconds) ? seconds : null);
      setDurationUnavailable(!Number.isFinite(seconds));
      onValidityChangeRef.current(isValid);
    };
    const failMetadata = () => {
      if (!active || finished) return;
      finished = true;
      setDurationUnavailable(true);
      onValidityChangeRef.current(false);
    };
    const timeout = window.setTimeout(failMetadata, 15000);
    probe.addEventListener("loadedmetadata", applyMetadata);
    probe.addEventListener("error", failMetadata);
    probe.src = src;
    probe.load();

    return () => {
      active = false;
      window.clearTimeout(timeout);
      probe.removeEventListener("loadedmetadata", applyMetadata);
      probe.removeEventListener("error", failMetadata);
      probe.pause();
      probe.removeAttribute("src");
      probe.load();
    };
  }, [src]);

  const updateValidity = () => {
    const video = videoRef.current;
    const seconds = video?.duration ?? NaN;
    const isValid =
      Number.isFinite(seconds) &&
      seconds >= 5 &&
      seconds <= 50 &&
      Boolean(video && video.videoHeight > video.videoWidth);
    setDuration(Number.isFinite(seconds) ? seconds : null);
    setDurationUnavailable(!Number.isFinite(seconds));
    onValidityChangeRef.current(isValid);
  };

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        data-testid={testId}
        src={src}
        controls
        playsInline
        preload="metadata"
        onLoadedMetadata={updateValidity}
        onDurationChange={updateValidity}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onError={() => onValidityChangeRef.current(false)}
        className="aspect-[9/16] max-h-80 w-full rounded-2xl border border-white/10 bg-black object-contain"
        aria-label="Introduction video preview"
      />
      <p className="text-xs text-zinc-400" aria-live="polite">
        {duration === null
          ? durationUnavailable
            ? "Could not read video duration. Select another video."
            : "Loading video duration…"
          : `${formatTime(currentTime)} / ${formatTime(duration)} • ${
              duration >= 5 && duration <= 50 ? "Ready to submit" : "Invalid duration"
            }`}
      </p>
    </div>
  );
}
