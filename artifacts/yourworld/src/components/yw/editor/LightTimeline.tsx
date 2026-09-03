import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Volume2, VolumeX } from "lucide-react";
import { AudioTrackLane, type AudioTrackState } from "./AudioTrackLane";
import { MAX_REEL_CLIPS } from "@/lib/reel-editor";

export interface TimelineClip {
  id: string;
  url?: string;
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
}

export interface LightTimelineProps {
  clips: TimelineClip[];
  activeIndex: number;
  currentTime: number;
  totalDuration: number;
  playFraction?: number;
  isPlaying?: boolean;
  audioLabel?: string;
  onAddAudio?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onSelect?: (index: number) => void;
  onTrim?: (index: number, start: number, end: number) => void;
  onAdd?: () => void;
  onScrub?: (index: number, fraction: number) => void;
  onReorder?: (from: number, to: number) => void;
  audioTrack?: AudioTrackState | null;
  onAudioChange?: (next: AudioTrackState) => void;
  onAudioRemove?: () => void;
}

const BASE_CELL = 112;

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

const clipLen = (c: TimelineClip) => {
  const dur = c.duration || 0;
  const start = c.trimStart ?? 0;
  const end = c.trimEnd ?? dur;
  return Math.max(0.1, end - start);
};

// ---- thumbnail extraction (cached per url+time) ----
const thumbCache = new Map<string, string>();
const thumbInFlight = new Map<string, Promise<string>>();
let thumbnailWorker: Worker | null | undefined;
let thumbnailRequestId = 0;
const thumbnailWorkerRequests = new Map<
  number,
  { resolve: (blob: Blob) => void; reject: (error: Error) => void }
>();

function getThumbnailWorker() {
  if (thumbnailWorker !== undefined) return thumbnailWorker;
  if (typeof Worker === "undefined") {
    thumbnailWorker = null;
    return thumbnailWorker;
  }
  try {
    const worker = new Worker(new URL("./thumbnail-worker.ts", import.meta.url), {
      type: "module",
    });
    worker.addEventListener("message", (event: MessageEvent<{
      id: number;
      blob?: Blob;
      error?: string;
    }>) => {
      const pending = thumbnailWorkerRequests.get(event.data.id);
      if (!pending) return;
      thumbnailWorkerRequests.delete(event.data.id);
      if (event.data.blob) pending.resolve(event.data.blob);
      else pending.reject(new Error(event.data.error ?? "thumbnail encode failed"));
    });
    worker.addEventListener("error", () => {
      for (const [id, pending] of thumbnailWorkerRequests) {
        thumbnailWorkerRequests.delete(id);
        pending.reject(new Error("thumbnail worker failed"));
      }
      worker.terminate();
      thumbnailWorker = null;
    });
    thumbnailWorker = worker;
  } catch {
    thumbnailWorker = null;
  }
  return thumbnailWorker;
}

function encodeThumbnailInWorker(bitmap: ImageBitmap, width: number, height: number) {
  const worker = getThumbnailWorker();
  if (!worker) return Promise.reject(new Error("thumbnail worker unavailable"));
  const id = ++thumbnailRequestId;
  return new Promise<Blob>((resolve, reject) => {
    thumbnailWorkerRequests.set(id, { resolve, reject });
    try {
      worker.postMessage({ id, bitmap, width, height }, [bitmap]);
    } catch (error) {
      thumbnailWorkerRequests.delete(id);
      reject(error instanceof Error ? error : new Error("thumbnail transfer failed"));
    }
  });
}

