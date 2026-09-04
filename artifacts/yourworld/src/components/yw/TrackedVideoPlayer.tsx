import type { ComponentProps } from "react";
import { useVideoWatchTime } from "@/lib/video-data";
import { PremiumVideoPlayer } from "@/components/yw/PremiumVideoPlayer";

type Props = Omit<ComponentProps<typeof PremiumVideoPlayer>, "onWatchTime"> & {
  watchVideoId: string;
  watchTimeEnabled: boolean;
  onPlayedSeconds?: (seconds: number) => void;
};

/**
 * Keeps each watch-time buffer scoped to one mounted player. Queue navigation
 * mounts a fresh instance, so an in-flight flush can never be reassigned to
 * the next video.
 */
export function TrackedVideoPlayer({
  watchVideoId,
  watchTimeEnabled,
  onPlayedSeconds,
  ...playerProps
}: Props) {
  const reportWatchTime = useVideoWatchTime(watchVideoId, watchTimeEnabled);
  return (
    <PremiumVideoPlayer
      {...playerProps}
      onWatchTime={(seconds) => {
        reportWatchTime(seconds);
        onPlayedSeconds?.(seconds);
      }}
    />
  );
}