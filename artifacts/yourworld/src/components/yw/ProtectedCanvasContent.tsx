import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];

  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || context.measureText(candidate).width <= maxWidth) {
        if (context.measureText(candidate).width <= maxWidth) {
          line = candidate;
          continue;
        }
      } else {
        lines.push(line);
        line = "";
      }

      if (!line && context.measureText(word).width > maxWidth) {
        let fragment = "";
        for (const character of word) {
          if (fragment && context.measureText(fragment + character).width > maxWidth) {
            lines.push(fragment);
            fragment = character;
          } else {
            fragment += character;
          }
        }
        line = fragment;
      } else if (!line) {
        line = word;
      }
    }
    lines.push(line);
  }

  return lines.length ? lines : [""];
}

/** Draws message text into a non-selectable canvas while keeping an accessible label. */
export function ProtectedCanvasText({
  text,
  maxLines,
}: {
  text: string;
  maxLines?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bubble = canvas?.parentElement;
    if (!canvas || !bubble) return;

    const render = () => {
      if (!canvas.isConnected) return;
      const context = canvas.getContext("2d");
      if (!context) return;

      const bubbleStyle = window.getComputedStyle(bubble);
      const containingWidth = bubble.parentElement?.clientWidth || window.innerWidth;
      const paddingX =
        (Number.parseFloat(bubbleStyle.paddingLeft) || 0) +
        (Number.parseFloat(bubbleStyle.paddingRight) || 0);
      const declaredMaxWidth = Number.parseFloat(bubbleStyle.maxWidth);
      const maxWidth = Math.max(
        64,
        Math.min(
          440,
          (Number.isFinite(declaredMaxWidth) && declaredMaxWidth > 0
            ? declaredMaxWidth
            : containingWidth * 0.78) - paddingX,
        ),
      );

      context.font = `${bubbleStyle.fontWeight} ${bubbleStyle.fontSize} ${bubbleStyle.fontFamily}`;
      const lineHeight =
        Number.parseFloat(bubbleStyle.lineHeight) ||
        (Number.parseFloat(bubbleStyle.fontSize) || 14) * 1.5;
      let lines = wrapText(context, text, maxWidth);
      if (maxLines && lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        let lastLine = lines[maxLines - 1] ?? "";
        while (
          lastLine &&
          context.measureText(`${lastLine}…`).width > maxWidth
        ) {
          lastLine = lastLine.slice(0, -1);
        }
        lines[maxLines - 1] = `${lastLine.trimEnd()}…`;
      }
      const contentWidth = Math.max(
        1,
        Math.min(maxWidth, Math.max(...lines.map((line) => context.measureText(line).width))),
      );
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const contentHeight = Math.max(lineHeight, lines.length * lineHeight);

      canvas.style.width = `${Math.ceil(contentWidth)}px`;
      canvas.style.height = `${Math.ceil(contentHeight)}px`;
      canvas.width = Math.ceil(contentWidth * pixelRatio);
      canvas.height = Math.ceil(contentHeight * pixelRatio);

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.font = `${bubbleStyle.fontWeight} ${bubbleStyle.fontSize} ${bubbleStyle.fontFamily}`;
      context.fillStyle = bubbleStyle.color;
      context.textBaseline = "top";
      context.textAlign = bubbleStyle.textAlign as CanvasTextAlign;
      const textX =
        bubbleStyle.textAlign === "center"
          ? contentWidth / 2
          : bubbleStyle.textAlign === "right" || bubbleStyle.textAlign === "end"
            ? contentWidth
            : 0;
      lines.forEach((line, index) => {
        context.fillText(line, textX, index * lineHeight, maxWidth);
      });
    };

    render();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(render);
    if (bubble.parentElement) observer?.observe(bubble.parentElement);
    window.addEventListener("resize", render);
    void document.fonts?.ready.then(render);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", render);
    };
  }, [maxLines, text]);

  return (
    <canvas
      ref={canvasRef}
      className="yw-protected-canvas"
      role="img"
      aria-label={text}
    />
  );
}

