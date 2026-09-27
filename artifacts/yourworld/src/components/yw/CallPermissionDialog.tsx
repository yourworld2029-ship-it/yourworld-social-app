"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CallPermissionDialogProps = {
  open: boolean;
  mode: "audio" | "video" | null;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
};

export function CallPermissionDialog({
  open,
  mode,
  busy = false,
  onOpenChange,
  onRetry,
}: CallPermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[210]"
        className="z-[220] w-[calc(100%-2rem)] max-w-md rounded-2xl border-white/10 bg-[#050506] text-white shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
      >
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="text-base leading-snug">
            Microphone &amp; Camera permission required for calls
          </DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed text-white/65">
            {mode === "audio"
              ? "Allow microphone access to place an audio call. Video calls also need camera access."
              : "Allow microphone and camera access to place a video call."}{" "}
            Tap Try again to request access. If Android no longer shows a prompt,
            open Settings &gt; Apps &gt; YourWorld &gt; Permissions and allow the
            required access.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={busy}
            onClick={onRetry}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Requesting access…" : "Try again"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Not now
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}