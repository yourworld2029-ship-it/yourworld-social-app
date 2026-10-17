import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { markAlertsSeen } from "@/lib/alerts-count";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  Radio,
  Settings2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  NOTIFICATION_KINDS,
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

type Filter = "all" | "following" | "comments" | "mentions";
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
    unread,
    prefs,
    live,
    setLive,
    setPref,
    markRead,
    markAllRead,
    remove,
  } =
    useNotifications();
  const { following, toggleFollow } = useYw();
  const { moments, addMoment } = useMoments();
  const [filter, setFilter] = useState<Filter>("all");
  const [tuning, setTuning] = useState(false);
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
  const homeKinds = useMemo(
    () => NOTIFICATION_KINDS.filter((k) => k.id !== "message"),
    [],
  );

  const list = useMemo(() => {
    const filtered = items.filter((item) => {
      if (filter === "all") return true;
      if (filter === "following") return Boolean(item.actorId && following[item.actorId]);
      if (filter === "comments") return item.kind === "comment";
      return item.kind === "mention";
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
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-zinc-950/90 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 pb-2 pt-[max(env(safe-area-inset-top,0px),3rem)]">
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
            <p className="text-[11px] text-zinc-500">
              {unread > 0 ? `${unread} new` : "You’re all caught up"}
            </p>
          </div>
          <button
            onClick={() => setTuning((value) => !value)}
            aria-label="Notification preferences"
            aria-expanded={tuning}
            data-testid="button-notification-settings"
            className={cn(
              "ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors active:scale-90",
              tuning ? "bg-white/[0.09] text-white" : "text-zinc-400 hover:bg-white/[0.06]",
            )}
          >
            <Settings2 className="h-[19px] w-[19px]" strokeWidth={1.8} />
          </button>
        </div>

        <div className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto px-4 pb-3 pt-2">
          <Chip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
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
            label="Mentions"
          />
        </div>
      </header>

      {tuning && (
        <section aria-label="Notification settings" className="px-4 pt-4">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-zinc-300">
                <Radio className={cn("h-4 w-4", live && "text-sky-300")} />
              </span>
              <span>
                <span className="block text-sm font-medium">Live updates</span>
                <span className="block text-xs text-zinc-500">Refresh activity in real time</span>
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={live}
              aria-label="Toggle real-time updates"
              data-testid="switch-notification-live"
              onClick={() => setLive(!live)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                live ? "bg-sky-500" : "bg-zinc-700",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  live ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            data-testid="button-mark-all-notifications-read"
            className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-zinc-300">
              <CheckCheck className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">Mark all as read</span>
          </button>
          <ul className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.035]">
            {homeKinds.map((k) => (
              <li
                key={k.id}
                className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 last:border-0"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.07] text-zinc-300">
                  <k.icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">{k.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[k.id]}
                  aria-label={`${k.label} notifications`}
                  data-testid={`switch-notification-${k.id}`}
                  onClick={() => setPref(k.id, !prefs[k.id])}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    prefs[k.id] ? "bg-sky-500" : "bg-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      prefs[k.id] ? "translate-x-[22px]" : "translate-x-0.5",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Activity" className="px-4 pt-3">
        {list.length === 0 ? (
          <div className="mx-auto flex max-w-sm flex-col items-center px-5 py-20 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-500">
              {filter === "mentions" ? <Bell className="h-6 w-6" /> : <CheckCheck className="h-6 w-6" />}
            </span>
            <h2 className="text-sm font-semibold text-zinc-200">
              {filter === "comments"
                ? "No comments yet"
                : filter === "mentions"
                  ? "No mentions yet"
                  : filter === "following"
                    ? "No recent activity from people you follow"
                    : "You’re all caught up"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              New likes, comments, mentions and followers will appear here.
            </p>
          </div>
        ) : (
        <div className="space-y-7">
            {groupedItems.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {group.label}
                </h2>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      following={Boolean(item.actorId && following[item.actorId])}
                      onOpen={() => {
                        markRead(item.id);
                        if (item.to) navigate({ to: item.to });
                      }}
                      onDismiss={() => remove(item.id)}
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
  following,
  onOpen,
  onDismiss,
  onAddToMoment,
  resharePending,
  onToggleFollow,
}: {
  item: NotificationItem;
  following: boolean;
  onOpen: () => void;
  onDismiss: () => void;
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
        "group flex min-h-[76px] items-center gap-2.5 rounded-2xl border border-white/[0.055] bg-white/[0.02] px-3 py-3 transition-colors hover:bg-white/[0.045]",
        !item.read && "border-fuchsia-300/15 bg-fuchsia-400/[0.045]",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        data-testid={`button-open-notification-${item.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 text-left"
      >
        <NotificationAvatar item={item} Icon={Icon} />
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span className="min-w-0 flex-1 text-[13px] leading-[1.35] text-zinc-300">
              {item.actorName && item.activity ? (
                <>
                  <span className="font-semibold text-white">{item.actorName}</span>
                  {item.actorId ? <SportsIdentityMark userId={item.actorId} /> : null}{" "}
                  <span className="text-zinc-300">{item.activity}</span>
                </>
              ) : (
                <span className={cn("font-medium", !item.read && "text-white")}>{item.title}</span>
              )}
            </span>
            <span className="shrink-0 pt-0.5 text-[10px] text-zinc-500">{timeAgo(item.at)}</span>
          </span>
          {item.body && (
            <span className="mt-1 block truncate text-xs leading-relaxed text-zinc-500">
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
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]"
        >
          <img
            src={item.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(event) => event.currentTarget.remove()}
            className="h-full w-full object-cover"
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
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        data-testid={`button-dismiss-notification-${item.id}`}
        className="grid h-8 w-7 shrink-0 place-items-center rounded-full text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
      >
        <X className="h-4 w-4" strokeWidth={1.8} />
      </button>
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
      className={cn("relative h-12 shrink-0", urls.length > 1 ? "w-[4.25rem]" : "w-11")}
      aria-hidden="true"
    >
      {urls.map((url, index) => (
        <span
          key={`${item.id}-avatar-${index}`}
          className="absolute top-0.5 grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-800 text-xs font-semibold text-zinc-200"
          style={{ left: `${urls.length > 1 ? index * 16 : 0}px`, zIndex: index + 1 }}
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
        "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold tracking-[0.01em] transition-all duration-200 active:scale-[0.98]",
        active
          ? "border border-transparent bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-[0_4px_16px_rgba(168,85,247,0.22)]"
          : "border border-white/[0.08] bg-white/[0.035] text-zinc-400 hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-zinc-200",
      )}
    >
      {label}
    </button>
  );
}