/** Paints a protected photo into a canvas instead of exposing an image element. */
export function ProtectedCanvasImage({
  src,
  alt,
  className = "",
  onLoad,
  onError,
  onCanvasReady,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onError, onLoad]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let active = true;
    const image = new Image();
    image.decoding = "async";
    setFailed(false);
    image.onload = () => {
      if (!active) return;
      const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setFailed(false);
      onLoadRef.current?.();
    };
    image.onerror = () => {
      if (active) {
        setFailed(true);
        onErrorRef.current?.();
      }
    };
    image.src = src;

    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);

  if (failed) {
    return (
      <div
        className={`grid place-items-center bg-black text-xs text-white/70 ${className}`}
        role="img"
        aria-label={`${alt} unavailable`}
      >
        Protected media unavailable
      </div>
    );
  }

  return (
    <canvas
      ref={(canvas) => {
        canvasRef.current = canvas;
        onCanvasReady?.(canvas);
      }}
      className={`yw-protected-canvas ${className}`}
      role="img"
      aria-label={alt}
      style={style}
    />
  );
}

/** Mirrors a playing video onto a canvas without replacing the source player. */
export function ProtectedCanvasVideoMirror({
  videoRef,
  className = "",
  style,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!video || !canvas || !context) return;

    let frame = 0;
    const draw = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const scale = Math.min(
          1,
          1600 / Math.max(video.videoWidth || 1, video.videoHeight || 1),
        );
        const width = Math.max(1, Math.round((video.videoWidth || 320) * scale));
        const height = Math.max(1, Math.round((video.videoHeight || 180) * scale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        context.drawImage(video, 0, 0, width, height);
      }
      if (!video.paused && !video.ended) frame = requestAnimationFrame(draw);
    };
    const drawContinuously = () => {
      cancelAnimationFrame(frame);
      draw();
    };

    video.addEventListener("play", drawContinuously);
    video.addEventListener("loadeddata", drawContinuously);
    video.addEventListener("seeked", drawContinuously);
    video.addEventListener("pause", drawContinuously);
    drawContinuously();

    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("play", drawContinuously);
      video.removeEventListener("loadeddata", drawContinuously);
      video.removeEventListener("seeked", drawContinuously);
      video.removeEventListener("pause", drawContinuously);
    };
  }, [videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`yw-protected-canvas ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/** Displays a video via canvas frames with a small accessible playback control. */
export function ProtectedCanvasVideo({
  src,
  onEnded,
}: {
  src: string;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onEndedRef = useRef(onEnded);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!video || !canvas || !context) return;

    let frame = 0;
    const paint = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const scale = Math.min(
          1,
          1600 / Math.max(video.videoWidth || 1, video.videoHeight || 1),
        );
        const width = Math.max(1, Math.round((video.videoWidth || 320) * scale));
        const height = Math.max(1, Math.round((video.videoHeight || 180) * scale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        context.drawImage(video, 0, 0, width, height);
      }
      if (!video.paused && !video.ended) frame = requestAnimationFrame(paint);
    };
    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(frame);
      paint();
    };
    const onPause = () => setPlaying(false);
    const onMetadata = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      paint();
    };
    const onTime = () => {
      setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    };
    const onVideoEnded = () => {
      setPlaying(false);
      onEndedRef.current?.();
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("loadedmetadata", onMetadata);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onVideoEnded);
    video.src = src;
    video.load();
    void video.play().catch(() => setPlaying(false));

    return () => {
      cancelAnimationFrame(frame);
      video.pause();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onVideoEnded);
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  const seek = (value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(value)) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        className="absolute h-px w-px opacity-0"
        aria-hidden="true"
        playsInline
        preload="auto"
      />
      <canvas
        ref={canvasRef}
        className="yw-protected-canvas h-40 w-full object-contain"
        role="img"
        aria-label="View-once video"
      />
      <div className="flex items-center gap-2 bg-black/80 px-2 py-1.5 text-xs text-white">
        <button
          type="button"
          aria-label={playing ? "Pause view-once video" : "Play view-once video"}
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) void video.play().catch(() => setPlaying(false));
            else video.pause();
          }}
          className="rounded px-2 py-1 font-semibold"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <input
          aria-label="Seek view-once video"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => seek(Number(event.currentTarget.value))}
          className="min-w-0 flex-1"
        />
        <span className="tabular-nums">
          {Math.floor(currentTime)}s / {Math.floor(duration)}s
        </span>
      </div>
    </div>
  );
}