import { useCallback, useEffect, useRef, useState } from "react";

function formatVideoDuration(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ChatVideoBubbleThumbnail({
  src,
  mimeType,
}: {
  src: string;
  mimeType?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [poster, setPoster] = useState<string>();
  const [duration, setDuration] = useState(0);

  const captureFirstFrame = useCallback(() => {
    const video = videoRef.current;
    if (
      !video ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.videoWidth <= 0 ||
      video.videoHeight <= 0
    ) {
      return;
    }

    const scale = Math.min(1, 960 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPoster(canvas.toDataURL("image/jpeg", 0.78));
    } catch {
      // Cross-origin storage may block canvas export; the paused video frame remains visible.
    }
  }, []);

  useEffect(() => {
    setPoster(undefined);
    setDuration(0);
    videoRef.current?.load();
  }, [mimeType, src]);

  return (
    <span className="relative block aspect-video w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        controls={false}
        aria-hidden="true"
        poster={poster}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          const nextDuration = video.duration;
          if (Number.isFinite(nextDuration)) setDuration(nextDuration);
          if (Number.isFinite(nextDuration) && nextDuration > 0 && video.currentTime === 0) {
            try {
              video.currentTime = Math.min(0.05, nextDuration / 2);
            } catch {
              // Keep the metadata-loaded video visible if seeking is unavailable.
            }
          }
        }}
        onLoadedData={captureFirstFrame}
        onSeeked={captureFirstFrame}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={src} type={mimeType || "video/mp4"} />
      </video>
      {duration > 0 ? (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] leading-4 text-white shadow">
          {formatVideoDuration(duration)}
        </span>
      ) : null}
    </span>
  );
}
