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
  Mail,
  Megaphone,
  BadgeCheck,
  Coins,
  Bell,
  AtSign,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKETS } from "@/lib/storage-upload";
import { resolveMediaUrl } from "@/lib/social-data";
const liveDb = supabase as unknown as {
  from: (table: "likes" | "comments" | "posts" | "messages" | "moments") => ReturnType<typeof supabase.from>;
};

export type NotificationKind =
  | "like"
  | "comment"
  | "mention"
  | "follower"
  | "message"
  | "collaboration"
  | "channel"
  | "verification"
  | "monetization"
  | "system";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  actorId?: string;
  actorName?: string;
  activity?: string;
  actorAvatarUrls?: Array<string | null>;
  body?: string;
  /** epoch ms */
  at: number;
  read: boolean;
  /** in-app destination, optional */
  to?: string;
  /** Optional preview image for content notifications. */
  thumbnailUrl?: string | null;
  /** Source comment ID for inline comment actions. */
  commentId?: string;
  /** Video source used to generate a real preview when no usable cover exists. */
  previewMediaUrl?: string | null;
  /** Cloudflare Stream UID used to load the video's real thumbnail. */
  previewStreamId?: string | null;
  previewBucket?: "reels" | "videos" | "thumbnails";
  /** Reshare action supplied by a Moment mention notification. */
  canReshareMoment?: boolean;
  momentId?: string;
  collaborationInvite?: {
    inviteId: string;
    postId: string;
    status: "pending" | "accepted" | "declined" | "removed";
  };
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
  { id: "mention", label: "Mentions", emoji: "", icon: AtSign, tint: "text-violet-400" },
  { id: "follower", label: "New Followers", emoji: "", icon: UserPlus, tint: "text-violet-400" },
  { id: "message", label: "Messages", emoji: "", icon: Mail, tint: "text-blue-400" },
  { id: "collaboration", label: "Collaborations", emoji: "", icon: UserPlus, tint: "text-violet-400" },
  { id: "channel", label: "Channel Updates", emoji: "", icon: Megaphone, tint: "text-orange-400" },
  { id: "verification", label: "Verification", emoji: "", icon: BadgeCheck, tint: "text-cyan-400" },
  { id: "monetization", label: "Monetization", emoji: "", icon: Coins, tint: "text-amber-400" },
  { id: "system", label: "System", emoji: "", icon: Bell, tint: "text-muted-foreground" },
];

export const kindMeta = (k: NotificationKind) =>
  NOTIFICATION_KINDS.find((m) => m.id === k) ?? NOTIFICATION_KINDS[NOTIFICATION_KINDS.length - 1];

export type NotificationPrefs = Record<NotificationKind, boolean>;

const defaultPrefs = Object.fromEntries(
  NOTIFICATION_KINDS.map((k) => [k.id, true]),
) as NotificationPrefs;

