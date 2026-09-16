import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Heart,
  MessageSquare,
  UserPlus,
  Globe2,
  Handshake,
  Sparkles,
  Mail,
  Megaphone,
  BadgeCheck,
  Coins,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrbitAppPrefs } from "@/lib/orbit-prefs";
import { STORAGE_BUCKETS } from "@/lib/storage-upload";
const liveDb = supabase as unknown as {
  from: (table: "likes" | "comments" | "posts" | "messages") => ReturnType<typeof supabase.from>;
};

export type NotificationKind =
  | "like"
  | "comment"
  | "follower"
  | "orbit"
  | "connection"
  | "match"
  | "message"
  | "channel"
  | "verification"
  | "monetization"
  | "system";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  actorId?: string;
  body?: string;
  /** epoch ms */
  at: number;
  read: boolean;
  /** in-app destination, optional */
  to?: string;
  /** Optional preview image for content notifications. */
  thumbnailUrl?: string | null;
};

export type KindMeta = {
  id: NotificationKind;
  label: string;
  emoji: string;
  icon: LucideIcon;
  /** tailwind-safe token classes only */
  tint: string;
};

export const NOTIFICATION_KINDS: KindMeta[] = [
  { id: "like", label: "Likes", emoji: "", icon: Heart, tint: "text-rose-400" },
  { id: "comment", label: "Comments", emoji: "", icon: MessageSquare, tint: "text-sky-400" },
  { id: "follower", label: "New Followers", emoji: "", icon: UserPlus, tint: "text-violet-400" },
  { id: "orbit", label: "Orbit", emoji: "", icon: Globe2, tint: "text-emerald-400" },
  { id: "connection", label: "Connections", emoji: "", icon: Handshake, tint: "text-teal-400" },
  { id: "match", label: "Matches", emoji: "", icon: Sparkles, tint: "text-pink-400" },
  { id: "message", label: "Messages", emoji: "", icon: Mail, tint: "text-blue-400" },
  { id: "channel", label: "Channel Updates", emoji: "", icon: Megaphone, tint: "text-orange-400" },
  { id: "verification", label: "Verification", emoji: "", icon: BadgeCheck, tint: "text-cyan-400" },
  { id: "monetization", label: "Monetization", emoji: "", icon: Coins, tint: "text-amber-400" },
  { id: "system", label: "System", emoji: "", icon: Bell, tint: "text-muted-foreground" },
];

/** Kinds suppressed by the "Hide Orbit notifications" privacy control. */
export const ORBIT_KINDS: NotificationKind[] = ["orbit", "connection", "match"];

export const kindMeta = (k: NotificationKind) =>
  NOTIFICATION_KINDS.find((m) => m.id === k) ?? NOTIFICATION_KINDS[NOTIFICATION_KINDS.length - 1];

export type NotificationPrefs = Record<NotificationKind, boolean>;

const defaultPrefs = Object.fromEntries(
  NOTIFICATION_KINDS.map((k) => [k.id, true]),
) as NotificationPrefs;

