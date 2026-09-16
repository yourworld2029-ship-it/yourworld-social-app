import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VIEWPORT_SIZE = 280;
const OUTPUT_SIZE = 1024;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const MOVE_STEP = 24;

type CropOffset = {
  x: number;
  y: number;
};

type ImageSize = {
  width: number;
  height: number;
};

type ProfilePhotoCropperProps = {
  open: boolean;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: { file: File; previewUrl: string }) => void | Promise<void>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCropLayout(imageSize: ImageSize, zoom: number) {
  const baseScale = Math.max(
    VIEWPORT_SIZE / imageSize.width,
    VIEWPORT_SIZE / imageSize.height,
  );
  const scale = baseScale * zoom;
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;

  return {
    scale,
    width,
    height,
    maxX: Math.max(0, (width - VIEWPORT_SIZE) / 2),
    maxY: Math.max(0, (height - VIEWPORT_SIZE) / 2),
  };
}

async function createCroppedAvatar(
  sourceUrl: string,
  imageSize: ImageSize,
  zoom: number,
  offset: CropOffset,
) {
  const image = new Image();
  image.src = sourceUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("This image could not be cropped."));
  });

  const layout = getCropLayout(imageSize, zoom);
  const sourceSize = Math.min(imageSize.width, imageSize.height) / zoom;
  const sourceCenterX = imageSize.width / 2 - offset.x / layout.scale;
  const sourceCenterY = imageSize.height / 2 - offset.y / layout.scale;
  const sourceX = clamp(sourceCenterX - sourceSize / 2, 0, imageSize.width - sourceSize);
  const sourceY = clamp(sourceCenterY - sourceSize / 2, 0, imageSize.height - sourceSize);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This image could not be cropped.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("This image could not be cropped.");

  return new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
}

export function ProfilePhotoCropper({
  open,
  file,
  onOpenChange,
  onComplete,
}: ProfilePhotoCropperProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [applying, setApplying] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offset: CropOffset;
  } | null>(null);

  useEffect(() => {
    if (!open || !file) {
      setSourceUrl("");
      setImageSize(null);
      setZoom(MIN_ZOOM);
      setOffset({ x: 0, y: 0 });
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setSourceUrl(nextUrl);
    setImageSize(null);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });

    return () => URL.revokeObjectURL(nextUrl);
  }, [file, open]);

  const layout = useMemo(
    () => (imageSize ? getCropLayout(imageSize, zoom) : null),
    [imageSize, zoom],
  );

  const move = (x: number, y: number) => {
    if (!layout) return;
    setOffset((current) => ({
      x: clamp(current.x + x, -layout.maxX, layout.maxX),
      y: clamp(current.y + y, -layout.maxY, layout.maxY),
    }));
  };

  const apply = async () => {
    if (!sourceUrl || !imageSize) return;
    setApplying(true);
    try {
      const croppedFile = await createCroppedAvatar(sourceUrl, imageSize, zoom, offset);
      const previewUrl = URL.createObjectURL(croppedFile);
      await onComplete({ file: croppedFile, previewUrl });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not crop this image.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-5">
        <DialogHeader>
          <DialogTitle>Adjust profile photo</DialogTitle>
          <DialogDescription>
            Drag the image or use the arrows to choose what appears inside the ring.
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative mx-auto aspect-square w-full max-w-[280px] touch-none overflow-hidden rounded-full bg-secondary"
          onPointerDown={(event) => {
            if (!layout) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              offset,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId || !layout) return;
            setOffset({
              x: clamp(drag.offset.x + event.clientX - drag.startX, -layout.maxX, layout.maxX),
              y: clamp(drag.offset.y + event.clientY - drag.startY, -layout.maxY, layout.maxY),
            });
          }}
          onPointerUp={(event) => {
            if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        >
          {sourceUrl && layout ? (
            <img
              src={sourceUrl}
              alt="Profile photo crop preview"
              draggable={false}
              onLoad={(event) => {
                setImageSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
              className="absolute left-1/2 top-1/2 max-w-none select-none object-cover"
              style={{
                width: layout.width,
                height: layout.height,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          ) : sourceUrl ? (
            <img
              src={sourceUrl}
              alt="Profile photo crop preview"
              className="h-full w-full object-cover"
              onLoad={(event) => {
                setImageSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Profile photo zoom"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!imageSize}
            onChange={(event) => {
              const nextZoom = Number(event.target.value);
              setZoom(nextZoom);
              if (imageSize) {
                const nextLayout = getCropLayout(imageSize, nextZoom);
                setOffset((current) => ({
                  x: clamp(current.x, -nextLayout.maxX, nextLayout.maxX),
                  y: clamp(current.y, -nextLayout.maxY, nextLayout.maxY),
                }));
              }
            }}
            className="w-full accent-fuchsia-500"
          />
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        <div className="mx-auto grid w-32 grid-cols-3 gap-2">
          <span />
          <button
            type="button"
            aria-label="Move photo up"
            onClick={() => move(0, -MOVE_STEP)}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary transition-transform active:scale-95"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span />
          <button
            type="button"
            aria-label="Move photo left"
            onClick={() => move(-MOVE_STEP, 0)}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary transition-transform active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="grid h-9 w-9 place-items-center text-[10px] font-semibold uppercase text-muted-foreground">
            Move
          </span>
          <button
            type="button"
            aria-label="Move photo right"
            onClick={() => move(MOVE_STEP, 0)}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary transition-transform active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span />
          <button
            type="button"
            aria-label="Move photo down"
            onClick={() => move(0, MOVE_STEP)}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary transition-transform active:scale-95"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <span />
        </div>

        <Button type="button" onClick={() => void apply()} disabled={!imageSize || applying} className="w-full rounded-full">
          {applying ? "Applying…" : "Use this crop"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}