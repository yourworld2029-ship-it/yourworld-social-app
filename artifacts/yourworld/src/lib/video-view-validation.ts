import { Capacitor, registerPlugin } from "@capacitor/core";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type DeviceFingerprintPlugin = {
  getFingerprint(): Promise<{ fingerprint?: string }>;
};

const nativeDeviceFingerprint =
  registerPlugin("DeviceFingerprint") as unknown as DeviceFingerprintPlugin;
const WEB_FINGERPRINT_STORAGE_KEY = "yourworld.video-device-fingerprint.v1";
let fingerprintPromise: Promise<string> | null = null;
let memoryFingerprint: string | null = null;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fallbackHash(input: string): string {
  const result: string[] = [];
  for (let seed = 0; seed < 8; seed += 1) {
    let hash = (0x811c9dc5 ^ (seed * 0x9e3779b9)) >>> 0;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    result.push(hash.toString(16).padStart(8, "0"));
  }
  return result.join("");
}

function canvasSignature(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 260;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return "canvas-unavailable";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#1259a7";
  context.fillRect(12, 8, 108, 42);
  context.fillStyle = "#f1c40f";
  context.font = "17px Arial";
  context.fillText("YourWorld • video", 8, 32);
  context.fillStyle = "rgba(170, 40, 90, 0.65)";
  context.font = "13px sans-serif";
  context.fillText("device-check", 74, 50);
  return canvas.toDataURL();
}

async function audioSignature(): Promise<string> {
  try {
    const audio = new OfflineAudioContext(1, 4_410, 44_100);
    const oscillator = audio.createOscillator();
    const compressor = audio.createDynamicsCompressor();
    oscillator.type = "triangle";
    oscillator.frequency.value = 10_000;
    oscillator.connect(compressor);
    compressor.connect(audio.destination);
    oscillator.start(0);
    const rendered = await audio.startRendering();
    const samples = rendered.getChannelData(0);
    const signature: string[] = [];
    for (let index = 0; index < samples.length; index += 64) {
      signature.push(samples[index]?.toFixed(6) ?? "0");
    }
    return signature.join(",");
  } catch {
    return "audio-unavailable";
  }
}

async function createWebFingerprint(): Promise<string> {
  if (memoryFingerprint) return memoryFingerprint;
  try {
    const saved = window.localStorage.getItem(WEB_FINGERPRINT_STORAGE_KEY);
    if (saved && /^[0-9a-f]{64}$/.test(saved)) {
      memoryFingerprint = saved;
      return saved;
    }
  } catch {
    // Private browsing may deny persistent storage; use the in-memory token below.
  }

  const audio = await audioSignature();
  const screenInfo = [
    screen.width,
    screen.height,
    screen.availWidth,
    screen.availHeight,
    screen.colorDepth,
    window.devicePixelRatio,
  ].join("x");
  const source = [
    canvasSignature(),
    audio,
    screenInfo,
    navigator.hardwareConcurrency ?? 0,
    navigator.platform ?? "",
    navigator.userAgent ?? "",
  ].join("|");

  let fingerprint: string;
  try {
    fingerprint = toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source)));
  } catch {
    fingerprint = fallbackHash(source);
  }
  memoryFingerprint = fingerprint;
  try {
    window.localStorage.setItem(WEB_FINGERPRINT_STORAGE_KEY, fingerprint);
  } catch {
    // Keep the generated token for this app session when storage is unavailable.
  }
  return fingerprint;
}

export function getPersistentVideoDeviceFingerprint(): Promise<string> {
  if (!fingerprintPromise) {
    fingerprintPromise = (async () => {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        try {
          const native = await nativeDeviceFingerprint.getFingerprint();
          if (native.fingerprint && /^[0-9a-f]{64}$/.test(native.fingerprint)) {
            return native.fingerprint;
          }
        } catch (error) {
          console.warn("Native device fingerprint is unavailable; using the browser token.", error);
        }
      }
      return createWebFingerprint();
    })().catch((error) => {
      fingerprintPromise = null;
      throw error;
    });
  }
  return fingerprintPromise;
}

export function isContinuousPlaybackDelta(
  elapsedMilliseconds: number,
  mediaDeltaSeconds: number,
  playbackRate = 1,
): boolean {
  if (
    !Number.isFinite(elapsedMilliseconds) ||
    !Number.isFinite(mediaDeltaSeconds) ||
    elapsedMilliseconds < 1_000 ||
    elapsedMilliseconds > 4_500 ||
    mediaDeltaSeconds < 0.25
  ) {
    return false;
  }
  const expectedRate = Math.min(2.5, Math.max(0.5, playbackRate));
  return mediaDeltaSeconds <= (elapsedMilliseconds / 1_000) * expectedRate + 1;
}

