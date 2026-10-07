import type { MouseEventHandler } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import type { SharedMomentContent } from "@/lib/moment-share";

type Props = {
  content: SharedMomentContent;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export function SharedMomentPill({ content, onClick, className = "" }: Props) {
  const title = content.kind === "reel" ? "Watch full reel" : "Watch full video";
  const detail =
    content.kind === "reel"
      ? content.creatorUsername
        ? `@${content.creatorUsername.replace(/^@+/, "")}`
        : content.creatorName
      : [content.creatorName, content.title].filter(Boolean).join(" · ");
  const classes = `inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/75 px-3.5 py-2 text-left text-white shadow-lg shadow-black/25 backdrop-blur-xl ${className}`;
  const inner = (
    <>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15">
        <Play className="ml-0.5 size-3.5 fill-current" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-xs font-bold leading-tight">
          {title}
          <ArrowUpRight className="size-3.5 shrink-0" />
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-medium text-white/70">
          {detail}
        </span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchEnd={(event) => event.stopPropagation()}
        aria-label={`${title}: ${detail}`}
        className={`${classes} pointer-events-auto transition active:scale-[0.98]`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div aria-label={`${title}: ${detail}`} className={`${classes} pointer-events-none`}>
      {inner}
    </div>
  );
}
