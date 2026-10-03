import { memo, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useScreenImage } from "@/lib/screen-image";
import { VIDEO_POSTER_FALLBACK } from "@/components/yw/LazyVideoThumbnail";

type Props = ImgHTMLAttributes<HTMLImageElement> & { wrapperClassName?: string };

/** Image with native lazy-loading + a skeleton placeholder to avoid layout shift. */
export const LazyImage = memo(function LazyImage({
  className,
  wrapperClassName,
  onLoad,
  src,
  srcSet: _srcSet,
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const image = useScreenImage(src);
  return (
    <span ref={(node) => { image.ref.current = node; }} className={cn("relative block overflow-hidden", wrapperClassName)}>
      {!loaded && (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-muted/40"
        />
      )}
      <img
        {...props}
        src={image.source ?? (image.error ? VIDEO_POSTER_FALLBACK : undefined)}
        loading={props.loading ?? "lazy"}
        decoding={props.decoding ?? "async"}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </span>
  );
});
