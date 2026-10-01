import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MomentContext } from "@/lib/moment-context";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKETS, uploadWithProgress } from "@/lib/storage-upload";
import type { ProgressFn } from "@/lib/storage-upload";
import { isAuthSessionMissing } from "@/lib/auth-errors";
import { missingTable, writeCompat } from "@/lib/supabase-compat";
import { getRegisteredBlob } from "@/lib/blob-registry";
import { dmThreadId, ensureThreadConversation, resolveMediaUrl } from "@/lib/social-data";
import {
  normalizeAutoDeleteSetting,
} from "@/lib/auto-delete";
import { optimizeVideoBlob } from "@/lib/video-compression";
import { registerUniqueView } from "@/lib/unique-views";


export type MomentKind = "photo" | "video" | "text";
export type MomentPrivacy = "everyone" | "followers" | "close" | "onlyme";
export type MomentEffect = "none" | "boomerang" | "slowmo" | "reverse" | "greenscreen";
export type AiTool = "beauty" | "filter" | "background" | "cartoon" | "eraser";

export type Sticker = {
  id: string;
  /** emoji glyph or image url */
  content: string;
  type: "emoji" | "gif" | "text";
  x: number; // 0..1
  y: number; // 0..1
  scale: number;
  /** degrees */
  rotation?: number;
  color?: string;
};

export type MomentPoll = {
  question: string;
  options: [string, string];
  votes: [number, number];
  myVote: 0 | 1 | null;
};

export type MomentReply = { id: string; userId: string; text: string; at: number };

export type MomentViewer = { userId: string; at: number; liked: boolean; screenshot: boolean };

export type MomentAuthor = { id: string; name: string; username: string; avatar: string | null };


export type MyMoment = {
  id: string;
  kind: MomentKind;
  /** object url or data url; empty for text moments */
  media: string;
  mediaType?: string;
  text: string;
  textBg: string;
  music?: string;
  musicTitle?: string;
  musicArtist?: string;
  /** real playable audio source picked in the editor */
  musicUrl?: string;
  /** trim window inside the audio file (seconds) */
  musicStart?: number;
  audioStartTime?: number;
  musicEnd?: number;
  musicVolume?: number;
  stickers: Sticker[];
  /** transparent PNG data url from the drawing tool */
  drawing?: string;
  /** seconds, video moments only */
  trim?: { start: number; end: number };
  /** preview crop / zoom framing captured in the editor */
  crop?: {
    zoom: number;
    x: number;
    y: number;
    ratio: string;
    frameW: number;
    frameH: number;
  };
  location?: string;
  mentions: string[];
  privacy: MomentPrivacy;
  /** Explicit recipients for a Close Friends Moment; stored in the existing payload JSON. */
  recipientUserIds?: string[];
  /** hours until the Moment expires */
  duration: number;
  effect: MomentEffect;
  ai: Partial<Record<AiTool, boolean>>;
  allowDownload: boolean;
  screenshotAlert: boolean;
  /** interaction & safety settings (stored in payload) */
  allowReactions?: boolean;
  allowReplies?: boolean;
  allowSharing?: boolean;
  showLocation?: boolean;
  saveToArchive?: boolean;
  poll: MomentPoll | null;
  createdAt: number;
  /** epoch ms when this moment expires */
  expiresAt?: number;
  archived: boolean;
  viewers: MomentViewer[];
  replies: MomentReply[];
  /** author of the moment (real profile) */
  author?: MomentAuthor;
  mine?: boolean;
};

export type NewMoment = Omit<
  MyMoment,
  "id" | "createdAt" | "archived" | "viewers" | "replies"
> & {
  /** Runtime-only callback; never persisted with the moment. */
  onUploadProgress?: (percent: number) => void;
};

export type Store = {
  moments: MyMoment[];
  archive: MyMoment[];
  loading: boolean;
  addMoment: (m: NewMoment) => Promise<{ error: string | null }>;
  deleteMoment: (id: string) => Promise<{ error: string | null }>;
  archiveMoment: (id: string) => void;
  restoreMoment: (id: string) => void;
  addReply: (id: string, text: string) => Promise<{ error: string | null }>;
  votePoll: (id: string, option: 0 | 1) => void;
  registerScreenshot: (id: string) => void;
  registerView: (id: string, liked?: boolean) => void;
  reload: () => Promise<void>;
};

type DbView = {
  moment_id: string;
  viewer_id: string;
  liked: boolean;
  screenshot: boolean;
  created_at: string;
};

type DbReply = {
  id: string;
  moment_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

type DbLike = {
  moment_id: string;
  user_id: string;
  created_at: string;
};

type DbUniqueView = {
  user_id: string;
  content_id: string;
  content_type: string;
  viewed_at: string;
};

type MomentDbResult = {
  data: unknown[] | null;
  error: { code?: string; message?: string; details?: string | null } | null;
};

type MomentDbQuery = {
  select: (columns?: string) => MomentDbQuery;
  insert: (values: Record<string, unknown>) => MomentDbQuery;
  upsert: (
    values: Record<string, unknown>,
    options?: { onConflict?: string },
  ) => MomentDbQuery;
  delete: () => MomentDbQuery;
  eq: (column: string, value: string) => MomentDbQuery;
  in: (column: string, values: string[]) => MomentDbQuery;
  then: PromiseLike<MomentDbResult>["then"];
};

const momentDb = supabase as unknown as {
  from: (table: string) => MomentDbQuery;
};

type DbMoment = {

  id: string;
  user_id: string;
  kind: string;
  media_url: string | null;
  media_type: string | null;
  text: string;
  text_bg: string;
  payload: Record<string, unknown> | null;
  privacy: string;
  duration: number;
  allow_download: boolean;
  screenshot_alert: boolean;
  poll: MomentPoll | null;
  archived: boolean;
  created_at: string;
  expires_at?: string | null;
  audio_url?: string | null;
  music_title?: string | null;
  music_artist?: string | null;
  audio_start_time?: number | string | null;
  volume?: number | string | null;
  profiles?: MomentProfileRow | MomentProfileRow[] | null;
  user?: MomentProfileRow | MomentProfileRow[] | null;
  avatar_url?: string | null;
  profile_pic?: string | null;
  profile_image?: string | null;
};

type MomentProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  profile_pic?: string | null;
  profile_image?: string | null;
};

