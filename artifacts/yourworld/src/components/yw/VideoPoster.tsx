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

// Honor each surface's access gate; authorized frame reads use the shared slot.
export function VideoPoster({ posterOnly: _posterOnly, allowFrameFallback = true,
  showLoadingShimmer: _shimmer, ...props }: Props) {
  return <LazyVideoThumbnail {...props} allowFrameCapture={allowFrameFallback}
    showPlayFallback={props.showPlayFallback ?? true} />;
}