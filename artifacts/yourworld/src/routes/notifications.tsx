import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { markAlertsSeen } from "@/lib/alerts-count";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  kindMeta,
  timeAgo,
  useNotifications,
  type NotificationItem,
} from "@/lib/notifications-store";
import { cn } from "@/lib/utils";
import { historyBackLink } from "@/lib/navigation";
import { SportsIdentityMark } from "@/components/yw/SportsIdentityBadge";
import { useYw } from "@/lib/yw-store";
import { useMoments } from "@/lib/moment-context";
import { fetchMomentById, type NewMoment } from "@/lib/moment-store";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — YourWorld" },
      {
        name: "description",
        content:
          "Real-time likes, comments, followers, messages, channel, verification and monetization alerts on YourWorld.",
      },
      { property: "og:title", content: "Notifications — YourWorld" },
      {
        property: "og:description",
        content: "Every YourWorld alert in one premium, real-time activity feed.",
      },
    ],
  }),
  component: NotificationsPage,
});

type Filter =
  | "all"
  | "likes"
  | "following"
  | "comments"
  | "mentions"
  | "monetization"
  | "verified";
type ActivityGroup = "Today" | "Yesterday" | "Last 7 days" | "Older";

const ACTIVITY_GROUPS: ActivityGroup[] = ["Today", "Yesterday", "Last 7 days", "Older"];

function getActivityGroup(timestamp: number, now = new Date()): ActivityGroup {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Older";
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const activityDay = new Date(date);
  activityDay.setHours(0, 0, 0, 0);
  const dayDifference = Math.floor((today.getTime() - activityDay.getTime()) / 86_400_000);
  if (dayDifference <= 0) return "Today";
  if (dayDifference === 1) return "Yesterday";
  if (dayDifference <= 7) return "Last 7 days";
  return "Older";
}