const MOMENT_WITH_PROFILE_SELECT =
  "*, profiles:user_id (id, full_name, display_name, username, avatar_url, profile_pic, profile_image)";

function profileFromMomentRow(row: DbMoment): MomentProfileRow | null {
  const nested = row.profiles ?? row.user;
  const profile = Array.isArray(nested) ? nested[0] : nested;
  return (
    profile ??
    (row.avatar_url || row.profile_pic || row.profile_image
      ? {
          id: row.user_id,
          avatar_url: row.avatar_url,
          profile_pic: row.profile_pic,
          profile_image: row.profile_image,
        }
      : null)
  );
}

function hasProfileJoinError(error: unknown) {
  const message =
    error && typeof error === "object"
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");
  return /relationship|schema cache|profiles:user_id|column .*does not exist|could not find the .*column/i.test(
    message,
  );
}

function postRowToMoment(row: Record<string, unknown>): DbMoment {
  const createdAt =
    typeof row.created_at === "string" ? row.created_at : new Date().toISOString();
  const durationHours =
    typeof row.duration === "number" && Number.isFinite(row.duration) && row.duration > 0
      ? row.duration
      : 24;
  const recipientUserIds = Array.isArray(row.viewer_user_ids)
    ? row.viewer_user_ids.filter((id): id is string => typeof id === "string")
    : [];
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    kind: String(row.media_type ?? "photo").startsWith("video") ? "video" : "photo",
    media_url: typeof row.media_url === "string" ? row.media_url : null,
    media_type: typeof row.media_type === "string" ? row.media_type : null,
    text: typeof row.caption === "string" ? row.caption : "",
    text_bg: "",
    payload: recipientUserIds.length ? { recipientUserIds } : null,
    privacy: typeof row.audience === "string" ? row.audience : "everyone",
    duration: durationHours,
    allow_download: row.allow_download !== false,
    screenshot_alert: false,
    poll: null,
    archived: row.archived === true,
    created_at: createdAt,
    expires_at: new Date(
      new Date(createdAt).getTime() + durationHours * 3600_000,
    ).toISOString(),
  };
}

function rowToMoment(
  row: DbMoment,
  views: MomentViewer[],
  replies: MomentReply[],
  author: MomentAuthor | undefined,
  uid: string | null,
): MyMoment {
  const p = (row.payload ?? {}) as Record<string, unknown>;
  const audioStart =
    row.audio_start_time !== null && row.audio_start_time !== undefined
      ? Number(row.audio_start_time)
      : Number(p.musicStart);
  const audioVolume =
    row.volume !== null && row.volume !== undefined
      ? Number(row.volume)
      : Number(p.musicVolume);
  const createdAt = Date.parse(row.created_at);
  const createdAtMs = Number.isFinite(createdAt) ? createdAt : Date.now();
  const expiresAt = row.expires_at ? Date.parse(row.expires_at) : Number.NaN;
  const kind: MomentKind =
    row.kind === "video" || row.kind === "text" || row.kind === "photo"
      ? row.kind
      : "photo";
  const privacy: MomentPrivacy =
    row.privacy === "followers" ||
    row.privacy === "close" ||
    row.privacy === "onlyme" ||
    row.privacy === "everyone"
      ? row.privacy
      : "everyone";
  return {
    id: row.id,
    kind,
    media: typeof row.media_url === "string" ? row.media_url : "",
    mediaType: typeof row.media_type === "string" ? row.media_type : undefined,
    text: row.text ?? "",
    textBg: row.text_bg ?? "",
    music: typeof p.music === "string" ? p.music : undefined,
    musicTitle:
      typeof row.music_title === "string"
        ? row.music_title
        : typeof p.musicTitle === "string"
          ? p.musicTitle
          : undefined,
    musicArtist:
      typeof row.music_artist === "string"
        ? row.music_artist
        : typeof p.musicArtist === "string"
          ? p.musicArtist
          : undefined,
    musicUrl:
      typeof row.audio_url === "string"
        ? row.audio_url
        : typeof p.musicUrl === "string"
          ? p.musicUrl
          : undefined,
    musicStart: Number.isFinite(audioStart) ? audioStart : undefined,
    audioStartTime: Number.isFinite(audioStart) ? audioStart : undefined,
    musicEnd: typeof p.musicEnd === "number" ? p.musicEnd : undefined,
    musicVolume: Number.isFinite(audioVolume) ? audioVolume : undefined,
    stickers: Array.isArray(p.stickers) ? (p.stickers as Sticker[]) : [],
    drawing: typeof p.drawing === "string" ? p.drawing : undefined,
    trim: p.trim as MyMoment["trim"],
    crop: p.crop as MyMoment["crop"],
    location: typeof p.location === "string" ? p.location : undefined,
    mentions: Array.isArray(p.mentions)
      ? p.mentions.filter((mention): mention is string => typeof mention === "string")
      : [],
    privacy,
    recipientUserIds: Array.isArray(p.recipientUserIds)
      ? p.recipientUserIds.filter((id): id is string => typeof id === "string")
      : undefined,
    duration: Number.isFinite(row.duration) && row.duration > 0 ? row.duration : 24,
    effect:
      p.effect === "boomerang" ||
      p.effect === "slowmo" ||
      p.effect === "reverse" ||
      p.effect === "greenscreen"
        ? p.effect
        : "none",
    ai: p.ai && typeof p.ai === "object" ? (p.ai as Partial<Record<AiTool, boolean>>) : {},
    allowDownload: row.allow_download !== false,
    screenshotAlert: row.screenshot_alert === true,
    allowReactions: p.allowReactions !== false,
    allowReplies: p.allowReplies !== false,
    allowSharing: p.allowSharing !== false,
    showLocation: p.showLocation !== false,
    saveToArchive: p.saveToArchive !== false,
    poll: row.poll ?? null,
    createdAt: createdAtMs,
    expiresAt:
      Number.isFinite(expiresAt) ? expiresAt : createdAtMs + 24 * 3600_000,
    archived: row.archived === true,
    viewers: views,
    replies,
    author,
    mine: !!uid && row.user_id === uid,
  };
}

