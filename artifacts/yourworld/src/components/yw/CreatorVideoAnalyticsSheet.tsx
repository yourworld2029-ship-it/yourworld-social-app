import { formatCount, type ChannelItem } from "@/lib/channel-data";
import { VideoPoster } from "@/components/yw/VideoPoster";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type EarningsState = {
  videoId: string;
  status: "loading" | "loaded" | "error";
  amount?: number;
} | null;

type Props = {
  video: ChannelItem | null;
  earnings: EarningsState;
  onClose: () => void;
};

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CreatorVideoAnalyticsSheet({ video, earnings, onClose }: Props) {
  const earningsValue =
    !video || !earnings || earnings.videoId !== video.id || earnings.status === "loading"
      ? "…"
      : earnings.status === "error"
        ? "Not available"
        : formatRupees(earnings.amount ?? 0);

  return (
    <Sheet
      open={Boolean(video)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] overflow-y-auto rounded-t-[28px] border-white/10 bg-[#090a11] p-0 text-white sm:mx-auto sm:max-w-2xl"
      >
        {video && (
          <div className="mx-auto w-full max-w-2xl px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-4 sm:px-7">
            <div
              aria-hidden="true"
              className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20"
            />
            <SheetHeader className="pr-9 text-left">
              <SheetTitle className="text-white">Video analytics</SheetTitle>
              <SheetDescription className="text-slate-400">
                Views and paid-video earnings for this video.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <VideoPoster
                mediaUrl={video.mediaUrl}
                thumbnailUrl={video.thumb}
                alt={video.title}
                className="aspect-video w-full"
              />
              <div className="p-4">
                <h2 className="line-clamp-2 text-base font-semibold text-white">
                  {video.title}
                </h2>
                <p className="pt-1 text-xs text-slate-400">{video.publishedAt}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Views
                </p>
                <p className="pt-2 text-xl font-semibold tabular-nums text-white">
                  {formatCount(video.views)}
                </p>
              </section>
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Estimated earnings
                </p>
                <p className="pt-2 text-xl font-semibold tabular-nums text-white">
                  {earningsValue}
                </p>
                <p className="pt-1 text-[10px] leading-relaxed text-slate-500">
                  Creator share from paid video purchases.
                </p>
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}