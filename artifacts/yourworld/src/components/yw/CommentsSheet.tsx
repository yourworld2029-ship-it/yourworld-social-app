import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { YwAvatar } from "@/components/yw/Avatar";
import type { User } from "@/lib/yw-data";
import { usePostComments, timeAgo, resolveMediaUrl, MAX_PINNED_COMMENTS } from "@/lib/social-data";
import { useMyProfile } from "@/lib/profile-data";
import { Pin, PinOff, SendHorizonal, Trash2 } from "lucide-react";
import { toast } from "sonner";

type DisplayComment = {
  id: string;
  user: User;
  body: string;
  time: string;
  avatarUrl?: string | null;
  mine: boolean;
  pinned: boolean;
};

function toUser(username: string, displayName: string, id: string, hue = 200): User {
  return { id, username, name: displayName || username, hue };
}

function CommentAvatar({ user, url }: { user: User; url?: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!url) {
      setSrc(null);
      return;
    }
    void resolveMediaUrl(url, "avatars").then((u) => alive && setSrc(u));
    return () => {
      alive = false;
    };
  }, [url]);

  if (src) {
    return (
      <img
        src={src}
        alt={`@${user.username} avatar`}
        className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
        loading="lazy"
      />
    );
  }
  return <YwAvatar user={user} size={34} />;
}

/**
 * Database-backed comments drawer with optimistic posting, delete-own and
 * realtime sync.
 */
export function CommentsSheet({
  children,
  postId,
  onCountChange,
  commentsDisabled = false,
}: {
  children: ReactNode;
  postId: string;
  onCountChange?: (count: number) => void;
  commentsDisabled?: boolean;
}) {
  const real = usePostComments(postId);
  const { profile, userId } = useMyProfile();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const scrollToLatest = () => {
    requestAnimationFrame(() => {
      const list = listRef.current;
      if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    });
  };

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onViewportChange = () => {
      if (document.activeElement === inputRef.current) scrollToLatest();
    };
    viewport.addEventListener("resize", onViewportChange);
    viewport.addEventListener("scroll", onViewportChange);
    return () => {
      viewport.removeEventListener("resize", onViewportChange);
      viewport.removeEventListener("scroll", onViewportChange);
    };
  }, [open]);

  const isRealUser = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Warm the profile route so the tap feels instant.
  const prefetchProfile = (id: string) => {
    if (!isRealUser(id)) return;
    void router.preloadRoute({ to: "/u/$userId", params: { userId: id } }).catch(() => {});
  };

  const currentUser: User = {
    id: userId ?? "",
    username: profile.username,
    name: profile.display_name || profile.username,
    hue: 280,
  };

  const list: DisplayComment[] = real.comments.map((c) => ({
        id: c.id,
        user: toUser(c.username, c.displayName, c.userId),
        body: c.body,
        time: timeAgo(c.createdAt),
        avatarUrl: c.avatarUrl,
        mine: !!real.me && c.userId === real.me,
        pinned: c.pinned,
      }));

  const count = list.length;

  useEffect(() => {
    onCountChange?.(real.comments.length);
  }, [real.comments.length, onCountChange]);

  const send = () => {
    if (!draft.trim()) return;
    const text = draft;
    setDraft("");
    void real.send(text).then((ok) => {
      if (!ok) {
        setDraft(text);
        toast.error("Comment could not be posted");
      }
    });
  };

  const canModerate = real.isPostOwner;

  const togglePin = async (c: DisplayComment) => {
    if (!c.pinned && real.pinnedCount >= MAX_PINNED_COMMENTS) {
      toast("You can pin up to 4 comments");
      return;
    }
    const ok = await real.togglePin(c.id);
    if (ok) toast.success(c.pinned ? "Comment unpinned" : "Comment pinned");
    else toast.error("Couldn't update pin");
  };

  const remove = (c: DisplayComment) => {
    void real.remove(c.id);
    toast.success("Comment deleted");
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[100dvh] overflow-hidden border-border bg-popover">
        <div className="mx-auto flex h-[min(70dvh,100dvh)] max-h-[calc(100dvh-env(safe-area-inset-top,0px))] min-h-0 w-full max-w-lg flex-col">
          <DrawerHeader className="sticky top-0 z-30 shrink-0 bg-popover pb-2">
            <DrawerTitle className="text-center font-display text-base">
              {count} {count === 1 ? "comment" : "comments"}
            </DrawerTitle>
          </DrawerHeader>

          <ul ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            {list.map((c) => (
              <li key={c.id} className={c.pinned ? "flex gap-3 rounded-xl bg-secondary/40 p-2" : "flex gap-3"}>
                {isRealUser(c.user.id) && !c.mine ? (
                  <Link
                    to="/u/$userId"
                    params={{ userId: c.user.id }}
                    onClick={() => setOpen(false)}
                    onPointerEnter={() => prefetchProfile(c.user.id)}
                    onPointerDown={() => prefetchProfile(c.user.id)}
                    className="shrink-0"
                    aria-label={`Open @${c.user.username} profile`}
                  >
                    <CommentAvatar user={c.user} url={c.avatarUrl} />
                  </Link>
                ) : (
                  <CommentAvatar user={c.user} url={c.avatarUrl} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {isRealUser(c.user.id) && !c.mine ? (
                      <Link
                        to="/u/$userId"
                        params={{ userId: c.user.id }}
                        onClick={() => setOpen(false)}
                        onPointerEnter={() => prefetchProfile(c.user.id)}
                        onPointerDown={() => prefetchProfile(c.user.id)}
                        className="font-semibold text-foreground transition-opacity active:opacity-60"
                      >
                        @{c.user.username}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">@{c.user.username}</span>
                    )}{" "}
                    · {c.time}
                  </p>
                  <p className="text-sm">{c.body}</p>
                  {c.pinned && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      <Pin className="h-3 w-3" /> Pinned
                    </p>
                  )}
                </div>
                <div className="mt-1 flex shrink-0 items-start gap-2">
                {canModerate && (
                  <button
                    onClick={() => void togglePin(c)}
                    aria-label={c.pinned ? "Unpin comment" : "Pin comment"}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                  >
                    {c.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </button>
                )}
                {(c.mine || canModerate) && (
                  <button
                    onClick={() => remove(c)}
                    aria-label="Delete comment"
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                </div>
              </li>
            ))}
            {!real.loading && list.length === 0 && (
              <li className="pt-10 text-center text-sm text-muted-foreground">
                No comments yet. Be the first.
              </li>
            )}
          </ul>

          <div className="sticky bottom-0 z-40 flex shrink-0 items-center gap-2 border-t border-border bg-popover px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-3">
            {commentsDisabled ? (
              <p
                data-testid="status-comments-disabled"
                className="w-full py-2 text-center text-xs text-muted-foreground"
              >
                Comments are turned off for this post.
              </p>
            ) : (
              <>
                {userId ? <YwAvatar user={currentUser} size={34} /> : null}
                <Input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onFocus={scrollToLatest}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Add a comment…"
                  className="h-11 rounded-full border-0 bg-secondary text-sm"
                />
                <button
                  type="button"
                  onClick={send}
                  aria-label="Send comment"
                  data-testid="button-send-comment"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full brand-gradient transition-transform active:scale-90"
                >
                  <SendHorizonal className="h-4 w-4 text-primary-foreground" />
                </button>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
