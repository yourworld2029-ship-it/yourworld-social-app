import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { ArrowUpRight, Globe2, Instagram, Youtube } from "lucide-react";
import { extractExternalTextLinks, getExternalLinkPresentation } from "@/lib/chat-links";
import { ProtectedCanvasText } from "@/components/yw/ProtectedCanvasContent";

type ChatRichLinkCardProps = {
  href: string;
  onClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
};

function ChatRichLinkCard({ href, onClick }: ChatRichLinkCardProps) {
  const presentation = getExternalLinkPresentation(href);
  if (!presentation) return null;

  const Icon =
    presentation.platform === "youtube"
      ? Youtube
      : presentation.platform === "instagram"
        ? Instagram
        : Globe2;
  const label =
    presentation.platform === "youtube"
      ? "YouTube"
      : presentation.platform === "instagram"
        ? "Instagram"
        : "Website";
  const iconClass =
    presentation.platform === "youtube"
      ? "bg-red-500/15 text-red-300"
      : presentation.platform === "instagram"
        ? "bg-fuchsia-500/15 text-fuchsia-300"
        : "bg-sky-400/15 text-sky-200";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} link at ${presentation.domain}`}
      data-testid="chat-rich-link"
      onClick={onClick}
      className="my-1.5 flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950/90 to-zinc-900/75 p-3 text-left text-white shadow-lg shadow-black/20 transition hover:border-white/20 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-white/95">
          {presentation.domain}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1.5 text-[11px] font-semibold text-white/85">
        Open
        <ArrowUpRight size={14} aria-hidden="true" />
      </span>
    </a>
  );
}

export function ChatMessageText({
  text,
  onOpenLink,
}: {
  text: string;
  onOpenLink: (url: string, event: ReactMouseEvent<HTMLAnchorElement>) => void;
}) {
  const links = extractExternalTextLinks(text);
  if (links.length === 0) {
    return <ProtectedCanvasText text={text} onUrlClick={onOpenLink} />;
  }

  const content: ReactNode[] = [];
  let cursor = 0;

  for (const [index, link] of links.entries()) {
    const before = text.slice(cursor, link.start);
    if (before) {
      content.push(<ProtectedCanvasText key={`text-${index}`} text={before} />);
    }
    content.push(
      <ChatRichLinkCard
        key={`link-${link.start}`}
        href={link.href}
        onClick={(event) => onOpenLink(link.href, event)}
      />,
    );
    cursor = link.end;
  }

  const after = text.slice(cursor);
  if (after) {
    content.push(<ProtectedCanvasText key="text-after-links" text={after} />);
  }

  return <>{content}</>;
}