function NotificationsPage() {
  useEffect(() => {
    markAlertsSeen();
  }, []);

  const {
    items: allItems,
    markRead,
  } =
    useNotifications();
  const { following, toggleFollow } = useYw();
  const { moments, addMoment } = useMoments();
  const [filter, setFilter] = useState<Filter>("all");
  const [resharingMomentId, setResharingMomentId] = useState<string | null>(null);
  const navigate = useNavigate();

  const addMentionedMomentToMyMoments = async (item: NotificationItem) => {
    if (!item.canReshareMoment || !item.momentId || resharingMomentId) return;
    setResharingMomentId(item.momentId);
    let temporaryMediaUrl: string | null = null;
    try {
      const source =
        moments.find((moment) => moment.id === item.momentId) ??
        (await fetchMomentById(item.momentId));
      if (!source) {
        throw new Error("This Moment is no longer available to add.");
      }
      if (typeof source.expiresAt === "number" && source.expiresAt <= Date.now()) {
        throw new Error("This Moment has expired and can no longer be added.");
      }
      let media = "";
      let mediaType = source.mediaType;
      if (source.kind !== "text") {
        if (!source.media) throw new Error("This Moment has no media to share.");
        const response = await fetch(source.media);
        if (!response.ok) throw new Error("This Moment is no longer available to add.");
        const blob = await response.blob();
        if (!blob.size) throw new Error("This Moment's media could not be loaded.");
        mediaType ||= blob.type || undefined;
        temporaryMediaUrl = URL.createObjectURL(blob);
        media = temporaryMediaUrl;
      }

      const copy: NewMoment = {
        kind: source.kind,
        media,
        mediaType,
        text: source.text,
        textBg: source.textBg,
        stickers: source.stickers,
        drawing: source.drawing,
        trim: source.trim,
        crop: source.crop,
        mentions: [],
        mentionedUserIds: [],
        privacy: "followers",
        recipientUserIds: undefined,
        duration: source.duration,
        effect: source.effect,
        ai: source.ai,
        allowDownload: source.allowDownload,
        screenshotAlert: false,
        allowReactions: source.allowReactions,
        allowReplies: source.allowReplies,
        allowSharing: source.allowSharing,
        showLocation: false,
        saveToArchive: false,
        poll: null,
      };
      const result = await addMoment(copy);
      if (result.error) throw new Error(result.error);
      markRead(item.id);
      toast.success("Added to your Moment");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't add this Moment. It may no longer be available.",
      );
    } finally {
      if (temporaryMediaUrl) URL.revokeObjectURL(temporaryMediaUrl);
      setResharingMomentId(null);
    }
  };

  /** Message alerts are hidden here because they already live in the Chats inbox. */
  const items = useMemo(
    () => allItems.filter((i) => i.kind !== "message"),
    [allItems],
  );
  const list = useMemo(() => {
    const filtered = items.filter((item) => {
      if (filter === "all") return true;
      if (filter === "following") return Boolean(item.actorId && following[item.actorId]);
      if (filter === "likes") return item.kind === "like";
      if (filter === "comments") return item.kind === "comment";
      if (filter === "mentions") return item.kind === "mention";
      if (filter === "monetization") return item.kind === "monetization";
      return item.kind === "verification";
    });
    return [...filtered].sort((a, b) => b.at - a.at);
  }, [items, filter, following]);
  const groupedItems = useMemo(
    () =>
      ACTIVITY_GROUPS.map((label) => ({
        label,
        items: list.filter((item) => getActivityGroup(item.at) === label),
      })).filter((group) => group.items.length > 0),
    [list],
  );

  return (
    <main className="min-h-screen bg-zinc-950 pb-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] text-white">
      <header className="sticky top-0 z-40 flex flex-col items-stretch border-b border-white/[0.07] bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 pb-1.5 pt-[max(env(safe-area-inset-top,0px),2rem)]">
          <Link
            to="/"
            onClick={historyBackLink}
            aria-label="Back"
            data-testid="link-notifications-back"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-300 transition-colors hover:bg-white/[0.06] active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold tracking-tight">Notifications</h1>
          </div>
        </div>

        <div className="no-scrollbar flex w-full min-w-0 gap-1.5 overflow-x-auto px-4 pb-2 pt-1">
          <Chip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          <Chip active={filter === "likes"} onClick={() => setFilter("likes")} label="Likes" />
          <Chip
            active={filter === "following"}
            onClick={() => setFilter("following")}
            label="People you follow"
          />
          <Chip
            active={filter === "comments"}
            onClick={() => setFilter("comments")}
            label="Comments"
          />
          <Chip
            active={filter === "mentions"}
            onClick={() => setFilter("mentions")}
            label="Tags & mentions"
          />
          <Chip
            active={filter === "monetization"}
            onClick={() => setFilter("monetization")}
            label="Monetization"
          />
          <Chip
            active={filter === "verified"}
            onClick={() => setFilter("verified")}
            label="Verified"
          />
        </div>
      </header>

      <section aria-label="Activity" className="px-4 pt-2">
        {list.length === 0 ? (
          <div className="mx-auto flex max-w-sm flex-col items-center px-5 py-20 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-500">
              {filter === "mentions" ? <Bell className="h-6 w-6" /> : <CheckCheck className="h-6 w-6" />}
            </span>
            <h2 className="text-sm font-semibold text-zinc-200">
              {filter === "likes"
                ? "No likes yet"
                : filter === "comments"
                  ? "No comments yet"
                  : filter === "mentions"
                    ? "No tags or mentions yet"
                    : filter === "following"
                      ? "No recent activity from people you follow"
                      : filter === "monetization"
                        ? "No monetization updates yet"
                        : filter === "verified"
                          ? "No verification updates yet"
                          : "You’re all caught up"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              New likes, comments, mentions and followers will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedItems.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h2 className="mb-1 px-1 text-[12px] font-semibold text-zinc-300">
                  {group.label}
                </h2>
                <ul className="divide-y divide-white/[0.07]">
                  {group.items.map((item, index) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      prioritizeThumbnail={index < 6}
                      following={Boolean(item.actorId && following[item.actorId])}
                      onOpen={() => {
                        markRead(item.id);
                        if (item.to) navigate({ to: item.to });
                      }}
                      onAddToMoment={() => void addMentionedMomentToMyMoments(item)}
                      resharePending={resharingMomentId === item.momentId}
                      onToggleFollow={() => {
                        if (item.actorId) void toggleFollow(item.actorId);
                      }}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function NotificationRow({
  item,
  prioritizeThumbnail,
  following,
  onOpen,
  onAddToMoment,
  resharePending,
  onToggleFollow,
}: {
  item: NotificationItem;
  prioritizeThumbnail: boolean;
  following: boolean;
  onOpen: () => void;
  onAddToMoment: () => void;
  resharePending: boolean;
  onToggleFollow: () => void;
}) {
  const meta = kindMeta(item.kind);
  const Icon = meta.icon;
  const canFollowBack = item.kind === "follower" && !!item.actorId;

  return (
    <li
      data-testid={`row-notification-${item.id}`}
      className={cn(
        "group flex min-h-[68px] items-center gap-2.5 px-1 py-2 transition-colors hover:bg-white/[0.025] active:bg-white/[0.04]",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        data-testid={`button-open-notification-${item.id}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-0.5 text-left"
      >
        <NotificationAvatar item={item} Icon={Icon} />
        <span className="min-w-0 flex-1">
            <span className="block min-w-0">
              <span className="text-[13px] leading-[1.3] text-zinc-300">
              {item.actorName && item.activity ? (
                <>
                  <span className="font-semibold text-white">{item.actorName}</span>
                  {item.actorId ? <SportsIdentityMark userId={item.actorId} /> : null}{" "}
                  <span className="text-zinc-300">{item.activity}</span>
                    <span className="ml-1 whitespace-nowrap text-[10px] text-zinc-500">{timeAgo(item.at)}</span>
                </>
              ) : (
                  <>
                    <span className={cn("font-medium", !item.read && "text-white")}>{item.title}</span>
                    <span className="ml-1 whitespace-nowrap text-[10px] text-zinc-500">{timeAgo(item.at)}</span>
                  </>
              )}
            </span>
          </span>
          {item.body && (
            <span className="mt-0.5 block truncate text-[11px] leading-[1.35] text-zinc-500">
              {item.body}
            </span>
          )}
        </span>
      </button>
      {canFollowBack ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFollow();
          }}
          aria-label={following ? `Unfollow ${item.actorName ?? "user"}` : `Follow back ${item.actorName ?? "user"}`}
          data-testid={`button-follow-back-${item.actorId}`}
          className={cn(
            "h-8 shrink-0 rounded-lg px-3 text-[11px] font-semibold transition-colors active:scale-[0.98]",
            following
              ? "border border-white/[0.12] bg-white/[0.055] text-zinc-300"
              : "bg-sky-500 text-white hover:bg-sky-400",
          )}
        >
          {following ? "Following" : "Follow back"}
        </button>
      ) : item.thumbnailUrl ? (
        <span
          data-testid={`img-notification-thumbnail-${item.id}`}
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md"
        >
          <img
            src={item.thumbnailUrl}
            alt=""
            width={44}
            height={44}
            loading={prioritizeThumbnail ? "eager" : "lazy"}
            fetchPriority={prioritizeThumbnail ? "high" : "auto"}
            decoding="async"
            onError={(event) => event.currentTarget.parentElement?.remove()}
            className="block h-full w-full object-cover"
          />
        </span>
      ) : null}
      {item.canReshareMoment ? (
        <button
          type="button"
          disabled={resharePending}
          onClick={(event) => {
            event.stopPropagation();
            onAddToMoment();
          }}
          data-testid={`button-add-mentioned-moment-${item.momentId}`}
          className="h-8 shrink-0 whitespace-nowrap rounded-lg bg-gradient-to-r from-cyan-500 to-pink-500 px-2 text-[10px] font-semibold text-white disabled:opacity-60"
        >
          {resharePending ? "Adding…" : "Add to your moment"}
        </button>
      ) : null}
    </li>
  );
}

function NotificationAvatar({
  item,
  Icon,
}: {
  item: NotificationItem;
  Icon: LucideIcon;
}) {
  const urls = item.actorAvatarUrls?.length ? item.actorAvatarUrls.slice(0, 3) : [null];
  return (
    <span
      className={cn("relative h-12 shrink-0", urls.length > 1 ? "w-[4.25rem]" : "w-10")}
      aria-hidden="true"
    >
      {urls.map((url, index) => (
        <span
          key={`${item.id}-avatar-${index}`}
          className="absolute top-0.5 grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-800 text-xs font-semibold text-zinc-200"
          style={{ left: `${urls.length > 1 ? index * 14 : 0}px`, zIndex: index + 1 }}
        >
          {item.actorId ? (
            <UserRound className="h-[1.15rem] w-[1.15rem] text-zinc-400" strokeWidth={1.75} />
          ) : (
            <Icon className="h-4 w-4 text-zinc-400" />
          )}
          {url ? (
            <img
              src={url}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(event) => event.currentTarget.remove()}
              className="absolute inset-0 h-full w-full object-cover"
              data-testid={`img-notification-avatar-${item.id}-${index}`}
            />
          ) : null}
        </span>
      ))}
      {!item.read && (
        <span className="absolute right-1 top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-sky-400 ring-2 ring-zinc-950" />
      )}
    </span>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={`chip-notification-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-medium transition-colors active:scale-[0.98]",
        active
          ? "border border-white/[0.16] bg-white/[0.13] text-white"
          : "border border-white/[0.08] bg-white/[0.035] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200",
      )}
    >
      {label}
    </button>
  );
}
