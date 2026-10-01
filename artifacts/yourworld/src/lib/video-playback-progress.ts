export type VideoPlaybackProgress = Readonly<{
  currentTime: number;
  duration: number;
}>;

export type VideoPlaybackProgressStore = {
  getSnapshot: () => VideoPlaybackProgress;
  subscribe: (listener: () => void) => () => void;
  setProgress: (currentTime: number, duration: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
};

function finiteNonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function createVideoPlaybackProgressStore(): VideoPlaybackProgressStore {
  let snapshot: VideoPlaybackProgress = { currentTime: 0, duration: 0 };
  const listeners = new Set<() => void>();

  const setProgress = (currentTime: number, duration: number) => {
    const nextCurrentTime = finiteNonNegative(currentTime);
    const nextDuration = finiteNonNegative(duration);
    if (
      snapshot.currentTime === nextCurrentTime &&
      snapshot.duration === nextDuration
    ) {
      return;
    }

    snapshot = { currentTime: nextCurrentTime, duration: nextDuration };
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setProgress,
    setCurrentTime: (currentTime) =>
      setProgress(currentTime, snapshot.duration),
    setDuration: (duration) => setProgress(snapshot.currentTime, duration),
  };
}