function grabFrame(url: string, time: number): Promise<string> {
  const key = `${url}@${time.toFixed(2)}`;
  const hit = thumbCache.get(key);
  if (hit) return Promise.resolve(hit);
  const inflight = thumbInFlight.get(key);
  if (inflight) return inflight;
  const pending = new Promise<string>((resolve, reject) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    const cleanup = () => {
      v.removeAttribute("src");
      try { v.load(); } catch { /* ignore */ }
    };
    const capture = async () => {
      try {
        const w = 160;
        const ratio = v.videoHeight ? v.videoHeight / v.videoWidth : 16 / 9;
        const h = Math.max(1, Math.round(w * ratio));
        let blob: Blob | null = null;
        if (typeof createImageBitmap === "function" && getThumbnailWorker()) {
          try {
            const bitmap = await createImageBitmap(v);
            blob = await encodeThumbnailInWorker(bitmap, w, h);
          } catch {
            // Fall through to the local canvas path for Safari/older browsers.
          }
        }
        if (!blob) {
          const canvas = Object.assign(document.createElement("canvas"), {
            width: w,
            height: h,
          });
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("no thumbnail context");
          ctx.drawImage(v, 0, 0, w, h);
          blob = await new Promise<Blob>((blobResolve, blobReject) => {
            canvas.toBlob(
              (value) => value
                ? blobResolve(value)
                : blobReject(new Error("thumbnail blob failed")),
              "image/jpeg",
              0.65,
            );
          });
        }
        const data = URL.createObjectURL(blob);
        thumbCache.set(key, data);
        cleanup();
        resolve(data);
      } catch (e) {
        cleanup();
        reject(e);
      }
    };
    let settled = false;
    let seekTimer: ReturnType<typeof setTimeout> | null = null;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (seekTimer) clearTimeout(seekTimer);
      v.removeEventListener("seeked", onSeeked);
      fn();
    };
    const onSeeked = () => {
      void capture().catch((error) => finish(() => {
        cleanup();
        reject(error);
      }));
    };
    const onLoaded = () => {
      const t = Math.min(Math.max(0.05, time), Math.max(0.05, (v.duration || 1) - 0.05));
      v.addEventListener("seeked", onSeeked, { once: true });
      seekTimer = setTimeout(() => {
        if (v.readyState >= 2) onSeeked();
        else finish(() => {
          cleanup();
          reject(new Error("thumbnail seek timed out"));
        });
      }, 1500);
      try { v.currentTime = t; } catch { onSeeked(); }
    };
    const onError = () => finish(() => {
      cleanup();
      reject(new Error("thumb load failed"));
    });
    v.addEventListener("loadeddata", onLoaded, { once: true });
    v.addEventListener("error", onError, { once: true });
  });
  thumbInFlight.set(key, pending);
  void pending.then(
    () => thumbInFlight.delete(key),
    () => thumbInFlight.delete(key),
  );
  return pending;
}

function useThumbnails(clips: TimelineClip[]) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  // Trim handles update on every pointer frame. Thumbnails are source frames,
  // so never make that hot path invalidate the cached frame set.
  const sig = clips.map((c) => `${c.id}:${c.url ?? ""}`).join("|");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const c of clips) {
        if (!c.url) continue;
        const at = (c.trimStart ?? 0) + 0.1;
        try {
          const data = await grabFrame(c.url, at);
          if (cancelled) return;
          setThumbs((prev) => (prev[c.id] === data ? prev : { ...prev, [c.id]: data }));
        } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return thumbs;
}