type Ctx = {
  items: NotificationItem[];
  unread: number;
  /** Unread excluding Orbit-only kinds (Orbit, Connections, Matches). */
  unreadHome: number;
  /** Unread across Orbit-only kinds. */
  unreadOrbit: number;
  unreadByKind: Record<NotificationKind, number>;
  prefs: NotificationPrefs;
  live: boolean;
  setLive: (v: boolean) => void;
  setPref: (k: NotificationKind, v: boolean) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

const ts = (v: string) => new Date(v).getTime();

/** Builds the whole notification feed from real database activity. */
async function fetchEvents(): Promise<Omit<NotificationItem, "read">[]> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return [];

  const { data: myPostRows } = await liveDb.from("posts").select("id,kind").eq("user_id", me);
  const myPosts = ((myPostRows ?? []) as { id: string; kind: string }[]).filter(
    (post) => post.kind !== "moment",
  );
  const postIds = myPosts.map((p) => p.id);

  const [
    likes,
    comments,
    dms,
    momentNotifications,
    orbitMsgs,
    orbitLikes,
    myOrbitLikes,
    requests,
    connections,
    chatSettings,
  ] =
    await Promise.all([
      postIds.length
        ? liveDb
            .from("likes")
            .select("id,post_id,user_id,created_at")
            .in("post_id", postIds)
            .neq("user_id", me)
            .order("created_at", { ascending: false })
            .limit(40)
        : Promise.resolve({ data: [] }),
      postIds.length
        ? liveDb
            .from("comments")
            .select("id,post_id,user_id,content,created_at")
            .in("post_id", postIds)
            .neq("user_id", me)
            .order("created_at", { ascending: false })
            .limit(40)
        : Promise.resolve({ data: [] }),
      supabase
        .from("messages" as never)
        .select("id,sender_id,receiver_id,content,media_url,voice_note_url,created_at" as never)
        .eq("receiver_id", me)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("notifications" as never)
        .select("id,actor_id,kind,title,body,entity_type,entity_id,metadata,read,created_at" as never)
        .eq("recipient_id", me)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("orbit_messages")
        .select("id,sender_id,kind,text,created_at")
        .eq("recipient_id", me)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("orbit_likes")
        .select("id,user_id,created_at")
        .eq("target_id", me)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("orbit_likes").select("target_id").eq("user_id", me),
      supabase
        .from("orbit_chat_requests")
        .select("id,requester_id,intro,status,created_at")
        .eq("addressee_id", me)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("orbit_connections")
        .select("id,requester_id,addressee_id,status,updated_at")
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
        .order("updated_at", { ascending: false })
        .limit(30),
      supabase
        .from("orbit_chat_settings")
        .select("peer_id,muted")
        .eq("user_id", me),
    ]);

  const mutedPeerIds = new Set(
    ((chatSettings.data ?? []) as { peer_id: string; muted: boolean }[])
      .filter((setting) => setting.muted)
      .map((setting) => setting.peer_id),
  );
  const rows = {
    likes: (likes.data ?? []) as { id: string; post_id: string; user_id: string; created_at: string }[],
    comments: (comments.data ?? []) as {
      id: string;
      post_id: string;
      user_id: string;
      content: string;
      created_at: string;
    }[],
    dms: ((dms.data ?? []) as unknown as {
      id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      media_url: string | null;
      voice_note_url: string | null;
      created_at: string;
    }[]).filter((message) => !mutedPeerIds.has(message.sender_id)),
    momentNotifications: (momentNotifications.data ?? []) as unknown as {
      id: string;
      actor_id: string | null;
      kind: string;
      title: string;
      body: string | null;
      entity_type: string | null;
      entity_id: string | null;
      metadata: Record<string, unknown> | null;
      read: boolean;
      created_at: string;
    }[],
    orbitMsgs: ((orbitMsgs.data ?? []) as {
      id: string;
      sender_id: string;
      kind: string;
      text: string | null;
      created_at: string;
    }[]).filter((message) => !mutedPeerIds.has(message.sender_id)),
    orbitLikes: (orbitLikes.data ?? []) as { id: string; user_id: string; created_at: string }[],
    requests: (requests.data ?? []) as {
      id: string;
      requester_id: string;
      intro: string | null;
      status: string;
      created_at: string;
    }[],
    connections: (connections.data ?? []) as {
      id: string;
      requester_id: string;
      addressee_id: string;
      status: string;
      updated_at: string;
    }[],
  };

  const likedByMe = new Set(
    ((myOrbitLikes.data ?? []) as { target_id: string }[]).map((r) => r.target_id),
  );

  const peerIds = [
    ...new Set([
      ...rows.likes.map((r) => r.user_id),
      ...rows.comments.map((r) => r.user_id),
      ...rows.dms.map((r) => r.sender_id),
      ...rows.momentNotifications.flatMap((r) => (r.actor_id ? [r.actor_id] : [])),
      ...rows.orbitMsgs.map((r) => r.sender_id),
      ...rows.orbitLikes.map((r) => r.user_id),
      ...rows.requests.map((r) => r.requester_id),
      ...rows.connections.map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id)),
    ]),
  ];

  const names: Record<string, string> = {};
  if (peerIds.length) {
    const { data } = await supabase.rpc("get_public_profiles", { ids: peerIds });
    for (const p of (data ?? []) as {
      id: string;
      username: string | null;
      display_name: string | null;
    }[]) {
      names[p.id] = p.display_name ?? p.username ?? "Someone";
    }
  }
  const nameOf = (id: string) => names[id] ?? "Someone";
  const postKind = new Map(myPosts.map((p) => [p.id, p.kind]));
  const contentLink = (id: string, kind: string | null | undefined, focusComments = false) => {
    const cleanId = id.trim();
    if (!cleanId) return undefined;
    const suffix = focusComments ? "?focusComments=true" : "";
    if (kind === "reel") {
      return `/reels?initialVideoId=${encodeURIComponent(cleanId)}${focusComments ? "&focusComments=true" : ""}`;
    }
    if (kind === "post" || kind === "video") return `/video/${encodeURIComponent(cleanId)}${suffix}`;
    if (kind === "moment") return `/moment/${encodeURIComponent(cleanId)}`;
    if (kind === "user" || kind === "profile") return `/u/${encodeURIComponent(cleanId)}`;
    return undefined;
  };
  const postLink = (id: string, focusComments = false) => contentLink(id, postKind.get(id), focusComments);
  const metadataId = (metadata: Record<string, unknown> | null, ...keys: string[]) => {
    for (const key of keys) {
      const value = metadata?.[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };
  const notificationLink = (notification: (typeof rows.momentNotifications)[number]) => {
    const type = notification.entity_type?.trim().toLowerCase() ?? "";
    const id = notification.entity_id?.trim() || metadataId(
      notification.metadata,
      "moment_id",
      "post_id",
      "video_id",
      "reel_id",
      "user_id",
      "profile_id",
    );
    if (notification.kind === "follower" || notification.kind === "follow") {
      const followerId = notification.actor_id?.trim() || (type === "user" || type === "profile" ? id : "");
      return followerId ? contentLink(followerId, "user") : undefined;
    }
    if (type === "moment") return id ? contentLink(id, "moment") : undefined;
    if (type === "post" || type === "video" || type === "reel") {
      return id ? contentLink(id, type, notification.kind === "comment") : undefined;
    }
    if (type === "user" || type === "profile") return id ? contentLink(id, type) : undefined;
    return undefined;
  };
  const momentIds = rows.momentNotifications
    .filter((n) => n.entity_type === "moment" && n.entity_id)
    .map((n) => n.entity_id as string);
  const momentMedia = new Map<string, string>();
  if (momentIds.length) {
    const { data: moments } = await liveDb
      .from("posts")
      .select("id,media_url,thumbnail_url")
      .in("id", [...new Set(momentIds)]);
    for (const moment of (moments ?? []) as Array<{
      id: string;
      media_url: string | null;
      thumbnail_url: string | null;
    }>) {
      const url = moment.thumbnail_url ?? moment.media_url;
      if (url) momentMedia.set(moment.id, url);
    }
    const paths = [...new Set([...momentMedia.values()])].filter(
      (url) => !/^(https?:|data:|blob:)/.test(url),
    );
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from(STORAGE_BUCKETS.moments)
        .createSignedUrls(paths, 60 * 60 * 6);
      const signedByPath = new Map(
        (signed ?? [])
          .filter((item) => item.signedUrl && item.path)
          .map((item) => [item.path as string, item.signedUrl as string]),
      );
      for (const [id, url] of momentMedia) {
        momentMedia.set(id, signedByPath.get(url) ?? url);
      }
    }
  }

  const out: Omit<NotificationItem, "read">[] = [];

  for (const r of rows.likes)
    out.push({
      id: `like-${r.id}`,
      kind: "like",
      title: `${nameOf(r.user_id)} liked your post`,
      actorId: r.user_id,
      at: ts(r.created_at),
      to: postLink(r.post_id),
    });

  for (const r of rows.comments)
    out.push({
      id: `comment-${r.id}`,
      kind: "comment",
      title: `${nameOf(r.user_id)} commented on your post`,
      actorId: r.user_id,
      body: r.content,
      at: ts(r.created_at),
      to: postLink(r.post_id, true),
    });

  for (const r of rows.dms)
    out.push({
      id: `dm-${r.id}`,
      kind: "message",
      title: `New message from ${nameOf(r.sender_id)}`,
      actorId: r.sender_id,
      body: r.voice_note_url ? "Sent a voice note" : r.media_url ? "Sent an attachment" : r.content,
      at: ts(r.created_at),
      to: `/chat/dm_${[r.sender_id, r.receiver_id].sort().join("_")}`,
    });

  for (const r of rows.momentNotifications)
    out.push({
      id: `notification-${r.id}`,
      kind: r.kind === "like" ? "like" : "system",
      title:
        r.entity_type === "moment" && r.actor_id
          ? `${nameOf(r.actor_id)} liked your Moment`
          : r.title,
      actorId: r.actor_id ?? undefined,
      body: r.body ?? undefined,
      at: ts(r.created_at),
      to: notificationLink(r),
      thumbnailUrl:
        r.entity_type === "moment" && r.entity_id ? momentMedia.get(r.entity_id) ?? null : null,
    });

  for (const r of rows.orbitMsgs)
    out.push({
      id: `om-${r.id}`,
      kind: "message",
      title: `Orbit message from ${nameOf(r.sender_id)}`,
      actorId: r.sender_id,
      body: r.kind === "text" ? (r.text ?? "") : "Sent an attachment",
      at: ts(r.created_at),
      to: `/orbit/chat/${r.sender_id}`,
    });

  for (const r of rows.orbitLikes) {
    const mutual = likedByMe.has(r.user_id);
    out.push({
      id: `olike-${r.id}`,
      kind: mutual ? "match" : "orbit",
      title: mutual
        ? `You matched with ${nameOf(r.user_id)}`
        : `${nameOf(r.user_id)} liked your Orbit profile`,
      actorId: r.user_id,
      at: ts(r.created_at),
      to: mutual ? `/orbit/chat/${r.user_id}` : "/orbit/messages",
    });
  }

  for (const r of rows.requests)
    out.push({
      id: `req-${r.id}`,
      kind: "connection",
      title:
        r.status === "accepted"
          ? `You accepted ${nameOf(r.requester_id)}'s chat request`
          : `${nameOf(r.requester_id)} sent you a chat request`,
      actorId: r.requester_id,
      body: r.intro ?? undefined,
      at: ts(r.created_at),
      to: "/orbit/messages",
    });

  for (const r of rows.connections) {
    if (r.status !== "accepted") continue;
    const peer = r.requester_id === me ? r.addressee_id : r.requester_id;
    out.push({
      id: `conn-${r.id}`,
      kind: "connection",
      title: `You and ${nameOf(peer)} are connected`,
      actorId: peer,
      at: ts(r.updated_at),
      to: `/orbit/chat/${peer}`,
    });
  }

  return out.sort((a, b) => b.at - a.at).slice(0, 120);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Omit<NotificationItem, "read">[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [live, setLive] = useState(true);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const { hideOrbitNotifications } = useOrbitAppPrefs();

  const load = useCallback(async () => {
    try {
      setEvents(await fetchEvents());
    } catch (error) {
      console.error("Unable to load notifications", error);
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // Live updates straight from the database.
  useEffect(() => {
    if (!live) return;
    // The feed is rebuilt with ~12 queries, so coalesce bursts (e.g. a chat
    // conversation) into a single refresh instead of one per row change. The
    // status callback retries transient Realtime failures; polling is still
    // available through the visibility/online resync handlers below.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const reload = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void load(), 350);
    };
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const subscribe = () => {
      if (!alive) return;
      channel = supabase
        .channel(`yw-notifications-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, reload)
        .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, reload)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, reload)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, reload)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void load();
            return;
          }
          if (!["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status) || !alive || retry) return;
          retry = setTimeout(() => {
            retry = null;
            if (channel) void supabase.removeChannel(channel);
            channel = null;
            subscribe();
          }, 1500);
        });
    };
    subscribe();
    const resyncOnVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const resyncOnOnline = () => void load();
    document.addEventListener("visibilitychange", resyncOnVisible);
    window.addEventListener("online", resyncOnOnline);
    return () => {
      if (timer) clearTimeout(timer);
      alive = false;
      if (retry) clearTimeout(retry);
      document.removeEventListener("visibilitychange", resyncOnVisible);
      window.removeEventListener("online", resyncOnOnline);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [live, load]);

  const setPref = useCallback((k: NotificationKind, v: boolean) => {
    setPrefs((p) => ({ ...p, [k]: v }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const read = new Set(readIds);
    const removed = new Set(removedIds);
    const visible = events
      .filter((i) => !removed.has(i.id))
      .filter((i) => prefs[i.kind] && !(hideOrbitNotifications && ORBIT_KINDS.includes(i.kind)))
      .map((i) => ({ ...i, read: read.has(i.id) }));

    const unreadByKind = Object.fromEntries(
      NOTIFICATION_KINDS.map((k) => [k.id, visible.filter((i) => i.kind === k.id && !i.read).length]),
    ) as Record<NotificationKind, number>;

    return {
      items: visible,
      unread: visible.filter((i) => !i.read).length,
      unreadHome: visible.filter((i) => !i.read && !ORBIT_KINDS.includes(i.kind)).length,
      unreadOrbit: visible.filter((i) => !i.read && ORBIT_KINDS.includes(i.kind)).length,
      unreadByKind,
      prefs,
      live,
      setLive,
      setPref,
      markRead: (id) => setReadIds((p) => (p.includes(id) ? p : [id, ...p])),
      markAllRead: () => setReadIds((p) => [...new Set([...events.map((e) => e.id), ...p])]),
      remove: (id) => setRemovedIds((p) => (p.includes(id) ? p : [id, ...p])),
      clearAll: () => setRemovedIds((p) => [...new Set([...events.map((e) => e.id), ...p])]),
    };
  }, [events, prefs, live, setPref, hideOrbitNotifications, readIds, removedIds]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}

export function timeAgo(at: number) {
  const s = Math.max(1, Math.round((Date.now() - at) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