type Ctx = {
  items: NotificationItem[];
  unread: number;
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

function normalizeNotificationKind(value: string): NotificationKind {
  const kind = value.trim().toLowerCase();
  if (kind === "follow") return "follower";
  if (
    kind === "like" ||
    kind === "comment" ||
    kind === "mention" ||
    kind === "follower" ||
    kind === "message" ||
    kind === "collaboration" ||
    kind === "channel" ||
    kind === "verification" ||
    kind === "monetization"
  ) {
    return kind;
  }
  return "system";
}

/** Builds the whole notification feed from real database activity. */
async function fetchEvents(): Promise<Omit<NotificationItem, "read">[]> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return [];

  const { data: myPostRows } = await liveDb
    .from("posts")
    .select("id,kind,thumbnail_url,media_url,video_url,media_type,cloudflare_stream_uid,cloudflare_stream_id")
    .eq("user_id", me);
  const myPosts = ((myPostRows ?? []) as {
    id: string;
    kind: string;
    thumbnail_url?: string | null;
    media_url?: string | null;
    video_url?: string | null;
    media_type?: string | null;
    cloudflare_stream_uid?: string | null;
    cloudflare_stream_id?: string | null;
  }[]).filter(
    (post) => post.kind !== "moment",
  );
  const postIds = myPosts.map((p) => p.id);

  const [
    likes,
    comments,
    dms,
    momentNotifications,
    conversationPreferences,
    userBlocks,
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
        .select("id,sender_id,receiver_id,conversation_id,content,media_url,voice_note_url,metadata,created_at" as never)
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
        .from("conversation_preferences" as never)
        .select("conversation_id,is_muted" as never)
        .eq("user_id" as never, me),
      supabase
        .from("user_blocks" as never)
        .select("blocked_id" as never)
        .eq("blocker_id" as never, me),
    ]);

  const mutedConversationIds = new Set(
    ((conversationPreferences.data ?? []) as unknown as {
      conversation_id: string;
      is_muted: boolean;
    }[])
      .filter((setting) => setting.is_muted)
      .map((setting) => setting.conversation_id),
  );
  const blockedPeerIds = new Set(
    ((userBlocks.data ?? []) as unknown as { blocked_id: string }[])
      .map((block) => block.blocked_id),
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
      conversation_id: string | null;
      content: string;
      media_url: string | null;
      voice_note_url: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }[]).filter((message) =>
      message.metadata?.source !== "moment_mention" &&
      message.metadata?.type !== "moment_mention" &&
      !blockedPeerIds.has(message.sender_id) &&
      !mutedConversationIds.has(message.conversation_id ?? ""),
    ),
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
  };

  const peerIds = [
    ...new Set([
      ...rows.likes.map((r) => r.user_id),
      ...rows.comments.map((r) => r.user_id),
      ...rows.dms.map((r) => r.sender_id),
      ...rows.momentNotifications.flatMap((r) => (r.actor_id ? [r.actor_id] : [])),
    ]),
  ];

  const people: Record<string, { name: string; avatarUrl: string | null }> = {};
  if (peerIds.length) {
    const { data, error } = await supabase.rpc("get_public_profiles", { ids: peerIds });
    if (error) {
      console.warn("Could not load notification actor profiles.", error);
    }
    for (const p of (data ?? []) as {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url?: string | null;
      profile_pic?: string | null;
      profile_image?: string | null;
    }[]) {
      const avatarUrl = [p.avatar_url, p.profile_pic, p.profile_image]
        .map((value) => value?.trim())
        .find(Boolean) ?? null;
      people[p.id] = {
        name: p.display_name ?? p.username ?? "Someone",
        avatarUrl,
      };
    }
    await Promise.all(
      Object.values(people).map(async (person) => {
        if (!person.avatarUrl) return;
        try {
          person.avatarUrl = await resolveMediaUrl(person.avatarUrl, STORAGE_BUCKETS.avatars);
        } catch {
          // Keep the original URL so the image element can try it directly.
        }
      }),
    );
  }
  const nameOf = (id: string) => people[id]?.name ?? "Someone";
  const avatarOf = (id: string) => people[id]?.avatarUrl ?? null;
  const postKind = new Map(myPosts.map((p) => [p.id, p.kind]));
  const previewPostIds = new Set([
    ...rows.likes.map((row) => row.post_id),
    ...rows.comments.map((row) => row.post_id),
    ...rows.momentNotifications.flatMap((notification) => {
      const entityType = notification.entity_type?.trim().toLowerCase() ?? "";
      if (
        ["post", "video", "reel"].includes(entityType) &&
        notification.entity_id
      ) {
        return [notification.entity_id];
      }
      const metadata = notification.metadata ?? {};
      for (const key of ["post_id", "video_id", "reel_id"]) {
        const value = metadata[key];
        if (typeof value === "string" && value.trim()) return [value.trim()];
      }
      return [];
    }),
  ]);
  const postThumbnails = new Map<string, string>();
  const postPreviewMedia = new Map<string, string>();
  const postPreviewStreamIds = new Map<string, string>();
  const postPreviewBuckets = new Map<string, "reels" | "videos">();
  await Promise.all(myPosts.filter((post) => previewPostIds.has(post.id)).map(async (post) => {
    const bucket = post.kind === "reel" ? "reels" : "videos";
    const normalizeStorageReference = (value: string, fallbackBucket: string) => {
      const clean = value.trim();
      const match = clean.match(/^(videos|reels|thumbnails)\/(.+)$/);
      return match
        ? { path: match[2], bucket: match[1] }
        : { path: clean, bucket: fallbackBucket };
    };
    const isVideo =
      post.kind === "reel" ||
      post.kind === "video" ||
      post.media_type?.toLowerCase().startsWith("video") === true;
    const streamId = post.cloudflare_stream_id ?? post.cloudflare_stream_uid;
    if (isVideo && streamId?.trim()) {
      postPreviewStreamIds.set(post.id, streamId.trim());
    }
    const imageOnlyMedia = post.media_type?.toLowerCase().startsWith("image")
      ? post.media_url
      : null;
    const source = post.thumbnail_url ?? imageOnlyMedia;
    const previewSource = isVideo
      ? post.video_url?.trim() || post.media_url?.trim()
      : null;
    if (source) {
      try {
        const reference = normalizeStorageReference(source, bucket);
        const resolved = await resolveMediaUrl(reference.path, reference.bucket);
        if (resolved) postThumbnails.set(post.id, resolved);
      } catch {
        postThumbnails.set(post.id, source);
      }
    }
    if (previewSource) {
      const remote = /^(https?:|blob:|data:)/i.test(previewSource);
      const reference = normalizeStorageReference(previewSource, bucket);
      postPreviewMedia.set(post.id, remote ? previewSource : reference.path);
      postPreviewBuckets.set(post.id, reference.bucket as "reels" | "videos");
    }
  }));
  const postPreviewFor = (postId: string) => ({
    thumbnailUrl: postThumbnails.get(postId) ?? null,
    previewMediaUrl: postPreviewMedia.get(postId) ?? null,
    previewStreamId: postPreviewStreamIds.get(postId) ?? null,
    previewBucket: postPreviewBuckets.get(postId),
  });
  const contentLink = (
    id: string,
    kind: string | null | undefined,
    focusComments = false,
    commentId?: string,
  ) => {
    const cleanId = id.trim();
    if (!cleanId) return undefined;
    const search = new URLSearchParams();
    if (focusComments) search.set("focusComments", "true");
    if (commentId?.trim()) search.set("commentId", commentId.trim());
    if (kind === "reel") {
      search.set("initialVideoId", cleanId);
      return `/reels?${search.toString()}`;
    }
    const query = search.toString();
    const suffix = query ? `?${query}` : "";
    if (kind === "post" || kind === "video") return `/video/${encodeURIComponent(cleanId)}${suffix}`;
    if (kind === "moment") return `/moment/${encodeURIComponent(cleanId)}`;
    if (kind === "user" || kind === "profile") return `/u/${encodeURIComponent(cleanId)}`;
    return undefined;
  };
  const postLink = (id: string, focusComments = false, commentId?: string) =>
    contentLink(id, postKind.get(id), focusComments, commentId);
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
    const metadataCommentId = metadataId(
      notification.metadata,
      "comment_id",
      "target_comment_id",
    );
    if (type === "comment") {
      const commentId = id || metadataCommentId;
      const postId =
        metadataId(notification.metadata, "post_id", "video_id", "reel_id") ||
        rows.comments.find((comment) => comment.id === commentId)?.post_id ||
        "";
      const contentKind =
        metadataId(notification.metadata, "content_kind", "post_kind", "media_kind") ||
        (metadataId(notification.metadata, "reel_id") ? "reel" : "") ||
        (metadataId(notification.metadata, "video_id") ? "video" : "") ||
        postKind.get(postId);
      return postId
        ? contentLink(postId, contentKind, true, commentId || undefined)
        : undefined;
    }
    if (type === "moment") return id ? contentLink(id, "moment") : undefined;
    if (type === "post" || type === "video" || type === "reel") {
      const commentId =
        metadataCommentId ||
        metadataId(notification.metadata, "target_id");
      return id
        ? contentLink(
            id,
            type,
            notification.kind === "comment" || (notification.kind === "mention" && !!commentId),
            commentId || undefined,
          )
        : undefined;
    }
    if (type === "user" || type === "profile") return id ? contentLink(id, type) : undefined;
    return undefined;
  };
  const momentIds = rows.momentNotifications
    .filter((n) => n.entity_type === "moment" && n.entity_id)
    .map((n) => n.entity_id as string);
  const momentMedia = new Map<string, string>();
  const momentVideoMedia = new Map<string, string>();
  if (momentIds.length) {
    const { data: dedicatedMoments } = await liveDb
      .from("moments")
      .select("id,media_url,media_type")
      .in("id", [...new Set(momentIds)]);
    for (const moment of (dedicatedMoments ?? []) as Array<{
      id: string;
      media_url: string | null;
      media_type: string | null;
    }>) {
      if (moment.media_url) {
        momentMedia.set(moment.id, moment.media_url);
        if (moment.media_type?.toLowerCase().startsWith("video")) {
          momentVideoMedia.set(moment.id, moment.media_url);
        }
      }
    }
    const { data: moments } = await liveDb
      .from("posts")
      .select("id,media_url,thumbnail_url,media_type")
      .in("id", [...new Set(momentIds)]);
    for (const moment of (moments ?? []) as Array<{
      id: string;
      media_url: string | null;
      thumbnail_url: string | null;
      media_type: string | null;
    }>) {
      if (!momentMedia.has(moment.id)) {
        const url = moment.thumbnail_url ?? moment.media_url;
        if (url) momentMedia.set(moment.id, url);
      }
      if (
        !momentVideoMedia.has(moment.id) &&
        moment.media_url &&
        moment.media_type?.toLowerCase().startsWith("video")
      ) {
        momentVideoMedia.set(moment.id, moment.media_url);
      }
    }
    const paths = [...new Set([...momentMedia.values(), ...momentVideoMedia.values()])].filter(
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
      for (const [id, url] of momentVideoMedia) {
        momentVideoMedia.set(id, signedByPath.get(url) ?? url);
      }
    }
  }

  const out: Omit<NotificationItem, "read">[] = [];

  const likesByPost = new Map<string, typeof rows.likes>();
  for (const row of rows.likes) {
    const group = likesByPost.get(row.post_id) ?? [];
    group.push(row);
    likesByPost.set(row.post_id, group);
  }

  for (const [postId, group] of likesByPost) {
    const latest = group.reduce((newest, row) =>
      ts(row.created_at) > ts(newest.created_at) ? row : newest,
    );
    const actorName = nameOf(latest.user_id);
    const otherCount = group.length - 1;
    const contentLabel = postKind.get(postId) === "reel"
      ? "reel"
      : postKind.get(postId) === "video"
        ? "video"
        : "post";
    const activity = otherCount
      ? `and ${otherCount} ${otherCount === 1 ? "other" : "others"} liked your ${contentLabel}`
      : `liked your ${contentLabel}`;
    out.push({
      id: `likes-${postId}-${ts(latest.created_at)}`,
      kind: "like",
      title: `${actorName} ${activity}`,
      actorId: latest.user_id,
      actorName,
      activity,
      actorAvatarUrls: group.slice(0, 3).map((row) => avatarOf(row.user_id)),
      at: ts(latest.created_at),
      to: postLink(postId),
      ...postPreviewFor(postId),
    });
  }

  for (const r of rows.comments)
  {
    const actorName = nameOf(r.user_id);
    const contentLabel = postKind.get(r.post_id) === "reel"
      ? "your reel"
      : postKind.get(r.post_id) === "video"
        ? "your video"
        : "your post";
    out.push({
      id: `comment-${r.id}`,
      kind: "comment",
      title: `${actorName} commented on ${contentLabel}`,
      actorId: r.user_id,
      actorName,
      activity: `commented on ${contentLabel}`,
      actorAvatarUrls: [avatarOf(r.user_id)],
      body: r.content,
      at: ts(r.created_at),
      commentId: r.id,
      to: postLink(r.post_id, true, r.id),
      ...postPreviewFor(r.post_id),
    });
  }

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

  for (const r of rows.momentNotifications) {
    const kind = normalizeNotificationKind(r.kind);
    const entityType = r.entity_type?.trim().toLowerCase() ?? "";
    const collaborationInviteId = kind === "collaboration"
      ? metadataId(r.metadata, "invite_id")
      : "";
    const collaborationPostId = kind === "collaboration"
      ? metadataId(r.metadata, "post_id") || r.entity_id || ""
      : "";
    const collaborationStatus = metadataId(r.metadata, "status");
    const collaborationPreview = kind === "collaboration" &&
      r.metadata?.source === "reel_collaboration_invite";
    const momentId =
      entityType === "moment"
        ? r.entity_id ?? metadataId(r.metadata, "moment_id")
        : metadataId(r.metadata, "moment_id");
    const isMomentMention =
      kind === "mention" &&
      r.metadata?.source === "moment_mention" &&
      !!momentId;
    if (isMomentMention) continue;
    const contentId =
      ["post", "video", "reel"].includes(entityType) && r.entity_id
        ? r.entity_id
        : metadataId(r.metadata, "post_id", "video_id", "reel_id");
    const commentId = metadataId(r.metadata, "comment_id", "target_comment_id") ||
      (entityType === "comment" ? r.entity_id ?? "" : "");
    const duplicateLike =
      kind === "like" &&
      entityType !== "moment" &&
      rows.likes.some((like) => {
        const likeId = metadataId(r.metadata, "like_id", "interaction_id");
        return (
          (likeId && like.id === likeId) ||
          (!!contentId &&
            like.post_id === contentId &&
            r.actor_id === like.user_id &&
            Math.abs(ts(like.created_at) - ts(r.created_at)) < 120_000)
        );
      });
    const duplicateComment =
      kind === "comment" &&
      !!commentId &&
      rows.comments.some((comment) => comment.id === commentId);
    if (
      duplicateLike ||
      duplicateComment
    ) {
      continue;
    }
    const actorName = r.actor_id ? nameOf(r.actor_id) : undefined;
    const activity = isMomentMention
      ? undefined
      : kind === "follower"
        ? "started following you"
        : kind === "mention"
          ? "mentioned you"
          : kind === "like" && entityType === "moment"
            ? "liked your Moment"
            : undefined;
    out.push({
      id: `notification-${r.id}`,
      kind,
      title:
        isMomentMention
          ? r.body ?? r.title
          : activity && actorName
          ? `${actorName} ${activity}`
          : r.title,
      actorName,
      activity,
      actorId: r.actor_id ?? undefined,
      actorAvatarUrls: r.actor_id ? [avatarOf(r.actor_id)] : undefined,
      body: isMomentMention ? undefined : r.body ?? undefined,
      at: ts(r.created_at),
      commentId: kind === "comment" ? commentId || undefined : undefined,
      to: notificationLink(r),
      canReshareMoment: isMomentMention,
      momentId: isMomentMention ? momentId : undefined,
      thumbnailUrl:
        entityType === "moment" && r.entity_id
          ? momentMedia.get(r.entity_id) ?? null
          : contentId
            ? postThumbnails.get(contentId) ?? null
            : null,
      previewMediaUrl:
        entityType === "moment" && r.entity_id
          ? momentVideoMedia.get(r.entity_id) ?? null
          : contentId
            ? postPreviewMedia.get(contentId) ?? null
            : null,
      previewStreamId: collaborationPreview
        ? metadataId(r.metadata, "stream_id") || null
        : contentId
          ? postPreviewStreamIds.get(contentId) ?? null
          : null,
      previewBucket: collaborationPreview
        ? "reels"
        : contentId
          ? postPreviewBuckets.get(contentId)
          : undefined,
      ...(collaborationPreview && collaborationInviteId && collaborationPostId
        ? {
            collaborationInvite: {
              inviteId: collaborationInviteId,
              postId: collaborationPostId,
              status:
                collaborationStatus === "accepted" ||
                collaborationStatus === "declined" ||
                collaborationStatus === "removed"
                  ? collaborationStatus
                  : "pending",
            },
            thumbnailUrl: metadataId(r.metadata, "thumbnail_url") || null,
            previewMediaUrl: metadataId(r.metadata, "media_url") || null,
          }
        : {}),
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
    // The feed is rebuilt with several queries, so coalesce bursts (e.g. a chat
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
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, reload)
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
      .filter((i) => prefs[i.kind])
      .map((i) => ({ ...i, read: read.has(i.id) }));

    const unreadByKind = Object.fromEntries(
      NOTIFICATION_KINDS.map((k) => [k.id, visible.filter((i) => i.kind === k.id && !i.read).length]),
    ) as Record<NotificationKind, number>;

    return {
      items: visible,
      unread: visible.filter((i) => !i.read).length,
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
  }, [events, prefs, live, setPref, readIds, removedIds]);

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