function LightTimelineBase({
  clips,
  activeIndex,
  currentTime,
  totalDuration,
  playFraction,
  isPlaying,
  audioLabel: _audioLabel,
  onAddAudio,
  isMuted,
  onToggleMute,
  onSelect,
  onAdd,
  onTrim,
  onScrub,
  onReorder,
  audioTrack,
  onAudioChange,
  onAudioRemove,
}: LightTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrollRef = useRef(false);
  const userTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const padRef = useRef(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragRef = useRef<{ index: number; startX: number; moved: boolean } | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const thumbs = useThumbnails(clips);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const cell = Math.round(BASE_CELL * timelineZoom);
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);

  // keep half-container padding so the first/last frame can reach the center line
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const set = () => {
      padRef.current = el.clientWidth / 2;
      el.style.paddingLeft = `${padRef.current}px`;
      el.style.paddingRight = `${padRef.current}px`;
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  // Native passive listeners keep pinch tracking off React's event queue.
  // The timeline remains horizontally scrollable while two fingers change
  // frame precision from a compact overview to a precise edit view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const start = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinchRef.current = {
          distance: distance(event.touches[0], event.touches[1]),
          zoom: timelineZoom,
        };
      }
    };
    const move = (event: TouchEvent) => {
      const pinch = pinchRef.current;
      if (!pinch || event.touches.length !== 2) return;
      const nextDistance = distance(event.touches[0], event.touches[1]);
      const nextZoom = Math.min(
        2.25,
        Math.max(0.75, pinch.zoom * (nextDistance / Math.max(1, pinch.distance))),
      );
      setTimelineZoom(nextZoom);
    };
    const end = () => { pinchRef.current = null; };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("touchcancel", end, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [timelineZoom]);

  // auto-scroll the track under the fixed center playhead while playing.
  // The write is deferred to the next animation frame so the scroll never
  // fights the browser's own compositing pass (that's what caused the jitter).
  const autoRaf = useRef<number | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || userScrollRef.current) return;
    const frac = playFraction ?? 0;
    const target = activeIndex * cell + frac * cell;
    if (autoRaf.current) cancelAnimationFrame(autoRaf.current);
    autoRaf.current = requestAnimationFrame(() => {
      autoRaf.current = null;
      if (userScrollRef.current) return;
      if (Math.abs(el.scrollLeft - target) > 0.5) el.scrollLeft = target;
    });
    return () => {
      if (autoRaf.current) cancelAnimationFrame(autoRaf.current);
      autoRaf.current = null;
    };
  }, [activeIndex, playFraction, cell]);

  // scrub updates are throttled to one per frame — dragging stays at 60fps
  const scrubRaf = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !userScrollRef.current || !onScrub) return;
    if (scrubRaf.current) return;
    scrubRaf.current = requestAnimationFrame(() => {
      scrubRaf.current = null;
      const x = Math.max(0, el.scrollLeft);
      const idx = Math.min(clips.length - 1, Math.floor(x / cell));
      const frac = Math.min(1, Math.max(0, (x - idx * cell) / cell));
      onScrub(idx, frac);
    });
  }, [clips.length, onScrub, cell]);

  const markUser = useCallback(() => {
    userScrollRef.current = true;
    if (userTimer.current) clearTimeout(userTimer.current);
    userTimer.current = setTimeout(() => {
      userScrollRef.current = false;
    }, 260);
  }, []);


  // ---- long-press drag to reorder ----
  const beginPress = (index: number) => (e: React.PointerEvent) => {
    if (!onReorder) return;
    const startX = e.clientX;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      dragRef.current = { index, startX, moved: false };
      setDragIndex(index);
      setDragOffset(0);
      if (navigator.vibrate) try { navigator.vibrate(12); } catch { /* ignore */ }
    }, 320);

    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) {
        if (Math.abs(ev.clientX - startX) > 6 && pressTimer.current) {
          clearTimeout(pressTimer.current);
          pressTimer.current = null;
        }
        return;
      }
      d.moved = true;
      setDragOffset(ev.clientX - d.startX);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
      const d = dragRef.current;
      dragRef.current = null;
      if (d) {
        const shift = Math.round(dragOffsetRef.current / cell);
        const to = Math.min(clips.length - 1, Math.max(0, d.index + shift));
        if (to !== d.index) onReorder?.(d.index, to);
      }
      setDragIndex(null);
      setDragOffset(0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const dragOffsetRef = useRef(0);
  dragOffsetRef.current = dragOffset;
  const snapMarkers = useMemo(() => {
    let offset = 0;
    return clips.slice(0, -1).map((clip, index) => {
      offset += clipLen(clip);
      return {
        index,
        left: (offset / Math.max(totalDuration, 0.1)) * clips.length * cell,
      };
    });
  }, [clips, totalDuration, cell]);
  const audioMarkerLeft = audioTrack
    ? (audioTrack.start / Math.max(totalDuration, 0.1)) * clips.length * cell
    : null;

  return (
    <div className="w-full select-none">
      {/* unified time readout */}
      <div className="flex items-center justify-between px-4 pb-1.5">
        <button
          onClick={onToggleMute}
          className="grid h-7 w-7 place-items-center rounded-full bg-muted/70 text-muted-foreground transition-transform duration-150 active:scale-90"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <span className="rounded-full bg-muted/60 px-3 py-0.5 text-[11px] font-black tabular-nums text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          {fmt(currentTime)} <span className="text-muted-foreground">/ {fmt(totalDuration)}</span>
        </span>
        {clips.length < MAX_REEL_CLIPS ? (
          <button
            onClick={onAdd}
            className="grid h-7 w-7 place-items-center rounded-full bg-muted/70 text-muted-foreground transition-transform duration-150 active:scale-90"
            aria-label="Add clip"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="w-7 text-center text-[9px] font-black text-orange-500" aria-label="Maximum clips reached">
            5/5
          </span>
        )}
      </div>

      <div className="relative">
        {/* fixed center playhead */}
        <div className="pointer-events-none absolute left-1/2 top-0 bottom-0 z-20 -translate-x-1/2">
          <div className="h-full w-[2px] rounded-full bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.55)]" />
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-orange-500 shadow" />
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onPointerDown={markUser}
          onTouchStart={markUser}
          onWheel={markUser}
          className="overflow-x-auto overflow-y-hidden scrollbar-none overscroll-x-contain"
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
            contain: "paint",
          }}
        >
          {/* video track — continuous, zero gaps, white dividers */}
          <div
            className="relative flex items-center h-16"
            style={{ width: Math.max(cell, clips.length * cell), willChange: "transform" }}
          >

            {clips.map((clip, i) => {
              const selected = i === activeIndex;
              const dur = clip.duration || 0;
              const tStart = clip.trimStart ?? 0;
              const tEnd = clip.trimEnd ?? dur;
              const startPct = dur ? (tStart / dur) * 100 : 0;
              const endPct = dur ? (tEnd / dur) * 100 : 100;
              const trimDrag = (side: "start" | "end") => (e: React.PointerEvent) => {
                if (!onTrim || !dur) return;
                e.preventDefault();
                e.stopPropagation();
                const cellEl = (e.currentTarget as HTMLElement).parentElement;
                if (!cellEl) return;
                const rect = cellEl.getBoundingClientRect();
                const move = (ev: PointerEvent) => {
                  const pct = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
                  const t = pct * dur;
                  if (side === "start") onTrim(i, Math.min(t, tEnd - 0.2), tEnd);
                  else onTrim(i, tStart, Math.max(t, tStart + 0.2));
                };
                const up = () => {
                  window.removeEventListener("pointermove", move);
                  window.removeEventListener("pointerup", up);
                };
                window.addEventListener("pointermove", move);
                window.addEventListener("pointerup", up);
              };
              return (
                <div
                  key={clip.id || i}
                  onPointerDown={beginPress(i)}
                  onPointerUp={() => {
                    if (dragIndex === null) onSelect?.(i);
                  }}
                  style={{
                    width: cell,
                    transform:
                      dragIndex === i
                        ? `translate3d(${dragOffset}px,0,0) scale(1.06)`
                        : "translate3d(0,0,0)",
                    zIndex: dragIndex === i ? 30 : undefined,
                    touchAction: dragIndex === i ? "none" : undefined,
                    willChange: dragIndex === i ? "transform" : undefined,
                    transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                  }}
                  className={`relative h-16 flex-shrink-0 bg-muted overflow-hidden cursor-pointer duration-200 [transition-property:opacity,transform,box-shadow] ${
                    dragIndex === i ? "shadow-2xl ring-2 ring-inset ring-orange-500 opacity-100" : ""
                  } ${
                    selected
                      ? "opacity-100 ring-2 ring-inset ring-orange-500 z-10 shadow-[0_6px_18px_-8px_rgba(249,115,22,0.8)]"
                      : "opacity-45"
                  }`}
                >
                  {thumbs[clip.id] && (
                    <img
                      src={thumbs[clip.id]}
                      alt=""
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
                    <span className="text-[9px] font-black tabular-nums text-foreground/80">
                      #{i + 1} · {clipLen(clip).toFixed(1)}s
                    </span>
                  </div>
                  {i > 0 && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-background" />}

                  {/* trimmed-out shading */}
                  <div className="absolute inset-y-0 left-0 bg-background/70 pointer-events-none" style={{ width: `${startPct}%` }} />
                  <div className="absolute inset-y-0 right-0 bg-background/70 pointer-events-none" style={{ width: `${100 - endPct}%` }} />

                  {selected && dur > 0 && (
                    <>
                      <div
                        onPointerDown={trimDrag("start")}
                        className="absolute inset-y-0 w-3 rounded-l-md bg-orange-500 cursor-ew-resize touch-none flex items-center justify-center z-20 shadow-md"
                        style={{ left: `${startPct}%` }}
                      >
                        <span className="h-5 w-[2px] bg-white/90 rounded" />
                      </div>
                      <div
                        onPointerDown={trimDrag("end")}
                        className="absolute inset-y-0 w-3 -translate-x-full rounded-r-md bg-orange-500 cursor-ew-resize touch-none flex items-center justify-center z-20 shadow-md"
                        style={{ left: `${endPct}%` }}
                      >
                        <span className="h-5 w-[2px] bg-white/90 rounded" />
                      </div>
                    </>
                  )}
                </div>
              );

            })}
            {snapMarkers.map((marker) => (
              <div
                key={`cut-${marker.index}`}
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/35"
                style={{ left: marker.left }}
              />
            ))}
            {audioMarkerLeft !== null && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-emerald-300/75 shadow-[0_0_8px_rgba(110,231,183,0.7)]"
                style={{ left: audioMarkerLeft }}
              />
            )}
          </div>

          {/* dedicated audio track with waveform trim */}
          <AudioTrackLane
            track={audioTrack ?? null}
            totalDuration={totalDuration}
            currentTime={currentTime}
            width={Math.max(cell, clips.length * cell)}
            onChange={(next) => onAudioChange?.(next)}
            onPick={() => onAddAudio?.()}
            onRemove={() => onAudioRemove?.()}
          />
        </div>
      </div>

      {isPlaying ? null : null}
    </div>
  );
}

export const LightTimeline = React.memo(LightTimelineBase);

export default LightTimeline;
