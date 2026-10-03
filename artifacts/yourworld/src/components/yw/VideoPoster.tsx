import { LazyVideoThumbnail } from "@/components/yw/LazyVideoThumbnail";

type Props = {
  thumbnailUrl?: string | null;
  mediaUrl: string;
  streamId?: string | null;
  alt: string;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  bucket?: "reels" | "videos" | "thumbnails";
  posterOnly?: boolean;
  allowFrameFallback?: boolean;
  showPlayFallback?: boolean;
  showLoadingShimmer?: boolean;
  onPosterResolved?: (url: string) => void;
};

// Shared list fallback never mounts another video decoder. Active playback
// publishes decoded poster frames to the cache used by LazyVideoThumbnail.
export function VideoPoster({ posterOnly: _posterOnly, allowFrameFallback: _frame,
  showLoadingShimmer: _shimmer, ...props }: Props) {
  return <LazyVideoThumbnail {...props} showPlayFallback={props.showPlayFallback ?? true} />;
}