function payloadOf(m: NewMoment) {
  return {
    music: m.music ?? null,
    musicTitle: m.musicTitle ?? null,
    musicArtist: m.musicArtist ?? null,
    musicUrl: m.musicUrl ?? null,
    musicStart: m.musicStart ?? m.audioStartTime ?? null,
    musicEnd: m.musicEnd ?? null,
    musicVolume: m.musicVolume ?? null,
    stickers: m.stickers ?? [],
    drawing: m.drawing ?? null,
    trim: m.trim ?? null,
    crop: m.crop ?? null,
    location: m.location ?? null,
    mentions: m.mentions ?? [],
    effect: m.effect ?? "none",
    ai: m.ai ?? {},
    allowReactions: m.allowReactions ?? true,
    allowReplies: m.allowReplies ?? true,
    allowSharing: m.allowSharing ?? true,
    showLocation: m.showLocation ?? true,
    saveToArchive: m.saveToArchive ?? true,
    ...(m.recipientUserIds?.length
      ? { recipientUserIds: m.recipientUserIds }
      : {}),
    durationHours: m.duration,
  };
}

/** Uploads a blob/data url to the private moments bucket; returns the storage path. */
async function uploadMomentMedia(
  uid: string,
  src: string,
  mediaType?: string,
  prefix = "media",
  onProgress?: ProgressFn,
) {
  if (!src || (!src.startsWith("blob:") && !src.startsWith("data:"))) return src;
  // Prefer the retained Blob: the object URL may already be revoked by the
  // editor screen that unmounted while this upload runs in the background.
  let blob = getRegisteredBlob(src);
  if (!blob) {
    const res = await fetch(src);
    if (!res.ok) throw new Error("Media is no longer available on this device");
    blob = await res.blob();
  }
  // Callers sometimes pass a short kind ("video"/"image") instead of a real
  // MIME type — storage rejects those with a 400, so normalise here.
  const hinted = mediaType && mediaType.includes("/") ? mediaType : "";
  const type =
    blob.type ||
    hinted ||
    (mediaType === "video" ? "video/mp4" : mediaType === "audio" ? "audio/mpeg" : "image/jpeg");
  const uploadBlob = type.startsWith("video/")
    ? await optimizeVideoBlob(blob, (percent, detail) => onProgress?.(percent, detail))
    : blob;
  const uploadType = uploadBlob.type || type;
  const ext = uploadType.includes("audio")
    ? type.includes("wav")
      ? "wav"
      : type.includes("mp4") || type.includes("m4a")
        ? "m4a"
        : "mp3"
    : uploadType.includes("video")
    ? uploadType.includes("webm")
      ? "webm"
      : "mp4"
    : uploadType.includes("png")
      ? "png"
      : "jpg";
  const path = `${uid}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { url, storagePath, error } = await uploadWithProgress(
    STORAGE_BUCKETS.moments,
    path,
    uploadBlob,
    uploadType,
    (percent) => onProgress?.(
      type.startsWith("video/") ? 45 + Math.round(percent * 0.55) : percent,
    ),
  );
  if (error && !url) throw new Error(error);
  // Store the storage path; every viewer signs their own short-lived URL.
  return storagePath ?? path;
}


/** Signs media and music paths so any allowed viewer can play the moment. */
async function signMomentMedia(list: MyMoment[]) {
  const values = list.flatMap((m) => [m.media, m.musicUrl]).filter(
    (value): value is string => !!value && !/^(data:|blob:)/.test(value),
  );
  const valueToPath = new Map(
    values.flatMap((value) => {
      const path = storagePathFromMomentValue(value);
      return path ? [[value, path] as const] : [];
    }),
  );
  const paths = [...new Set(valueToPath.values())];
  if (!paths.length) return list;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.moments)
    .createSignedUrls(paths, 60 * 60 * 6);
  if (error) {
    return list.map((moment) => ({
      ...moment,
      media: moment.media && valueToPath.has(moment.media) ? "" : moment.media,
      musicUrl:
        moment.musicUrl && valueToPath.has(moment.musicUrl)
          ? undefined
          : moment.musicUrl,
    }));
  }
  const byPath = new Map(
    (data ?? [])
      .filter((d) => d.signedUrl && d.path)
      .map((d) => [d.path as string, d.signedUrl as string]),
  );
  return list.map((m) => {
    const mediaPath = m.media ? valueToPath.get(m.media) : undefined;
    const musicPath = m.musicUrl ? valueToPath.get(m.musicUrl) : undefined;
    return {
      ...m,
      media: (mediaPath && byPath.get(mediaPath)) ?? m.media,
      musicUrl: m.musicUrl
        ? (musicPath && byPath.get(musicPath)) ?? m.musicUrl
        : undefined,
    };
  });
}

function storagePathFromMomentValue(value: unknown) {
  if (typeof value !== "string" || !value || /^(blob:|data:)/.test(value)) return null;
  if (!/^https?:\/\//.test(value)) return value;
  try {
    const pathname = decodeURIComponent(new URL(value).pathname);
    const marker = "/storage/v1/object/";
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const segments = pathname.slice(markerIndex + marker.length).split("/");
    const bucketIndex = segments.indexOf(STORAGE_BUCKETS.moments);
    return bucketIndex >= 0 ? segments.slice(bucketIndex + 1).join("/") || null : null;
  } catch {
    return null;
  }
}

async function deleteMomentRows(table: string, filters: [string, string][]) {
  try {
    let query = momentDb.from(table).delete();
    for (const [column, value] of filters) query = query.eq(column, value);
    const result = await query;
    if (!result.error || missingTable(result.error, table)) return null;
    return result.error.message ?? `Couldn't remove ${table}`;
  } catch (cause) {
    return cause instanceof Error ? cause.message : `Couldn't remove ${table}`;
  }
}


