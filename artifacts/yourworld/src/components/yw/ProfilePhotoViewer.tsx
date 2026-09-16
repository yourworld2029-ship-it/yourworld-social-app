import { useState, type SyntheticEvent } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ProfilePhotoViewerProps = {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  stopPropagation?: boolean;
  testId?: string;
  onImageError?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

export function ProfilePhotoViewer({
  src,
  alt = "Profile photo",
  className,
  imageClassName,
  stopPropagation = false,
  testId,
  onImageError,
}: ProfilePhotoViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label="View profile photo"
          className={cn("block cursor-zoom-in", className)}
          onClick={(event) => {
            if (stopPropagation) event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (stopPropagation) event.stopPropagation();
              event.currentTarget.click();
            }
          }}
        >
          <img
            src={src}
            alt={alt}
            data-testid={testId}
            className={cn("block h-full w-full object-cover", imageClassName)}
            onError={onImageError}
          />
        </span>
      </DialogTrigger>

      <DialogContent className="max-w-[min(92vw,720px)] border-0 bg-black/95 p-2 sm:rounded-2xl">
        <DialogTitle className="sr-only">Full-size profile photo</DialogTitle>
        <div className="flex max-h-[86svh] items-center justify-center overflow-hidden rounded-xl">
          <img src={src} alt={alt} className="max-h-[84svh] max-w-full object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  );
}