type VideoViewTrackerOptions = {
  videoId: string;
  ownerId?: string | null;
  currentUserId?: string | null;
  enabled: boolean;
  allowAutomaticLoop?: boolean;
  getVideoElement: () => HTMLVideoElement | null;
  onCounted?: () => void | Promise<unknown>;
};

type RpcError = { message?: string } | null;

type TrackerState = {
  sessionId: string | null;
  fingerprint: string | null;
  lastWallTime: number | null;
  lastMediaTime: number | null;
  virtualPositionSeconds: number;
  loopPending: boolean;
  ignoreLoopSeek: boolean;
  started: Promise<void> | null;
  busy: boolean;
  completed: boolean;
};

export function useValidatedVideoViewTracker({
  videoId,
  ownerId,
  currentUserId,
  enabled,
  allowAutomaticLoop = false,
  getVideoElement,
  onCounted,
}: VideoViewTrackerOptions): void {
  const completedVideosRef = useRef(new Set<string>());

  useEffect(() => {
    if (!videoId || !enabled || (ownerId && currentUserId === ownerId)) return;

    const state: TrackerState = {
      sessionId: null,
      fingerprint: null,
      lastWallTime: null,
      lastMediaTime: null,
      virtualPositionSeconds: 0,
      loopPending: false,
      ignoreLoopSeek: false,
      started: null,
      busy: false,
      completed: completedVideosRef.current.has(videoId),
    };
    let disposed = false;
    let observedVideo: HTMLVideoElement | null = null;
    let ticker: number | null = null;

    const clearLocalSession = () => {
      state.sessionId = null;
      state.fingerprint = null;
      state.lastWallTime = null;
      state.lastMediaTime = null;
      state.virtualPositionSeconds = 0;
      state.loopPending = false;
      state.ignoreLoopSeek = false;
    };

    const stopSession = () => {
      const sessionId = state.sessionId;
      if (sessionId) {
        void Promise.resolve(supabase.rpc("record_valid_video_view_heartbeat", {
          p_session_id: sessionId,
          p_video_position_seconds: state.virtualPositionSeconds,
          p_is_playing: false,
        })).then(({ error }: { error: RpcError }) => {
          if (error) console.debug("Playback validation session reset:", error.message);
        }).catch(() => {});
      }
      clearLocalSession();
    };

    const beginSession = async (video: HTMLVideoElement) => {
      if (state.sessionId || state.started || state.completed || disposed) return;
      state.started = (async () => {
        try {
          const fingerprint = await getPersistentVideoDeviceFingerprint();
          if (disposed || video.paused || video.ended || document.visibilityState === "hidden") return;
          const { data, error } = await supabase.rpc("start_valid_video_view_session", {
            p_video_id: videoId,
            p_device_fingerprint: fingerprint,
            p_video_position_seconds: 0,
          });
          if (error) throw error;
          if (typeof data !== "string" || !data) return;
          state.sessionId = data;
          state.fingerprint = fingerprint;
          state.lastWallTime = performance.now();
          state.lastMediaTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
          state.virtualPositionSeconds = 0;
        } catch (error) {
          console.warn("Could not start validated video-view session.", error);
        } finally {
          state.started = null;
        }
      })();
      await state.started;
    };

    const handlePlaying = () => {
      const video = observedVideo ?? getVideoElement();
      if (video && !state.completed) void beginSession(video);
    };
    const handlePause = () => {
      if (observedVideo?.ended && allowAutomaticLoop) {
        state.loopPending = true;
        return;
      }
      stopSession();
    };
    const handleSeeking = () => {
      if (state.ignoreLoopSeek) {
        state.ignoreLoopSeek = false;
        return;
      }
      stopSession();
    };
    const handleWaiting = () => stopSession();
    const handleEnded = () => {
      if (allowAutomaticLoop || observedVideo?.loop) {
        state.loopPending = true;
        state.ignoreLoopSeek = true;
      } else {
        stopSession();
      }
    };

    const attachVideo = () => {
      const nextVideo = getVideoElement();
      if (nextVideo === observedVideo) return;
      if (observedVideo) {
        observedVideo.removeEventListener("playing", handlePlaying);
        observedVideo.removeEventListener("pause", handlePause);
        observedVideo.removeEventListener("seeking", handleSeeking);
        observedVideo.removeEventListener("waiting", handleWaiting);
        observedVideo.removeEventListener("stalled", handleWaiting);
        observedVideo.removeEventListener("ended", handleEnded);
      }
      observedVideo = nextVideo;
      if (!observedVideo) {
        stopSession();
        return;
      }
      observedVideo.addEventListener("playing", handlePlaying);
      observedVideo.addEventListener("pause", handlePause);
      observedVideo.addEventListener("seeking", handleSeeking);
      observedVideo.addEventListener("waiting", handleWaiting);
      observedVideo.addEventListener("stalled", handleWaiting);
      observedVideo.addEventListener("ended", handleEnded);
      handlePlaying();
    };

    const tick = async () => {
      attachVideo();
      const video = observedVideo;
      if (
        disposed ||
        state.completed ||
        !video ||
        video.paused ||
        video.ended ||
        video.seeking ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        document.visibilityState === "hidden"
      ) {
        if (state.sessionId) stopSession();
        return;
      }

      if (!state.sessionId) {
        await beginSession(video);
        return;
      }
      if (state.busy) return;

      const now = performance.now();
      const elapsedMilliseconds =
        state.lastWallTime === null ? 0 : now - state.lastWallTime;
      const currentMediaTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const previousMediaTime = state.lastMediaTime ?? currentMediaTime;
      let mediaDeltaSeconds = currentMediaTime - previousMediaTime;

      if (
        mediaDeltaSeconds < 0 &&
        state.loopPending &&
        video.duration > 0 &&
        previousMediaTime >= video.duration - 1.5 &&
        currentMediaTime <= 1.5
      ) {
        mediaDeltaSeconds = Math.max(
          0.25,
          video.duration - previousMediaTime + currentMediaTime,
        );
      } else if (mediaDeltaSeconds < 0) {
        stopSession();
        return;
      }

      if (
        !isContinuousPlaybackDelta(
          elapsedMilliseconds,
          mediaDeltaSeconds,
          video.playbackRate,
        )
      ) {
        stopSession();
        return;
      }

      state.loopPending = false;
      state.lastWallTime = now;
      state.lastMediaTime = currentMediaTime;
      state.virtualPositionSeconds += elapsedMilliseconds / 1_000;
      state.busy = true;
      try {
        const { data: watchSeconds, error: heartbeatError } = await supabase.rpc(
          "record_valid_video_view_heartbeat",
          {
            p_session_id: state.sessionId,
            p_video_position_seconds: state.virtualPositionSeconds,
            p_is_playing: true,
          },
        );
        if (heartbeatError) throw heartbeatError;
        if (typeof watchSeconds !== "number" || watchSeconds < 12) return;

        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        const userId = authData.session?.user.id ?? null;
        const { data: didCount, error: recordError } = await supabase.rpc(
          "record_valid_video_view",
          {
            p_video_id: videoId,
            p_user_id: userId,
            p_device_fingerprint: state.fingerprint,
            p_watch_seconds: Math.floor(watchSeconds),
          },
        );
        if (recordError) throw recordError;

        state.completed = true;
        completedVideosRef.current.add(videoId);
        state.sessionId = null;
        if (didCount === true) {
          try {
            await onCounted?.();
          } catch (error) {
            console.warn("Video view was recorded, but the local view count did not refresh.", error);
          }
        }
      } catch (error) {
        console.warn("Could not record validated video playback.", error);
      } finally {
        state.busy = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") stopSession();
      else handlePlaying();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    attachVideo();
    ticker = window.setInterval(() => void tick(), 2_000);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (ticker !== null) window.clearInterval(ticker);
      if (observedVideo) {
        observedVideo.removeEventListener("playing", handlePlaying);
        observedVideo.removeEventListener("pause", handlePause);
        observedVideo.removeEventListener("seeking", handleSeeking);
        observedVideo.removeEventListener("waiting", handleWaiting);
        observedVideo.removeEventListener("stalled", handleWaiting);
        observedVideo.removeEventListener("ended", handleEnded);
      }
      stopSession();
    };
  }, [
    allowAutomaticLoop,
    currentUserId,
    enabled,
    getVideoElement,
    onCounted,
    ownerId,
    videoId,
  ]);
}