export function MomentProvider({ children }: { children: ReactNode }) {
  const [moments, setMoments] = useState<MyMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const uidRef = useRef<string | null>(null);
  const archivingRef = useRef(new Set<string>());
  const expiredArchiveCheckedRef = useRef(false);
  const deletedMomentIdsRef = useRef(new Set<string>());
  const loadInFlightRef = useRef(false);
  const reloadAfterLoadRef = useRef(false);

  const load = useCallback(async () => {
    if (loadInFlightRef.current) {
      reloadAfterLoadRef.current = true;
      return;
    }
    loadInFlightRef.current = true;
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) {
        if (isAuthSessionMissing(authError)) {
          uidRef.current = null;
          setMoments([]);
          setLoading(false);
          return;
        }
        uidRef.current = null;
        setMoments([]);
        setLoading(false);
        return;
      }
      const uid = auth.user?.id ?? null;
      uidRef.current = uid;
      if (!uid) {
        setMoments([]);
        setLoading(false);
        return;
      }

      // Run the backend purge opportunistically on authenticated app loads.
      // The function is idempotent and uses the service role only server-side;
      // this keeps expired rows and their private bucket objects from lingering
      // even when the database scheduler is unavailable.
      void supabase.functions.invoke("purge-expired-moments").catch((error) => {
        console.warn("Expired Moment purge unavailable", error);
      });

      const activeMomentCutoff = new Date().toISOString();
      let momentsResult = (await supabase
        .from("moments")
        .select(MOMENT_WITH_PROFILE_SELECT)
        .gt("expires_at", activeMomentCutoff)
        .order("created_at", { ascending: false })
        .limit(200)) as unknown as MomentDbResult;
      if (momentsResult.error && hasProfileJoinError(momentsResult.error)) {
        momentsResult = (await supabase
          .from("moments")
          .select("*")
          .gt("expires_at", activeMomentCutoff)
          .order("created_at", { ascending: false })
          .limit(200)) as unknown as MomentDbResult;
      }
      let rows: unknown[] | null = momentsResult.data;
      let momentsError = momentsResult.error;
      let usesPostsFallback = false;
      if (missingTable(momentsError, "moments")) {
        let postsResult = (await supabase
          .from("posts")
          .select(MOMENT_WITH_PROFILE_SELECT)
          .gt("expires_at", activeMomentCutoff)
          .order("created_at", { ascending: false })
          .limit(200)) as unknown as MomentDbResult;
        if (postsResult.error && hasProfileJoinError(postsResult.error)) {
          postsResult = (await supabase
            .from("posts")
            .select("*")
            .gt("expires_at", activeMomentCutoff)
            .order("created_at", { ascending: false })
            .limit(200)) as unknown as MomentDbResult;
        }
        rows = (postsResult.data ?? []).filter(
          (row) => (row as Record<string, unknown>).kind === "moment",
        );
        momentsError = postsResult.error;
        usesPostsFallback = true;
      }
      if (momentsError) {
        setMoments([]);
        setLoading(false);
        return;
      }

      const list = usesPostsFallback
        ? (rows ?? []).map((row) => postRowToMoment(row as Record<string, unknown>))
        : ((rows ?? []) as DbMoment[]);
      const visibleList = list.filter((row) => {
        const payload = row.payload;
        if (!payload || !Object.prototype.hasOwnProperty.call(payload, "recipientUserIds")) {
          return true;
        }
        const recipients = payload.recipientUserIds;
        if (
          !Array.isArray(recipients) ||
          recipients.length === 0 ||
          !recipients.every((id): id is string => typeof id === "string")
        ) {
          return row.user_id === uid;
        }
        return row.user_id === uid || recipients.includes(uid);
      });
      if (!visibleList.length) {
        setMoments([]);
        setLoading(false);
        return;
      }

      const ids = visibleList.map((r) => r.id);
      const authorIds = [...new Set(visibleList.map((r) => r.user_id))];

      const [viewsResult, repliesResult, likesResult, profilesResult, uniqueViewsResult] = await Promise.all([
        usesPostsFallback
          ? Promise.resolve({ data: [] as DbView[], error: null })
          : supabase.from("moment_views").select("*").in("moment_id", ids),
        usesPostsFallback
          ? Promise.resolve({ data: [] as DbReply[], error: null })
          : supabase.from("moment_replies").select("*").in("moment_id", ids),
        momentDb.from("moment_likes").select("moment_id,user_id,created_at").in("moment_id", ids),
        supabase.rpc("get_public_profiles", { ids: authorIds }),
        momentDb
          .from("unique_views")
          .select("user_id,content_id,content_type,viewed_at")
          .in("content_id", ids)
          .eq("content_type", "moment"),
      ]);
      let likes = (likesResult.data ?? []) as DbLike[];
      const likesError = likesResult.error;
      // Older deployments have no dedicated Moment-like table. Their Moment
      // records are posts, so the existing likes table is a safe compatibility
      // source until the migration is applied.
      if (missingTable(likesError, "moment_likes")) {
        const legacyLikes = await momentDb
          .from("likes")
          .select("post_id,user_id,created_at")
          .in("post_id", ids);
        likes = ((legacyLikes.data ?? []) as Array<{
          post_id: string;
          user_id: string;
          created_at: string;
        }>).map((like) => ({
          moment_id: like.post_id,
          user_id: like.user_id,
          created_at: like.created_at,
        }));
      }
      const views = viewsResult.data ?? [];
      const replies = repliesResult.data ?? [];
      const profiles = profilesResult.data ?? [];
      const uniqueViews = missingTable(uniqueViewsResult.error, "unique_views")
        ? []
        : (uniqueViewsResult.data ?? []) as DbUniqueView[];

      const profileById = new Map(
        (profiles as MomentProfileRow[]).map(
          (p) => [
            p.id,
            {
              id: p.id,
              username: p.username ?? "user",
              name: p.display_name ?? p.full_name ?? p.username ?? "User",
              avatar: p.avatar_url || p.profile_pic || p.profile_image || null,
            } satisfies MomentAuthor,
          ],
        ),
      );

      const mapped = visibleList.map((row) =>
        rowToMoment(
          row,
          [
            ...views.filter((view) => view.moment_id === row.id),
            ...uniqueViews
              .filter((view) => view.content_id === row.id && view.content_type === "moment")
              .map((view) => ({
                moment_id: row.id,
                viewer_id: view.user_id,
                liked: false,
                screenshot: false,
                created_at: view.viewed_at,
              })),
            ...likes
              .filter((like) => like.moment_id === row.id)
              .map((like) => ({
                moment_id: row.id,
                viewer_id: like.user_id,
                liked: true,
                screenshot: false,
                created_at: like.created_at,
              })),
          ]
            .reduce<MomentViewer[]>((all, v) => {
              const existing = all.find((viewer) => viewer.userId === v.viewer_id);
              if (existing) {
                existing.liked = existing.liked || v.liked;
                existing.screenshot = existing.screenshot || v.screenshot;
              } else {
                all.push({
                  userId: v.viewer_id,
                  at: new Date(v.created_at).getTime(),
                  liked: v.liked,
                  screenshot: v.screenshot,
                });
              }
              return all;
            }, []),
          replies
            .filter((reply) => reply.moment_id === row.id)
            .map((reply) => ({
              id: reply.id,
              userId: reply.user_id,
              text: reply.text,
              at: new Date(reply.created_at).getTime(),
            })),
          (() => {
            const embedded = profileFromMomentRow(row);
            const rpcProfile = profileById.get(row.user_id);
            if (!embedded && !rpcProfile) return undefined;
            return {
              id: row.user_id,
              username: embedded?.username ?? rpcProfile?.username ?? "user",
              name:
                embedded?.display_name ??
                embedded?.full_name ??
                rpcProfile?.name ??
                embedded?.username ??
                "User",
              avatar:
                embedded?.avatar_url?.trim() ||
                embedded?.profile_pic?.trim() ||
                embedded?.profile_image?.trim() ||
                rpcProfile?.avatar ||
                null,
            };
          })(),
          uid,
        ),
      );

      const momentsWithResolvedAvatars = await Promise.all(
        mapped.map(async (moment) => {
          const author = moment.author;
          const avatar = author?.avatar;
          if (!avatar) return moment;
          return {
            ...moment,
            author: {
              ...author,
              avatar: await resolveMediaUrl(avatar, "avatars"),
            },
          };
        }),
      );
      const signedMoments = await signMomentMedia(
        momentsWithResolvedAvatars.filter(
          (moment) => !deletedMomentIdsRef.current.has(moment.id),
        ),
      );
      setMoments(
        signedMoments.filter((moment) => !deletedMomentIdsRef.current.has(moment.id)),
      );
      setLoading(false);
    } catch {
      setLoading(false);
    } finally {
      loadInFlightRef.current = false;
      if (reloadAfterLoadRef.current) {
        reloadAfterLoadRef.current = false;
        void load();
      }
    }
  }, []);


  useEffect(() => {
    void load();
    let reloadTimer: number | undefined;
    const queueReload = () => {
      window.clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(() => void load(), 300);
    };
    const channel = supabase
      .channel("moments-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "moments" }, queueReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "moment_views" }, queueReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "moment_replies" }, queueReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "moment_likes" }, queueReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "unique_views" }, queueReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, queueReload)
      .subscribe();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      window.clearTimeout(reloadTimer);
      void supabase.removeChannel(channel);
      sub.subscription.unsubscribe();
    };
  }, [load]);

  // Expiry clock: re-evaluate every 30s so 24h moments disappear on time
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Auto-archive my own expired moments once per app launch. This is a silent
  // best-effort cleanup; expiry is already enforced in the visible lists, so a
  // failed background write must never interrupt the user with a toast or loop.
  useEffect(() => {
    if (expiredArchiveCheckedRef.current || !moments.length) return;
    expiredArchiveCheckedRef.current = true;
    const currentTime = Date.now();

    const expiredMine = moments.filter(
      (m) =>
        m.mine &&
        !m.archived &&
        m.expiresAt &&
        m.expiresAt <= currentTime &&
        !m.id.startsWith("pending-") &&
        !archivingRef.current.has(m.id),
    );
    if (!expiredMine.length) return;
    const ids = expiredMine.map((m) => m.id);
    ids.forEach((id) => archivingRef.current.add(id));
    // Patch locally before writing so our own realtime event cannot schedule
    // the same archive operation again while the database is catching up.
    setMoments((current) =>
      current.map((moment) => (ids.includes(moment.id) ? { ...moment, archived: true } : moment)),
    );
    void (async () => {
      try {
         await supabase
           .from("moments")
           .update({ archived: true })
           .in("id", ids)
           .lte("expires_at", new Date(currentTime).toISOString());
      } catch {
        // Expiry is already handled locally. Never surface or rethrow a
        // best-effort background archive failure.
      } finally {
        ids.forEach((id) => archivingRef.current.delete(id));
      }
    })();
  }, [moments]);

  const patch = useCallback(
    (id: string, fn: (m: MyMoment) => MyMoment) =>
      setMoments((p) => p.map((m) => (m.id === id ? fn(m) : m))),
    [],
  );

  const value = useMemo<Store>(
    () => ({
      moments: moments.filter(
        (m) => !m.archived && !(m.expiresAt && m.expiresAt <= now),
      ),
      archive: moments.filter((m) => m.archived || (m.expiresAt ? m.expiresAt <= now : false)),
      loading,
      addMoment: (m) => {
        const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const optimistic: MyMoment = {
          ...m,
          id: tempId,
          createdAt: Date.now(),
          archived: false,
          viewers: [],
          replies: [],
          mine: true,
        };
        setMoments((p) => [optimistic, ...p]);

        return (async () => {
          const uid = uidRef.current ?? (await supabase.auth.getUser()).data.user?.id ?? null;
          if (!uid) {
            toast.error("Sign in to publish a moment");
            setMoments((p) => p.filter((x) => x.id !== tempId));
            return { error: "Sign in to publish a moment" };
          }
          let media = "";
          let musicUrl = m.musicUrl;
          const uploadsLocalMusic =
            !!musicUrl && (musicUrl.startsWith("blob:") || musicUrl.startsWith("data:"));
          if (m.media) {
            try {
              media = await uploadMomentMedia(
                uid,
                m.media,
                m.mediaType,
                "media",
                uploadsLocalMusic && m.onUploadProgress
                  ? (percent) => m.onUploadProgress?.(Math.round(percent * 0.8))
                  : m.onUploadProgress,
              );
            } catch (e) {
              console.error("Moment media upload failed", e);
              toast.error(
                e instanceof Error ? e.message : "Couldn't upload this moment's media",
              );
              setMoments((p) => p.filter((x) => x.id !== tempId));
              return {
                error: e instanceof Error ? e.message : "Couldn't upload this moment's media",
              };
            }
          }
          if (uploadsLocalMusic && musicUrl) {
            const localMusic = musicUrl;
            try {
              musicUrl = await uploadMomentMedia(
                uid,
                localMusic,
                "audio",
                "music",
                m.onUploadProgress
                  ? (percent) => m.onUploadProgress?.(Math.round(80 + percent * 0.2))
                  : undefined,
              );
            } catch (e) {
              console.error("Moment music upload failed", e);
              toast.error(e instanceof Error ? e.message : "Couldn't upload the moment song");
              musicUrl = undefined;
            }
          }
          // never persist a device-only url — it can't play for anyone else
          if (musicUrl && /^(blob:|data:)/.test(musicUrl)) musicUrl = undefined;
          if (m.kind !== "text" && !media) {
            toast.error("Couldn't upload this moment's media");
            setMoments((p) => p.filter((x) => x.id !== tempId));
            return { error: "Couldn't upload this moment's media" };
          }
            const hours =
              Number.isFinite(m.duration) && m.duration > 0 ? m.duration : 24;

          let error: { message: string } | null = null;
          try {
            const result = await writeCompat(
              (payload) => supabase.from("moments").insert(payload as never),
              {
                user_id: uid,
                kind: m.kind,
                media_url: media || null,
                media_type: m.mediaType ?? null,
                text: m.text ?? "",
                text_bg: m.textBg ?? "",
                payload: payloadOf({ ...m, musicUrl }),
                audio_url: musicUrl ?? null,
                music_title: m.musicTitle ?? m.music ?? null,
                music_artist: m.musicArtist ?? null,
                audio_start_time: m.audioStartTime ?? m.musicStart ?? null,
                volume: m.musicVolume ?? null,
                privacy: m.privacy,
                duration: hours,
                allow_download: m.allowDownload,
                screenshot_alert: m.screenshotAlert,
                poll: m.poll,
                expires_at: new Date(Date.now() + hours * 3600_000).toISOString(),
              },
            );
            if (missingTable(result.error, "moments")) {
              const fallback = await writeCompat(
                (payload) => supabase.from("posts").insert(payload as never),
                {
                  user_id: uid,
                  kind: "moment",
                  media_url: media || "",
                  media_type: m.mediaType ?? (m.kind === "video" ? "video" : "image"),
                  caption: m.text ?? "",
                  audience: m.privacy,
                  viewer_user_ids: m.recipientUserIds ?? [],
                  duration_seconds: hours,
                  allow_download: m.allowDownload,
                  audio: musicUrl ?? null,
                  archived: false,
                },
                { kind: "type" },
              );
              error = fallback.error
                ? { message: fallback.error.message ?? "Couldn't save this moment" }
                : null;
            } else {
              error = result.error
                ? { message: result.error.message ?? "Couldn't save this moment" }
                : null;
            }
          } catch (e) {
            console.error("Moment database insert threw unexpectedly", e);
            error = {
              message: e instanceof Error ? e.message : "Couldn't save this moment",
            };
          }
          setMoments((p) => p.filter((x) => x.id !== tempId));
          if (error) {
            console.error("Moment database insert failed", error);
            toast.error(error.message);
            return { error: error.message };
          }
          await load();
          return { error: null };
        })().catch((e) => {
          console.error("Moment publish failed unexpectedly", e);
          const message = e instanceof Error ? e.message : "Couldn't publish this moment";
          toast.error(message);
          setMoments((p) => p.filter((x) => x.id !== tempId));
          return { error: message };
        });
      },
      deleteMoment: async (id) => {
        // Optimistic removal — instantly drops from feed bar, lists, viewer queue & archive
        deletedMomentIdsRef.current.add(id);
        setMoments((p) => p.filter((m) => m.id !== id));
        try {
          const { data: auth, error: authError } = await supabase.auth.getUser();
          const uid = auth.user?.id ?? null;
          if (authError || !uid) throw new Error("Sign in to delete this moment.");

          const momentResult = await momentDb.from("moments").select("*").eq("id", id);
          let row = (momentResult.data?.[0] ?? null) as Record<string, unknown> | null;
          let usesPostsFallback = false;
          if (missingTable(momentResult.error, "moments")) {
            const postsResult = await momentDb.from("posts").select("*").eq("id", id);
            if (postsResult.error) throw new Error(postsResult.error.message ?? "Couldn't find this moment.");
            row = (postsResult.data?.[0] ?? null) as Record<string, unknown> | null;
            usesPostsFallback = true;
          } else if (momentResult.error) {
            throw new Error(momentResult.error.message ?? "Couldn't find this moment.");
          }

          if (!row || String(row.user_id) !== uid) {
            throw new Error("You can only delete your own moment.");
          }
          if (
            usesPostsFallback &&
            row.kind !== "moment" &&
            row.type !== "moment"
          ) {
            throw new Error("This moment is no longer available.");
          }

          const payload =
            row.payload && typeof row.payload === "object"
              ? (row.payload as Record<string, unknown>)
              : {};
          const mediaPaths = [
            storagePathFromMomentValue(row.media_url),
            storagePathFromMomentValue(payload.musicUrl),
            storagePathFromMomentValue(row.audio),
          ].filter((path): path is string => !!path);

          // Remove FK-backed activity before deleting the parent record.
          const requiredChildErrors = await Promise.all([
            deleteMomentRows("moment_replies", [["moment_id", id]]),
            deleteMomentRows("moment_views", [["moment_id", id]]),
          ]);
          const requiredChildError = requiredChildErrors.find(Boolean);
          if (requiredChildError) throw new Error(requiredChildError);

          // These interaction tables are compatibility data and may be absent
          // or protected independently of the owner's parent-row delete.
          const optionalChildResults = await Promise.all([
            deleteMomentRows("moment_likes", [["moment_id", id]]),
            deleteMomentRows("unique_views", [
              ["content_id", id],
              ["content_type", "moment"],
            ]),
            deleteMomentRows("likes", [["post_id", id]]),
            deleteMomentRows("post_views", [["post_id", id]]),
          ]);
          optionalChildResults.filter(Boolean).forEach((message) => {
            console.warn("Moment interaction cleanup skipped", message);
          });

          const deleteResult = usesPostsFallback
            ? await momentDb.from("posts").delete().eq("id", id).eq("user_id", uid)
            : await momentDb.from("moments").delete().eq("id", id).eq("user_id", uid);
          if (deleteResult.error) {
            throw new Error(deleteResult.error.message ?? "Couldn't delete this moment.");
          }

          if (mediaPaths.length) {
            const { error: storageError } = await supabase.storage
              .from(STORAGE_BUCKETS.moments)
              .remove([...new Set(mediaPaths)]);
            if (storageError) {
              throw new Error(storageError.message ?? "Couldn't delete this moment's media.");
            }
          }

          try {
            await load();
          } catch (refreshError) {
            console.error("Moment cache refresh failed after deletion", refreshError);
          }
          return { error: null };
        } catch (cause) {
          deletedMomentIdsRef.current.delete(id);
          console.error("Moment deletion failed", cause);
          try {
            await load();
          } catch (refreshError) {
            console.error("Moment cache refresh failed after deletion failure", refreshError);
          }
          return {
            error: cause instanceof Error ? cause.message : "Couldn't delete this moment.",
          };
        }
      },
      archiveMoment: (id) => {
        patch(id, (m) => ({ ...m, archived: true }));
        void supabase
          .from("moments")
          .update({ archived: true })
          .eq("id", id)
          .then(({ error }) => {
            if (!error) return;
            console.error("Moment archive failed", error);
            toast.error("Couldn't archive this moment.");
            patch(id, (m) => ({ ...m, archived: false }));
          });
      },
      restoreMoment: (id) => {
        patch(id, (m) => ({ ...m, archived: false }));
        void supabase
          .from("moments")
          .update({ archived: false })
          .eq("id", id)
          .then(({ error }) => {
            if (!error) return;
            console.error("Moment restore failed", error);
            toast.error("Couldn't restore this moment.");
            patch(id, (m) => ({ ...m, archived: true }));
          });
      },
      addReply: async (id, text) => {
        const uid = uidRef.current;
        const body = text.trim();
        if (!uid || !body) return { error: "no-session" };
        const target = moments.find((m) => m.id === id);
        const ownerId = target?.author?.id;
        if (!ownerId || ownerId === uid) return { error: "invalid-target" };
        patch(id, (m) => ({
          ...m,
          replies: [...m.replies, { id: `tmp-${Date.now()}`, userId: uid, text: body, at: Date.now() }],
        }));
        const replyResult = await momentDb
          .from("moment_replies")
          .insert({ moment_id: id, user_id: uid, text: body });
        if (replyResult.error && !missingTable(replyResult.error, "moment_replies")) {
          console.error("Moment reply failed", replyResult.error);
            toast.error("Couldn't send your reply.");
            void load();
          return { error: replyResult.error.message ?? "Couldn't save the reply." };
        }

        // Social chat reads public.messages. Keep the preview in metadata so
        // the chat can identify this as a reply without a second legacy thread.
        const threadId = dmThreadId(uid, ownerId);
        const conversation = await ensureThreadConversation(threadId, [uid, ownerId]);
        if (!conversation) {
          return { error: "Chat conversation could not be synchronized." };
        }
        const autoDeleteMode = normalizeAutoDeleteSetting(conversation.auto_delete_setting);
        const messageResult = await writeCompat(
          (payload) => momentDb.from("messages").insert(payload),
          {
            sender_id: uid,
            receiver_id: ownerId,
            content: body,
            media_url: target.media || null,
            moment_id: id,
            moment_media_url: target.media || null,
            moment_created_at: new Date(target.createdAt).toISOString(),
            conversation_id: conversation.id,
            is_system_message: false,
            auto_delete_setting: autoDeleteMode,
            auto_delete_mode: autoDeleteMode,
            is_deleted: false,
            metadata: {
              type: "moment_reply",
              moment_id: id,
              moment_media_url: target.media || null,
              moment_created_at: new Date(target.createdAt).toISOString(),
              thread_id: threadId,
              preview: {
                kind: target.kind,
                text: target.text,
                media_url: target.media || null,
                created_at: new Date(target.createdAt).toISOString(),
              },
            },
          },
        );
        if (messageResult.error) {
          console.error("Moment reply chat delivery failed", messageResult.error);
          toast.error(
            replyResult.error
              ? "Reply couldn't be delivered to chat."
              : "Reply saved, but chat delivery failed.",
          );
          return { error: messageResult.error.message ?? "Chat delivery failed." };
        }
        return { error: null };
      },
      votePoll: (id, option) => {
        const target = moments.find((m) => m.id === id);
        if (!target?.poll || target.poll.myVote !== null) return;
        const votes: [number, number] = [...target.poll.votes] as [number, number];
        votes[option] += 1;
        const poll = { ...target.poll, votes, myVote: option };
        patch(id, (m) => ({ ...m, poll }));
        if (target.mine) {
          void supabase
            .from("moments")
            .update({ poll })
            .eq("id", id)
            .then(({ error }) => {
              if (!error) return;
              console.error("Moment poll update failed", error);
              toast.error("Couldn't save your vote.");
              void load();
            });
        }
      },
      registerScreenshot: (id) => {
        const uid = uidRef.current;
        if (!uid) return;
        void supabase
          .from("moment_views")
          .upsert(
            { moment_id: id, viewer_id: uid, screenshot: true },
            { onConflict: "moment_id,viewer_id" },
          )
          .then(({ error }) => {
            if (!error) return;
            console.error("Moment screenshot registration failed", error);
            toast.error("Couldn't record the screenshot alert.");
          });
      },
      registerView: (id, liked) => {
        const uid = uidRef.current;
        if (!uid || id.startsWith("pending-")) return;
        void (async () => {
          if (liked !== undefined) {
            const likeResult = liked
              ? await momentDb
                  .from("moment_likes")
                  .upsert(
                    { moment_id: id, user_id: uid },
                    { onConflict: "moment_id,user_id" },
                  )
              : await momentDb
                  .from("moment_likes")
                  .delete()
                  .eq("moment_id", id)
                  .eq("user_id", uid);
            if (!likeResult.error) return;
            if (!missingTable(likeResult.error, "moment_likes")) {
              console.error("Moment like update failed", likeResult.error);
              return;
            }
            // Compatibility for a deployment that has not applied the
            // dedicated Moment interaction migration yet.
            if (liked) {
              const legacy = await momentDb
                .from("likes")
                .upsert({ post_id: id, user_id: uid }, { onConflict: "post_id,user_id" });
              if (!legacy.error) return;
              console.error("Legacy Moment like update failed", legacy.error);
              return;
            }
            const legacy = await momentDb
              .from("likes")
              .delete()
              .eq("post_id", id)
              .eq("user_id", uid);
            if (legacy.error) {
              console.error("Legacy Moment unlike failed", legacy.error);
            }
            return;
          }

          try {
            const counted = await registerUniqueView(id, "moment");
            if (!counted) return;
            patch(id, (moment) => {
              if (moment.viewers.some((viewer) => viewer.userId === uid)) return moment;
              return {
                ...moment,
                viewers: [
                  ...moment.viewers,
                  { userId: uid, at: Date.now(), liked: false, screenshot: false },
                ],
              };
            });
          } catch (error) {
            console.error("Moment view registration failed", error);
          }
        })();
      },
      reload: load,
    }),
    [moments, loading, patch, load, now],
  );

  return <MomentContext.Provider value={value}>{children}</MomentContext.Provider>;
}
