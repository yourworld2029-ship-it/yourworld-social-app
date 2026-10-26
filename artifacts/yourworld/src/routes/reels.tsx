import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Hls from "hls.js";
import {
  bindHlsNetworkAwareLevelCap,
  createVideoHlsConfig,
} from "@/lib/video-hls-config";
import { cloudflareStreamPosterUrl } from "@/lib/cloudflare-stream-media";
import {
  cacheVideoPoster,
  getVideoPoster,
  prefetchVideo,
  subscribeVideoPoster,
} from "@/lib/video-prefetch";
import { preloadNextVideo } from "@/lib/next-video-preload";
import { canReadPublicVideoPreview } from "@/lib/video-preview-access";
import {
  Heart,
  MessageCircle,
  Send,
  Repeat2,
  Download,
  Music2,
  Volume2,
  MoreVertical,
  Link2,
  EyeOff,
  UserX,
  Flag,
  VolumeX,
  Star,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { ProfileAvatar } from "@/components/yw/ProfileAvatar";
import {
  ProtectedCanvasImage,
  ProtectedCanvasVideoMirror,
} from "@/components/yw/ProtectedCanvasContent";
import {
  LazyVideoThumbnail,
  VIDEO_POSTER_FALLBACK,
} from "@/components/yw/LazyVideoThumbnail";
import { ShareSheet } from "@/components/yw/ShareSheet";
import { CommentsSheet } from "@/components/yw/CommentsSheet";
import { useAuth, useResumeAuthAction } from "@/lib/auth-store";
import { formatCount, type Reel, type User } from "@/lib/yw-data";
import {
  getLocalMedia,
  repostReelToProfile,
  resolveMediaUrl,
  timeAgo,
  useMediaPost,
  useSocialPosts,
  recordReelShare,
  type SocialPost,
  type ReelShareMethod,
} from "@/lib/social-data";
import {
  resolveAuthorizedOfflineSource,
  resolveAuthorizedPlaybackUrl,
} from "@/lib/video-media-api";
import { useDoubleTapLike, useYw } from "@/lib/yw-store";
import {
  downloadVideoForOfflineInBackground,
  createWatermarkedReelMp4Blob,
  downloadAudioOnly,
  downloadWithWatermark,
  isAndroidNativeDownloads,
  reelWatermarkText,
  sanitizeDownloadName,
  type DownloadedVideoMetadata,
} from "@/lib/yw-download";
import { saveReelMp4ToAndroidGallery } from "@/lib/reel-gallery";
import { cn } from "@/lib/utils";
import { releaseListVideo } from "@/lib/media-release";
import { useScreenImage } from "@/lib/screen-image";
import { toast } from "sonner";
import { DownloadSheet, type DownloadChoice } from "@/components/yw/DownloadSheet";
import {
  qualityTierFromDimensions,
  qualityTierFromSourceMetadata,
  resolveVideoDownloadSelection,
  type VideoQualityTier,
} from "@/lib/video-quality";
import { trackEvent } from "@/lib/analytics";
import { deleteMyPost } from "@/lib/profile-data";
import { supabase } from "@/integrations/supabase/client";
import { isLongVideoRow } from "@/lib/long-video-utils";
import { buildWatchShareUrl } from "@/lib/watch-links";
import {
  acquireMediaDownloadLock,
  isMediaDownloadLocked,
  ownsMediaDownloadLock,
  releaseMediaDownloadLock,
  showMediaDownloadBusyToast,
  useMediaConcurrency,
  type MediaDownloadLease,
} from "@/lib/media-concurrency";
import {
  getVideoResumeEntry,
  removeVideoResumeEntry,
  saveVideoResumeEntry,
} from "@/lib/video-resume";
import { useValidatedVideoViewTracker } from "@/lib/video-view-validation";
import {
  announceVideoCreatorMuted,
  announceVideoPostRestored,
  announceVideoPostSuppressed,
  copyShareLink,
  getPostFavoriteState,
  markPostNotInterested,
  removePostNotInterested,
  submitVideoReport,
  togglePostFavorite,
} from "@/lib/video-context-actions";
import { setLongVideoCreatorHidden } from "@/lib/long-video-preferences";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ReelsSearch = {
  reelId?: string;
  userId?: string;
  initialVideoId?: string;
  focusComments?: boolean;
  commentId?: string;
  returnTo?: "profile" | "public";
};

export const Route = createFileRoute("/reels")({
  validateSearch: (search: Record<string, unknown>): ReelsSearch => {
    const reelId = typeof search.reelId === "string" ? search.reelId.trim() : "";
    const userId = typeof search.userId === "string" ? search.userId.trim() : "";
    const initialVideoId =
      typeof search.initialVideoId === "string" ? search.initialVideoId.trim() : "";
    const focusComments = search.focusComments === true || search.focusComments === "true";
    const commentId =
      typeof search.commentId === "string" && search.commentId.trim()
        ? search.commentId.trim()
        : undefined;
    const returnTo = search.returnTo === "profile" || search.returnTo === "public"
      ? search.returnTo
      : undefined;
    return {
      reelId: reelId || undefined,
      userId: userId || undefined,
      initialVideoId: initialVideoId || undefined,
      focusComments,
      commentId,
      returnTo,
    };
  },
  head: () => ({
    meta: [
      { title: "Reels — YourWorld" },
      {
        name: "description",
        content:
          "Full-screen vertical reels you swipe through: like, comment, share, save and download when the creator allows it.",
      },
      { property: "og:title", content: "Reels — YourWorld" },
      {
        property: "og:description",
        content: "Swipe through full-screen vertical reels on YourWorld.",
      },
    ],
  }),
  component: ReelsPage,
});

function ReelsPage() {
  const { initialVideoId, reelId } = Route.useSearch();
  const hasDirectTarget = Boolean(initialVideoId || reelId);
  return (
    <main
      id="yw-reels-scroller"
      className={cn(
        "yw-media-scroll-surface no-scrollbar h-[calc(100dvh-4.75rem)] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-background [-webkit-overflow-scrolling:touch] [scroll-snap-stop:always]",
        hasDirectTarget ? "[scroll-behavior:auto]" : "[scroll-behavior:smooth]",
      )}
      aria-label="Reels"
    >
      <ReelsList />
    </main>
  );
}

function PendingReelPreview({
  src,
  caption,
  title,
}: {
  src: string;
  caption: string;
  title: string;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`Local preview of ${title || "your Reel"}`}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div className="pointer-events-none absolute bottom-8 left-4 right-20 space-y-2">
        <span className="inline-flex rounded-full bg-pink-600/90 px-3 py-1 text-xs font-semibold text-white">
          Uploading Reel · only you can see this
        </span>
        {title ? <p className="text-sm font-semibold text-white">{title}</p> : null}
        {caption ? (
          <p className="line-clamp-3 whitespace-pre-wrap text-sm text-white">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}

function ReelsList() {
  const { reelId, userId, initialVideoId, focusComments, commentId, returnTo } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toggleFollow } = useYw();
  const scoped = Boolean(userId);
  const initialId = initialVideoId || reelId;
  const [active, setActive] = useState(-1);
  // Start with sound on, and keep the viewer's choice as the active reel changes.
  const [reelsMuted, setReelsMuted] = useState(false);
  const nodes = useRef<(HTMLElement | null)[]>([]);
  const initialTargetPositionedRef = useRef(false);
  const initialFocusIdRef = useRef<string | null>(initialId ?? null);
  const longVideoTarget = useQuery({
    queryKey: ["reel-target-long-video", initialId],
    enabled: Boolean(initialId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!initialId) return false;
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", initialId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(
        data && isLongVideoRow(data as unknown as Record<string, unknown>),
      );
    },
  });
  const openingLongVideo = longVideoTarget.data === true;
  const {
    posts: dbReels,
    toggleLike: toggleDbLike,
    bumpShare,
    bumpRepost,
    currentUserId,
    removePost,
    loading,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  } = useSocialPosts(scoped ? "creator-media" : "reel", userId);
  const targetedMedia = useMediaPost(initialId ?? null);
  const [removedDirectTargetId, setRemovedDirectTargetId] = useState<string | null>(null);
  useEffect(() => {
    setRemovedDirectTargetId(null);
  }, [initialId]);
  const [repostedKeys, setRepostedKeys] = useState<Set<string>>(() => new Set());
  const [pendingRepostKeys, setPendingRepostKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const repostingKeys = useRef(new Set<string>());
  const handleRepost = useCallback(async (post: SocialPost) => {
    if (!currentUserId) {
      toast.error("Sign in to repost this Reel.");
      return;
    }
    if (post.user_id === currentUserId) {
      toast.error("You can't repost your own Reel.");
      return;
    }
    const key = `${currentUserId}:${post.id}`;
    if (repostingKeys.current.has(key) || repostedKeys.has(key)) return;
    repostingKeys.current.add(key);
    setPendingRepostKeys((current) => new Set(current).add(key));
    try {
      const result = await repostReelToProfile(post);
      setRepostedKeys((current) => new Set(current).add(key));
      if (result.eventRecorded) bumpRepost(post.id);
      await queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast.success(
        result.alreadyExists
          ? "This Reel is already on your profile."
          : "Reposted to your profile.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not repost this Reel.",
      );
    } finally {
      repostingKeys.current.delete(key);
      setPendingRepostKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }, [bumpRepost, currentUserId, queryClient, repostedKeys]);
  useEffect(() => {
    if (!openingLongVideo || !initialId) return;
    void navigate({
      to: "/video/$videoId",
      params: { videoId: initialId },
      search: {
        focusComments: focusComments || undefined,
        commentId,
      },
      replace: true,
    });
  }, [commentId, focusComments, initialId, navigate, openingLongVideo]);
  useResumeAuthAction("reel-like", "*", (action) =>
    toggleDbLike(action.targetId),
  );
  useResumeAuthAction("follow-user", "*", (action) => {
    void toggleFollow(action.targetId);
  });
  const viewedRef = useRef(new Set<string>());
  const recordView = useCallback(async (id: string) => {
    if (viewedRef.current.has(id)) return false;
    viewedRef.current.add(id);
    void queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    return true;
  }, [queryClient]);

  const handleBack = useCallback(() => {
    if (!scoped) return;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (returnTo === "profile") {
      void navigate({ to: "/profile" });
    } else if (userId) {
      void navigate({ to: "/u/$userId", params: { userId } });
    } else {
      void navigate({ to: "/" });
    }
  }, [navigate, returnTo, scoped, userId]);

  const reelRows = useMemo(() => {
    const target = targetedMedia.post;
    const canPrependTarget =
      !!initialId &&
      !!target &&
      target.id === initialId &&
      target.kind === "reel" &&
      (!userId || target.user_id === userId) &&
      target.id !== removedDirectTargetId &&
      canReadPublicVideoPreview(target);
    if (!canPrependTarget || dbReels.some((post) => post.id === target.id)) {
      return dbReels;
    }
    return [target, ...dbReels];
  }, [dbReels, initialId, removedDirectTargetId, targetedMedia.post, userId]);
  const reelPostIds = useMemo(
    () => reelRows.filter((post) => post.kind === "reel").map((post) => post.id),
    [reelRows],
  );
  const acceptedCollaboratorsQuery = useQuery<
    Array<{ post_id: string; collaborator_id: string }>
  >({
    queryKey: ["accepted-reel-collaborators", reelPostIds],
    enabled: reelPostIds.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_reel_collaborators", {
        p_post_ids: reelPostIds,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
  const collaboratorByPostId = useMemo(
    () =>
      new Map(
        (acceptedCollaboratorsQuery.data ?? []).map((item) => [
          item.post_id,
          item.collaborator_id,
        ]),
      ),
    [acceptedCollaboratorsQuery.data],
  );
  const collaboratorIds = useMemo(
    () => [...new Set(collaboratorByPostId.values())],
    [collaboratorByPostId],
  );
  const collaboratorProfilesQuery = useQuery<
    Array<{ id: string; username: string; display_name: string }>
  >({
    queryKey: ["reel-collaborator-profiles", collaboratorIds],
    enabled: collaboratorIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_profiles", {
        ids: collaboratorIds,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
  const collaboratorProfileById = useMemo(
    () => new Map((collaboratorProfilesQuery.data ?? []).map((profile) => [profile.id, profile])),
    [collaboratorProfilesQuery.data],
  );
  const live = useMemo(() => reelRows.map((p) => {
    const collaboratorId = p.kind === "reel"
      ? collaboratorByPostId.get(p.id)
      : undefined;
    return {
      sourcePost: p,
      collaborator: collaboratorId
        ? collaboratorProfileById.get(collaboratorId) ?? null
        : null,
      reel: {
      id: p.id,
      userId: p.user_id,
      poster: p.media_url,
      caption: p.caption,
      hashtags: p.hashtags ?? [],
      audio: p.audio ?? "original audio",
      likes: p.likeCount,
       views: Number(p.views ?? p.views_count ?? 0),
      commentCount: p.commentCount,
      shares: p.shareCount,
      reposts: p.repostCount,
      allowDownload: p.allow_download,
      cloudflareStreamId: p.cloudflare_stream_id ?? p.cloudflare_stream_uid,
      authorAvatarUrl: p.authorAvatarUrl,
      originalWidth: (p as typeof p & { original_width?: number | null }).original_width,
      originalHeight: (p as typeof p & { original_height?: number | null }).original_height,
      sourceQualityTier: (() => {
        const row = p as typeof p & {
          original_width?: number | null;
          original_height?: number | null;
          source_quality_tier?: string | null;
        };
        return qualityTierFromSourceMetadata(row.source_quality_tier)
          ?? qualityTierFromDimensions(row.original_width, row.original_height);
      })(),
      qualityUrls: (p as typeof p & {
        quality_urls?: Reel["qualityUrls"];
      }).quality_urls ?? undefined,
      durationSeconds: p.duration_seconds,
      createdAt: p.created_at,
      thumbnailUrl:
        (p as typeof p & { audience?: string | null }).audience === "everyone"
        ? p.thumbnail_url ?? cloudflareStreamPosterUrl(p.media_url, p.cloudflare_stream_id ?? p.cloudflare_stream_uid) ?? null
        : p.thumbnail_url ?? null,
    } satisfies Reel,
    author: p.author,
    likedByMe: p.likedByMe,
    mediaUrl: p.media_url,
    mediaType: p.media_type,
    access: canReadPublicVideoPreview(p) ? "public" : "restricted",
    mediaBucket: (p.kind === "reel" ? "reels" : "videos") as "reels" | "videos",
      thumbnailUrl:
        (p as typeof p & { audience?: string | null }).audience === "everyone"
        ? p.thumbnail_url ?? cloudflareStreamPosterUrl(p.media_url, p.cloudflare_stream_id ?? p.cloudflare_stream_uid) ?? null
        : p.thumbnail_url ?? null,
    isPending: p.id.startsWith("optimistic-reel-"),
    };
  }), [collaboratorByPostId, collaboratorProfileById, reelRows]);

  const items = live;
  const nextItem = items[active + 1];
  const nextMediaUrl =
    !nextItem?.isPending &&
    nextItem?.access === "public" &&
    nextItem.mediaType?.toLowerCase().startsWith("video")
      ? nextItem.mediaUrl
      : null;
  const nextMediaBucket = nextItem?.mediaBucket ?? "reels";
  useEffect(() => {
    if (active < 0 || !nextMediaUrl) return;
    let alive = true;
    let dispose: (() => void) | undefined;
    void resolveMediaUrl(nextMediaUrl, nextMediaBucket).then((url) => {
      if (alive && url) dispose = preloadNextVideo(url, nextMediaUrl);
    }).catch(() => undefined);
    return () => { alive = false; dispose?.(); };
  }, [active, nextMediaBucket, nextMediaUrl]);

  const prefetchTargets = useMemo(() => {
    if (active < 0) return [];
    const targets: Array<{
      mediaUrl: string;
      mediaBucket: "reels" | "videos";
      durationSeconds: number | null;
    }> = [];
    const addTarget = (index: number) => {
      const item = items[index];
      if (
        !item?.isPending &&
        item?.access === "public" &&
        item.mediaType?.toLowerCase().startsWith("video") &&
        item.mediaUrl
      ) {
        targets.push({
          mediaUrl: item.mediaUrl,
          mediaBucket: item.mediaBucket,
          durationSeconds: item.reel.durationSeconds ?? null,
        });
      }
    };
    addTarget(active + 1);
    return targets;
  }, [active, items]);

  useEffect(() => {
    if (!prefetchTargets.length) return;
    let disposed = false;
    let controller = new AbortController();
    const startPrefetch = () => {
      if (disposed || document.visibilityState === "hidden") return;
      controller.abort();
      controller = new AbortController();
      const requestController = controller;
      void (async () => {
        for (const target of prefetchTargets) {
          if (requestController.signal.aborted) break;
          try {
            const url = await resolveMediaUrl(target.mediaUrl, target.mediaBucket);
            if (!url || requestController.signal.aborted) continue;
            await prefetchVideo(url, target.durationSeconds, requestController.signal);
          } catch {
            // Reel warm-cache reads are opportunistic; playback remains authoritative.
          }
        }
      })();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") controller.abort();
      else startPrefetch();
    };
    startPrefetch();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controller.abort();
    };
  }, [prefetchTargets]);

  useEffect(() => {
    if (initialFocusIdRef.current !== (initialId ?? null)) {
      initialFocusIdRef.current = initialId ?? null;
      initialTargetPositionedRef.current = !initialId;
    }
    if (!initialId || loading || initialTargetPositionedRef.current) return;
    const targetIndex = reelRows.findIndex((reel) => reel.id === initialId);
    if (targetIndex < 0) return;
    setActive(targetIndex);
    const frame = requestAnimationFrame(() => {
      const targetNode = nodes.current[targetIndex];
      if (!targetNode) return;
      targetNode.scrollIntoView({ block: "start", behavior: "auto" });
      initialTargetPositionedRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [initialId, loading, reelRows]);

  useEffect(() => {
    const scroller = document.getElementById("yw-reels-scroller");
    const ratios = new Map<number, number>();
    const selectVisible = () => {
      if (initialId && !initialTargetPositionedRef.current) return;
      let bestIndex = -1;
      let bestRatio = 0.5;
      if (document.visibilityState !== "hidden") {
        for (const [index, ratio] of ratios) {
          if (ratio > bestRatio) { bestIndex = index; bestRatio = ratio; }
        }
      }
      setActive(bestIndex);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.index);
          ratios.set(i, e.isIntersecting ? e.intersectionRatio : 0);
        }
        selectVisible();
      },
      { root: scroller, threshold: [0, 0.5, 0.75, 1] },
    );
    nodes.current.forEach((n) => n && io.observe(n));
    document.addEventListener("visibilitychange", selectVisible);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", selectVisible);
    };
  }, [items.length, initialId]);

  useEffect(() => {
    const scroller = document.getElementById("yw-reels-scroller");
    if (!scroller || !hasNextPage || isFetchingNextPage) return;
    const onScroll = () => {
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - scroller.clientHeight * 2) {
        void loadMore();
      }
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  if (loading && !items.length) {
    return (
      <div className="grid h-full min-h-[calc(100dvh-4.75rem)] place-items-center px-6 text-center text-sm text-muted-foreground">
        Loading reels…
      </div>
    );
  }

  if (
    (initialId &&
      (longVideoTarget.isLoading ||
        (!dbReels.some((reel) => reel.id === initialId) && targetedMedia.loading))) ||
    openingLongVideo
  ) {
    return (
      <div className="grid h-full min-h-[calc(100dvh-4.75rem)] place-items-center px-6 text-center text-sm text-muted-foreground">
        Opening full video…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="grid h-full min-h-[calc(100dvh-4.75rem)] place-items-center px-6 text-center text-sm text-muted-foreground">
        No reels yet.
      </div>
    );
  }

  if (
    initialId &&
    !items.some(({ reel }) => reel.id === initialId) &&
    !targetedMedia.loading
  ) {
    return (
      <div className="grid h-full min-h-[calc(100dvh-4.75rem)] place-items-center px-6 text-center text-sm text-muted-foreground">
        This reel is no longer available.
      </div>
    );
  }

  return (
    <>
      {items.map(({ reel, author, likedByMe, mediaUrl, mediaType, mediaBucket, thumbnailUrl, access, sourcePost, collaborator, isPending }, i) => (
        <section
          key={reel.id}
          data-index={i}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          className="relative h-[calc(100dvh-4.75rem)] w-full snap-start snap-always overflow-hidden [contain:layout_paint_size] [content-visibility:auto]"
        >
          {/* Only the active reel mounts its player and interaction controls. */}
          {i === active ? (
            isPending ? (
              <PendingReelPreview
                src={mediaUrl}
                title={sourcePost?.title ?? ""}
                caption={reel.caption}
              />
            ) : (
              <ReelItem
                reel={reel}
                currentUserId={currentUserId}
                active
                muted={reelsMuted}
                onMutedChange={setReelsMuted}
                author={author}
                likedByMe={likedByMe}
                mediaUrl={mediaUrl}
                mediaType={mediaType}
                mediaBucket={mediaBucket}
                thumbnailUrl={thumbnailUrl}
                allowFrameCapture={access === "public"}
                scoped={scoped}
                onBack={handleBack}
                collaborator={collaborator}
                onCollaboratorRemoved={() => {
                  void queryClient.invalidateQueries({ queryKey: ["accepted-reel-collaborators"] });
                  void queryClient.invalidateQueries({ queryKey: ["social-posts"] });
                  void targetedMedia.reload();
                }}
                commentsDisabled={!!reelRows[i]?.comments_off}
                hideLikeCount={!!reelRows[i]?.hide_like_count}
                hideShareCount={!!reelRows[i]?.hide_share_count}
                initialCommentsOpen={focusComments && reel.id === initialId && i === active}
                initialCommentId={
                  focusComments && reel.id === initialId ? commentId : undefined
                }
                onDbLike={() => toggleDbLike(reel.id)}
                onShareEvent={
                  currentUserId
                    ? async (method) => {
                        await recordReelShare(reel.id, method);
                        bumpShare(reel.id);
                      }
                    : undefined
                }
                onView={() => recordView(reel.id)}
                onRepost={
                  sourcePost && sourcePost.user_id !== currentUserId
                    ? () => void handleRepost(sourcePost)
                    : undefined
                }
                reposted={
                  Boolean(currentUserId) &&
                  repostedKeys.has(`${currentUserId}:${reel.id}`)
                }
                repostPending={
                  Boolean(currentUserId) &&
                  pendingRepostKeys.has(`${currentUserId}:${reel.id}`)
                }
                canDelete={currentUserId === reel.userId}
                onDeleted={() => {
                  removePost(reel.id);
                  if (reel.id === initialId) setRemovedDirectTargetId(reel.id);
                }}
              />
            )
            ) : (
              <LazyVideoThumbnail
                thumbnailUrl={thumbnailUrl ?? (mediaType?.toLowerCase().startsWith("video") ? null : mediaUrl)}
                mediaUrl={!isPending && access === "public" && mediaType?.toLowerCase().startsWith("video") ? mediaUrl : undefined}
                alt=""
                showPlayFallback={false}
                showFallbackIcon={mediaType?.toLowerCase().startsWith("video")}
                bucket="thumbnails"
                className="absolute inset-0"
              />
            )}
        </section>
      ))}
    </>
  );
}

const REEL_DURATION = 15;

function isHlsManifestUrl(url: string) {
  return /\.m3u8(?:[?#]|$)/i.test(url);
}

function formatTime(value: number) {
  const totalSeconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Renders reel media with graceful recovery: if the stored URL fails to load
 * (expired signed URL, missing public URL) we retry with a freshly resolved
 * Supabase URL, then with a local blob URL from this session, then fall back
 * to an image.
 */
export function ReelMedia({
  postId,
  url,
  type,
  alt,
  authorName,
  authorAvatarUrl,
  posterUrl,
  active,
  muted,
  mediaRef,
  paused = false,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  bucket = "reels",
  allowFrameCapture = true,
}: {
  postId: string;
  url: string;
  type: string;
  alt: string;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  posterUrl?: string | null;
  active: boolean;
  muted: boolean;
  mediaRef: React.MutableRefObject<HTMLElement | null>;
  paused?: boolean;
  onLoadedMetadata?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  bucket?: "reels" | "videos";
  allowFrameCapture?: boolean;
}) {
  const [src, setSrc] = useState(url);
  const [asImage, setAsImage] = useState(!type.startsWith("video"));
  const [posterSrc, setPosterSrc] = useState<string | null>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const image = useScreenImage(asImage ? (mediaFailed && posterSrc ? posterSrc : src) : null);
  const tried = useRef<Set<string>>(new Set());
  const retryGeneration = useRef(0);

  useEffect(() => {
    retryGeneration.current += 1;
    tried.current = new Set();
    setSrc(url);
    setAsImage(!type.startsWith("video"));
    setMediaFailed(false);
    setFrameReady(false);
  }, [url, type]);

  useEffect(() => {
    setGeneratedPoster(getVideoPoster(url));
    return subscribeVideoPoster(url, setGeneratedPoster);
  }, [url]);

  useEffect(() => {
    if (!posterUrl) {
      setPosterSrc(null);
      return;
    }
    let alive = true;
    void resolveMediaUrl(posterUrl, bucket).then((resolved) => {
      if (alive) setPosterSrc(resolved || posterUrl);
    }).catch(() => {
      if (alive) setPosterSrc(posterUrl);
    });
    return () => {
      alive = false;
    };
  }, [bucket, posterUrl]);

  const handleError = useCallback(() => {
    tried.current.add(src);
    const generation = retryGeneration.current;
    void (async () => {
      const local = getLocalMedia(url);
      if (local && !tried.current.has(local)) {
        if (generation !== retryGeneration.current) return;
        setSrc(local);
        return;
      }
      try {
        const resolved = await resolveMediaUrl(url, bucket);
        if (generation !== retryGeneration.current) return;
        if (resolved && !tried.current.has(resolved)) {
          setSrc(resolved);
          return;
        }
      } catch (error) {
        if (generation === retryGeneration.current) {
          console.error("[ReelsMedia] unable to resolve fallback media", error);
        }
      }
      if (generation === retryGeneration.current) {
        setAsImage(true);
        setMediaFailed(true);
      }
    })();
  }, [bucket, src, url]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const pausedRef = useRef(paused);
  const previousPaused = useRef(paused);
  const isHlsManifest = isHlsManifestUrl(src);
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    const previous = videoRef.current;
    if (!element && previous) {
      releaseListVideo(previous);
      retryGeneration.current += 1;
    }
    videoRef.current = element;
    mediaRef.current = element;
  }, [mediaRef]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || asImage || !isHlsManifest || !active) return;
    let alive = true;
    let hls: Hls | null = null;
    let retriedAuthorization = false;
    video.removeAttribute("src");
    video.load();

    const failToPoster = () => {
      if (!alive) return;
      setAsImage(true);
      setMediaFailed(true);
    };
    const startPlayback = async () => {
      const playbackUrl = await resolveAuthorizedPlaybackUrl(postId, src);
      if (!alive) return;
      if (Hls.isSupported()) {
        hls = new Hls(createVideoHlsConfig());
        hlsRef.current = hls;
        bindHlsNetworkAwareLevelCap(hls);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (active && !pausedRef.current) {
            void video.play().catch(() => undefined);
          }
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || !alive || !hls) return;
          if (!retriedAuthorization) {
            retriedAuthorization = true;
            void resolveAuthorizedPlaybackUrl(postId, src)
              .then((freshUrl) => {
                if (alive && hls) hls.loadSource(freshUrl);
              })
              .catch(failToPoster);
          } else {
            failToPoster();
          }
        });
        hls.loadSource(playbackUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playbackUrl;
        video.load();
        if (active && !paused) void video.play().catch(() => undefined);
      } else {
        failToPoster();
      }
    };

    void startPlayback().catch(failToPoster);
    return () => {
      alive = false;
      if (hlsRef.current === hls) hlsRef.current = null;
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [active, asImage, isHlsManifest, postId, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || asImage) return;
    v.muted = muted || !active;
    v.defaultMuted = muted || !active;
    v.volume = active && !muted ? 1 : 0;
  }, [active, asImage, muted, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || asImage) return;
    const wasPaused = previousPaused.current;
    previousPaused.current = paused;
    if (active && !paused) {
      if (wasPaused) {
        v.muted = false;
        v.defaultMuted = false;
        v.volume = 1;
      }
      void v.play().catch(() => {
        // Some browsers block unmuted autoplay. Keep the requested audio
        // state and let the normal tap-to-pause/play gesture retry playback.
      });
    } else {
      v.pause();
    }
  }, [active, asImage, paused, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || active || asImage || isHlsManifest) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
    setFrameReady(false);
  }, [active, asImage, isHlsManifest, src]);

  const className = cn(
    "h-full w-full object-cover will-change-transform [backface-visibility:hidden]",
    active && asImage && "animate-kenburns",
    paused && "[animation-play-state:paused]",
  );

  if (asImage) {
    if (mediaFailed && !posterSrc) {
      return (
        <div
          ref={(el) => {
            mediaRef.current = el;
          }}
          aria-label={alt}
          className="h-full w-full"
        ><LazyVideoThumbnail mediaUrl={allowFrameCapture ? url : undefined}
          thumbnailUrl={posterSrc ?? generatedPoster} bucket={bucket} alt={alt} /></div>
      );
    }
    if (!image.source) return <LazyVideoThumbnail mediaUrl={mediaFailed && allowFrameCapture ? url : undefined}
      thumbnailUrl={posterSrc} bucket={bucket} alt={alt} />;
    return (
      <ProtectedCanvasImage
        src={image.source}
        alt={alt}
        onError={handleError}
        onCanvasReady={(canvas) => {
          mediaRef.current = canvas;
          image.ref.current = canvas;
        }}
        className={className}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <video
        ref={setVideoRef}
        src={active && !isHlsManifest ? src : undefined}
        crossOrigin="anonymous"
        poster={posterSrc ?? generatedPoster ?? VIDEO_POSTER_FALLBACK}
        playsInline
        muted={muted || !active}
        preload="metadata"
        {...({ loading: active ? "eager" : "lazy" } as const)}
        onError={handleError}
        onLoadedData={(event) => {
          const generated = cacheVideoPoster(event.currentTarget, url);
          if (generated) setGeneratedPoster(generated);
          setFrameReady(true);
        }}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        className={`${className} opacity-0`}
      />
      <ProtectedCanvasVideoMirror
        videoRef={videoRef}
        screenBounded
        className={`absolute inset-0 ${className}`}
      />
      <LazyVideoThumbnail
        thumbnailUrl={posterSrc}
        mediaUrl={url}
        allowFrameCapture={!active && allowFrameCapture}
        alt={alt}
        authorName={authorName}
        authorAvatarUrl={authorAvatarUrl}
        className={`pointer-events-none absolute inset-0 z-20 h-full w-full ${
          active && frameReady ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}

async function unlinkReelCollaborator(
  postId: string,
  collaboratorId: string,
) {
  const { error } = await supabase.rpc("remove_reel_collaboration_invite", {
    p_post_id: postId,
    p_collaborator_id: collaboratorId,
  });
  if (error) throw error;
}

function ReelItem({
  reel,
  currentUserId,
  active,
  muted,
  onMutedChange,
  author,
  likedByMe,
  mediaUrl,
  mediaType,
  mediaBucket,
  thumbnailUrl,
  allowFrameCapture = true,
  scoped = false,
  onBack,
  collaborator,
  onCollaboratorRemoved,
  commentsDisabled = false,
  hideLikeCount = false,
  hideShareCount = false,
  initialCommentsOpen = false,
  initialCommentId,
  onDbLike,
  onShareEvent,
  onView,
  onRepost,
  reposted = false,
  repostPending = false,
  canDelete = false,
  onDeleted,
}: {
  reel: Reel;
  currentUserId?: string | null;
  collaborator?: {
    id: string;
    username?: string | null;
    display_name?: string | null;
  } | null;
  onCollaboratorRemoved?: () => void;
  active: boolean;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  author?: User;
  likedByMe?: boolean;
  mediaUrl?: string;
  mediaType?: string;
  mediaBucket?: "reels" | "videos";
  thumbnailUrl?: string | null;
  allowFrameCapture?: boolean;
  scoped?: boolean;
  onBack?: () => void;
  commentsDisabled?: boolean;
  hideLikeCount?: boolean;
  hideShareCount?: boolean;
  initialCommentsOpen?: boolean;
  initialCommentId?: string;
  onDbLike?: () => void | Promise<unknown>;
  onShareEvent?: (method: ReelShareMethod) => void | Promise<void>;
  onView?: () => void | Promise<unknown>;
  onRepost?: () => void;
  reposted?: boolean;
  repostPending?: boolean;
  canDelete?: boolean;
  onDeleted?: () => void;
}) {
  const user = author;
  const { isMediaDownloadInProgress } = useMediaConcurrency();
  const { user: viewer, requestAuthAction } = useAuth();
  const { following, toggleFollow } = useYw();
  const gatedLikeRef = useRef<() => void>(() => {});
  const { burst, onDoubleTap } = useDoubleTapLike(reel.id, () => {
    if (!likedByMe) gatedLikeRef.current();
  });
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastTap = useRef(0);
  const isLiked = !!likedByMe;
  const [liking, setLiking] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removeCollaboratorOpen, setRemoveCollaboratorOpen] = useState(false);
  const [removingCollaborator, setRemovingCollaborator] = useState(false);
  const [collaboratorRemoved, setCollaboratorRemoved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate content / Nudity");
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [contextActionBusy, setContextActionBusy] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoaded, setFavoriteLoaded] = useState(false);
  const viewerId = viewer?.id ?? currentUserId ?? null;
  const isOwnReel = viewerId === reel.userId;
  const visibleCollaborator = collaboratorRemoved ? null : collaborator;
  const shareUrl = buildWatchShareUrl(reel.id, "reel");

  useEffect(() => {
    setCollaboratorRemoved(false);
  }, [collaborator?.id, reel.id]);

  useEffect(() => {
    setFavoriteLoaded(false);
    setIsFavorite(false);
  }, [reel.id, viewerId]);

  useEffect(() => {
    if (!menuOpen || !viewerId) return;
    let alive = true;
    void getPostFavoriteState(viewerId, reel.id)
      .then((saved) => {
        if (alive) {
          setIsFavorite(saved);
          setFavoriteLoaded(true);
        }
      })
      .catch((error) => {
        console.warn("Unable to load Reel favorite state", error);
      });
    return () => {
      alive = false;
    };
  }, [menuOpen, reel.id, viewerId]);

  // ---- playback timeline -------------------------------------------------
  const [progress, setProgress] = useState(0); // 0..100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  // Single tap toggles pause/play; press-and-hold keeps it paused.
  const [held, setHeld] = useState(false);
  const [tappedPause, setTappedPause] = useState(false);
  const paused = held || tappedPause;
  const previousPaused = useRef(paused);
  const barRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLElement | null>(null);
  const seekRaf = useRef<number | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const playedSeconds = useRef(0);
  const lastResumeSavedAt = useRef(0);
  const resumeRemoved = useRef(false);
  const resumeApplied = useRef(false);
  const getVideoElement = useCallback(() => (
    mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null
  ), []);

  useValidatedVideoViewTracker({
    videoId: reel.id,
    ownerId: reel.userId,
    currentUserId: viewer?.id ?? currentUserId,
    enabled: active && !paused && mediaType === "video",
    allowAutomaticLoop: true,
    getVideoElement,
    onCounted: onView,
  });

  useEffect(() => {
    const wasPaused = previousPaused.current;
    previousPaused.current = paused;
    if (active && wasPaused && !paused) onMutedChange(false);
  }, [active, onMutedChange, paused]);

  useEffect(() => {
    playedSeconds.current = 0;
  }, [reel.id]);

  useEffect(() => {
    if (!active || paused || mediaType !== "video") return;
    const timer = window.setInterval(() => {
      const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
      if (
        video &&
        !video.paused &&
        !video.seeking &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        document.visibilityState !== "hidden"
      ) {
        playedSeconds.current += 1;
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [active, mediaType, paused]);

  useEffect(() => {
    lastResumeSavedAt.current = 0;
    resumeRemoved.current = false;
    resumeApplied.current = false;
  }, [reel.id]);

  useEffect(() => () => {
    if (seekRaf.current !== null) cancelAnimationFrame(seekRaf.current);
  }, []);

  const persistResumeAt = useCallback(
    (video: HTMLVideoElement, force = false) => {
      const currentTime = Number.isFinite(video.currentTime) ? Math.max(0, video.currentTime) : 0;
      const duration = Number.isFinite(video.duration) ? Math.max(0, video.duration) : 0;
      const now = Date.now();

      if (duration > 0 && currentTime / duration >= 0.95) {
        if (!resumeRemoved.current) {
          removeVideoResumeEntry(reel.id);
          resumeRemoved.current = true;
        }
        lastResumeSavedAt.current = now;
        return;
      }
      if (currentTime <= 0) return;
      if (!force && now - lastResumeSavedAt.current < 1000) return;

      saveVideoResumeEntry({
        id: reel.id,
        title: reel.caption || "Untitled video",
        thumbnailUrl: thumbnailUrl || reel.thumbnailUrl || "",
        currentTime,
        duration,
        progress: duration > 0 ? currentTime / duration : 0,
        seriesTitle: null,
        episodeNumber: null,
        watchedSeconds: playedSeconds.current,
        updatedAt: now,
      });
      lastResumeSavedAt.current = now;
      resumeRemoved.current = false;
    },
    [reel.caption, reel.id, reel.thumbnailUrl, thumbnailUrl],
  );

  useEffect(() => {
    if (!active) return;
    const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
    const flushResume = () => {
      if (video) persistResumeAt(video, true);
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushResume();
    };
    video?.addEventListener("pause", flushResume);
    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushResume);
    return () => {
      video?.removeEventListener("pause", flushResume);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushResume);
      flushResume();
    };
  }, [active, persistResumeAt]);

  const handleLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    let currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const nextDuration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (!resumeApplied.current) {
      resumeApplied.current = true;
      const savedTime = getVideoResumeEntry(reel.id)?.currentTime;
      if (typeof savedTime === "number" && savedTime > 0 && nextDuration > 0) {
        currentTime = Math.min(savedTime, Math.max(0, nextDuration - 0.1));
        video.currentTime = currentTime;
      }
    }
    setCurrentTime(currentTime);
    setDuration(nextDuration);
  }, [reel.id]);

  const handleTimeUpdate = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const nextTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    setCurrentTime(nextTime);
    if (video.duration && Number.isFinite(video.duration)) {
      setDuration(video.duration);
      setProgress(Math.min(100, Math.max(0, (nextTime / video.duration) * 100)));
    }
    if (active) persistResumeAt(video);
  }, [active, persistResumeAt]);

  const handleEnded = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    removeVideoResumeEntry(reel.id);
    resumeRemoved.current = true;
    lastResumeSavedAt.current = Date.now();
    setCurrentTime(0);
    setProgress(0);
    if (!active) return;
    video.currentTime = 0;
    video.muted = muted;
    video.defaultMuted = muted;
    video.volume = muted ? 0 : 1;
    void video.play()
      .catch(() => {
        // The next normal tap can retry playback without changing audio state.
      });
  }, [active, muted, reel.id]);

  const seekFromEvent = useCallback((clientX: number) => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nextProgress = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setProgress(nextProgress * 100);
    pendingSeek.current = nextProgress;
    if (seekRaf.current !== null) return;
    seekRaf.current = requestAnimationFrame(() => {
      seekRaf.current = null;
      const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
      const target = pendingSeek.current;
      pendingSeek.current = null;
      if (video && target !== null && Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = target * video.duration;
      }
    });
  }, [mediaRef]);

  const onBarPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setScrubbing(true);
    seekFromEvent(e.clientX);
  };
  const onBarPointerMove = (e: React.PointerEvent) => {
    if (!scrubbing) return;
    e.stopPropagation();
    seekFromEvent(e.clientX);
  };
  const endScrub = () => setScrubbing(false);

  // ---- pinch to zoom -----------------------------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef({ dist: 0, scale: 1 });
  const transform = useRef({ scale: 1, x: 0, y: 0 });

  const applyTransform = () => {
    const el = mediaRef.current;
    if (!el) return;
    const { scale, x, y } = transform.current;
    const transformStyle = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    el.style.transform = transformStyle;
    if (el instanceof HTMLVideoElement) {
      const mirror = el.parentElement?.querySelector<HTMLCanvasElement>(
        "canvas.yw-protected-canvas",
      );
      if (mirror) mirror.style.transform = transformStyle;
    }
  };

  // ---- press & hold to pause --------------------------------------------
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStart = useRef({ x: 0, y: 0 });
  const heldRef = useRef(false);

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (heldRef.current) {
      heldRef.current = false;
      setHeld(false);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      holdStart.current = { x: e.clientX, y: e.clientY };
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => {
        heldRef.current = true;
        setHeld(true);
      }, 200);
    }
    if (pointers.current.size === 2) {
      cancelHold();
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        scale: transform.current.scale,
      };
      const el = mediaRef.current;
      if (el) el.style.transition = "none";
      if (el instanceof HTMLVideoElement) {
        const mirror = el.parentElement?.querySelector<HTMLCanvasElement>(
          "canvas.yw-protected-canvas",
        );
        if (mirror) mirror.style.transition = "none";
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1 && !heldRef.current) {
      // Finger drifted → it's a scroll, not a hold.
      const dx = e.clientX - holdStart.current.x;
      const dy = e.clientY - holdStart.current.y;
      if (Math.hypot(dx, dy) > 12) cancelHold();
    }
    if (pointers.current.size !== 2) return;
    e.preventDefault();
    const [a, b] = [...pointers.current.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const scale = Math.min(4, Math.max(1, (dist / pinchStart.current.dist) * pinchStart.current.scale));
    transform.current.scale = scale;
    applyTransform();
  };

  const releasePointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    cancelHold();
    if (pointers.current.size < 2 && transform.current.scale !== 1) {
      transform.current = { scale: 1, x: 0, y: 0 };
      const el = mediaRef.current;
      if (el) el.style.transition = "transform 260ms cubic-bezier(.22,1,.36,1)";
      if (el instanceof HTMLVideoElement) {
        const mirror = el.parentElement?.querySelector<HTMLCanvasElement>(
          "canvas.yw-protected-canvas",
        );
        if (mirror) {
          mirror.style.transition = "transform 260ms cubic-bezier(.22,1,.36,1)";
        }
      }
      applyTransform();
    }
  };

  useEffect(() => () => cancelHold(), []);

  // The player wrapper routes a quick second tap directly to the like action.
  const handlePlayerTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    if (paused) {
      const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
      onMutedChange(false);
      if (video) {
        video.muted = false;
        video.defaultMuted = false;
        video.volume = 1;
        void video.play().catch(() => {
          // Preserve the unmuted state for the effect's retry after React updates.
        });
      }
      setTappedPause(false);
      return;
    }
    setTappedPause(true);
  };

  const enableAudio = useCallback(() => {
    const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    onMutedChange(false);
    if (active && !paused) {
      void video.play()
        .then(() => trackEvent("reel_sound_enabled", { surface: "reels_feed" }))
        .catch(() => {
          // Keep the speaker state unmuted; a later speaker tap can retry.
        });
    } else {
      trackEvent("reel_sound_enabled", { surface: "reels_feed" });
    }
  }, [active, mediaRef, onMutedChange, paused]);

  const toggleAudio = () => {
    const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
    if (!muted) {
      if (video) video.muted = true;
      onMutedChange(true);
      return;
    }
    enableAudio();
  };

  const handleDownload = async (
    choice?: DownloadChoice,
    reportProgress?: (percent: number) => void,
    suppliedLease?: MediaDownloadLease,
  ) => {
    if (!user) return;
    if (!reel.allowDownload) {
      toast.error("The creator has not allowed downloads for this Reel.");
      return;
    }
    const isVideo = mediaType?.startsWith("video") && Boolean(mediaUrl);
    if (isVideo && !currentUserId) {
      toast.error("Sign in to download this Reel.");
      return;
    }
    if (isVideo && !choice) {
      if (isMediaDownloadLocked()) {
        showMediaDownloadBusyToast();
        return;
      }
      setDownloadOpen(true);
      return;
    }
    let downloadLease = suppliedLease;
    let ownsDownloadLease = false;
    if (isVideo && choice && !ownsMediaDownloadLock(downloadLease)) {
      downloadLease = acquireMediaDownloadLock() ?? undefined;
      if (!downloadLease) return;
      ownsDownloadLease = true;
    }
    const repostCreator = reel.caption.match(/^↻ Reposted from @([^\s\r\n]+)/)?.[1];
    const creatorUsername =
      repostCreator || author?.username?.trim().replace(/^@+/, "") || "user";
    const toastId = toast.loading(
      isVideo
        ? choice === "mp3"
          ? "Preparing MP3 audio…"
          : isAndroidNativeDownloads()
            ? "Preparing watermarked MP4 for Gallery…"
            : "Preparing watermarked Reel…"
        : "Preparing image download…",
    );
    try {
      if (isVideo) {
        const selectedTier: VideoQualityTier | undefined =
          choice && choice !== "original" && choice !== "mp3" ? choice : undefined;
        const selection = selectedTier
          ? resolveVideoDownloadSelection(
              selectedTier,
              mediaUrl,
              reel.qualityUrls,
              reel.sourceQualityTier,
              reel.cloudflareStreamId,
            )
          : null;
        if (selectedTier && !selection) {
          throw new Error(`This Reel has no exact ${selectedTier} rendition.`);
        }
        const requestedQuality = !selectedTier
          ? "original"
          : selectedTier === "4320p"
            ? "2160p"
            : selectedTier;
        const offlineSource = await resolveAuthorizedOfflineSource(
          reel.id,
          requestedQuality as
            | "original"
            | "360p"
            | "480p"
            | "720p"
            | "1080p"
            | "1440p"
            | "2160p",
          {
            url: selection?.url ?? mediaUrl!,
            qualityUrl: selection?.usesVariant ? selection.url : null,
            streamId: reel.cloudflareStreamId,
            sourceUrl: mediaUrl,
            bucket: mediaBucket ?? "reels",
            sourceQualityTier: reel.sourceQualityTier,
          },
        );
        const playableUrl = offlineSource.url;
        const baseName = sanitizeDownloadName(reel.caption, `yw-reel-${reel.id}`);
        const resolvedThumbnailUrl = reel.thumbnailUrl
          ? await resolveMediaUrl(reel.thumbnailUrl, mediaBucket ?? "reels")
          : null;
        const downloadMetadata: DownloadedVideoMetadata = {
          ownerId: currentUserId!,
          mediaId: reel.id,
          title: reel.caption || "Untitled Moment",
          creatorName: author?.name ?? "YourWorld athlete",
          creatorUsername,
          creatorId: author?.id ?? null,
          views: reel.views,
          createdAt: reel.createdAt,
          durationSeconds: reel.durationSeconds,
          thumbnailUrl: resolvedThumbnailUrl,
          posterUrl: resolvedThumbnailUrl,
          quality: offlineSource.actualQuality as DownloadedVideoMetadata["quality"],
        };
        if (choice === "mp3") {
          const audioDownload = await downloadAudioOnly(playableUrl, baseName, (percent) => {
            reportProgress?.(percent);
            toast.loading(`Preparing MP3 audio... ${percent}%`, { id: toastId });
          }, downloadLease);
          if (audioDownload === null) return;
        } else if (isAndroidNativeDownloads()) {
          const candidates = [...new Set([playableUrl, ...offlineSource.fallbackUrls])];
          let watermarkedMp4: Blob | null = null;
          let exportError: unknown;
          for (const [index, sourceUrl] of candidates.entries()) {
            try {
              watermarkedMp4 = await createWatermarkedReelMp4Blob(
                sourceUrl,
                creatorUsername,
                (percent) => {
                  const progress = Math.round(percent);
                  reportProgress?.(progress);
                  if (progress === 0 || progress === 100 || progress % 10 === 0) {
                    toast.loading(`Creating watermarked MP4… ${progress}%`, {
                      id: toastId,
                    });
                  }
                },
                selectedTier && !selection?.isSourceFallback ? selectedTier : undefined,
                reel.durationSeconds ?? undefined,
              );
              break;
            } catch (error) {
              exportError = error;
              if (
                error instanceof Error &&
                error.message.includes("cannot encode an MP4")
              ) {
                break;
              }
              if (index < candidates.length - 1) {
                toast.loading("Trying another authorized Reel source…", {
                  id: toastId,
                });
              }
            }
          }
          if (!watermarkedMp4) {
            throw exportError instanceof Error
              ? exportError
              : new Error("The watermarked Reel could not be exported.");
          }
          const savedGallery = await saveReelMp4ToAndroidGallery(
            watermarkedMp4,
            `${baseName}.mp4`,
            (percent) => {
              const progress = Math.round(percent);
              reportProgress?.(Math.min(100, 90 + Math.round(progress * 0.1)));
              if (progress === 0 || progress === 100 || progress % 20 === 0) {
                toast.loading(`Saving Reel to Gallery… ${progress}%`, {
                  id: toastId,
                });
              }
            },
            downloadLease,
          );
          if (savedGallery === null) return;
          trackEvent("reel_downloaded", {
            surface: "reels_feed",
            media_type: "video",
            download_type: "watermarked_gallery_mp4",
            download_quality: choice || "original",
          });
          toast.success("Saved watermarked Reel to Gallery.", { id: toastId });
          return;
        } else {
          const downloadMode = await downloadVideoForOfflineInBackground(
            playableUrl,
            baseName,
            creatorUsername,
            (percent) => {
              reportProgress?.(percent);
            },
            downloadMetadata,
            {
              targetQuality:
                selectedTier && !selection?.isSourceFallback ? selectedTier : undefined,
              fallbackUrls: offlineSource.fallbackUrls,
              transcodeSource: Boolean(
                selectedTier &&
                  !selection?.isSourceFallback &&
                  offlineSource.actualQuality !== selectedTier,
              ),
              watermarkPlacement: "reel",
            },
            downloadLease,
          );
          if (downloadMode === null) return;
          trackEvent("reel_downloaded", {
            surface: "reels_feed",
            media_type: "video",
            download_type:
              downloadMode === "native-offline"
                ? "native_offline_video"
                : "watermarked_video",
            download_quality: choice || "original",
          });
          toast.success(
            downloadMode === "native-offline"
              ? "Saved Reel for offline viewing"
              : "Saved Reel with YourWorld watermark",
            { id: toastId },
          );
          return;
        }
        trackEvent("reel_downloaded", {
          surface: "reels_feed",
          media_type: "video",
          download_type: "audio",
          download_quality: choice || "original",
        });
        toast.success(
          "Saved to your device",
          { id: toastId },
        );
      } else {
        await downloadWithWatermark(
          reel.poster,
          creatorUsername,
          `yw-reel-${reel.id}.jpg`,
          reelWatermarkText(creatorUsername),
        );
        trackEvent("reel_downloaded", {
          surface: "reels_feed",
          media_type: "image",
          download_type: "watermarked_image",
        });
        toast.success("Saved Reel with YourWorld watermark", { id: toastId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      toast.error(message, toastId ? { id: toastId } : undefined);
      if (isVideo && choice) throw error;
    } finally {
      if (ownsDownloadLease && downloadLease) {
        releaseMediaDownloadLock(downloadLease);
      }
    }
  };

  const handleLike = async () => {
    if (!viewer) {
      requestAuthAction({ type: "reel-like", targetId: reel.id });
      return;
    }
    if (!onDbLike || liking) return;
    setLiking(true);
    try {
      await onDbLike();
      trackEvent("reel_like_toggled", {
        surface: "reels_feed",
        liked: !isLiked,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update like");
    } finally {
      setLiking(false);
    }
  };
  gatedLikeRef.current = () => void handleLike();

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteMyPost({
        id: reel.id,
        user_id: reel.userId,
        media_url: mediaUrl ?? reel.poster,
        thumbnail_url: thumbnailUrl,
        kind: mediaBucket === "reels" ? "reel" : "video",
      });
      setDeleteOpen(false);
      onDeleted?.();
      toast.success("Video deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete this media");
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!canDelete || !visibleCollaborator || removingCollaborator) return;
    setRemovingCollaborator(true);
    try {
      await unlinkReelCollaborator(reel.id, visibleCollaborator.id);
      setCollaboratorRemoved(true);
      setRemoveCollaboratorOpen(false);
      onCollaboratorRemoved?.();
      toast.success("Collaborator removed from this Reel");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't remove the collaborator",
      );
    } finally {
      setRemovingCollaborator(false);
    }
  };

  const handleCopyLink = async () => {
    setMenuOpen(false);
    try {
      await copyShareLink(shareUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not copy link");
    }
  };

  const handleNotInterested = async () => {
    setMenuOpen(false);
    if (!viewerId || contextActionBusy) {
      if (!viewerId) toast.error("Sign in to update your feed");
      return;
    }
    setContextActionBusy(true);
    try {
      await markPostNotInterested(viewerId, reel.id);
      announceVideoPostSuppressed(reel.id);
      toast("Video hidden", {
        duration: 4000,
        position: "bottom-center",
        action: {
          label: "Undo",
          onClick: () => {
            void removePostNotInterested(viewerId, reel.id)
              .then(() => {
                announceVideoPostRestored(reel.id);
                toast.success("Video restored");
              })
              .catch((error: unknown) => {
                toast.error(
                  error instanceof Error ? error.message : "Couldn't restore this video",
                );
              });
          },
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your feed");
    } finally {
      setContextActionBusy(false);
    }
  };

  const handleMuteCreator = async () => {
    setMenuOpen(false);
    if (!viewerId || contextActionBusy) {
      if (!viewerId) toast.error("Sign in to mute creators");
      return;
    }
    setContextActionBusy(true);
    try {
      await setLongVideoCreatorHidden(viewerId, reel.userId, true);
      announceVideoCreatorMuted(reel.userId);
      toast.success("Won't suggest posts from this creator");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't mute this creator");
    } finally {
      setContextActionBusy(false);
    }
  };

  const handleFavorite = async () => {
    setMenuOpen(false);
    if (!viewerId || contextActionBusy) {
      if (!viewerId) toast.error("Sign in to save videos");
      return;
    }
    setContextActionBusy(true);
    try {
      const currentSaved = favoriteLoaded
        ? isFavorite
        : await getPostFavoriteState(viewerId, reel.id);
      const nextSaved = await togglePostFavorite(viewerId, reel.id, currentSaved);
      setIsFavorite(nextSaved);
      setFavoriteLoaded(true);
      toast.success(nextSaved ? "Added to Favorites" : "Removed from Favorites");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update Favorites");
    } finally {
      setContextActionBusy(false);
    }
  };

  const handleReport = async () => {
    setMenuOpen(false);
    if (!viewerId || reporting) {
      if (!viewerId) toast.error("Sign in to report videos");
      return;
    }
    setReporting(true);
    try {
      await submitVideoReport({
        reporterId: viewerId,
        creatorId: reel.userId,
        postId: reel.id,
        contentType: "reel",
        reason: reportReason,
        description: reportDescription,
      });
      setReportOpen(false);
      setReportDescription("");
      toast.success("Report submitted. Thank you for making our community safe.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't submit this report");
    } finally {
      setReporting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div
        className="absolute inset-0 touch-pan-y select-none overflow-hidden"
        onClick={handlePlayerTap}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onPointerLeave={releasePointer}
      >
        <ReelMedia
            postId={reel.id}
          url={mediaUrl ?? reel.poster}
          type={mediaType ?? "image"}
          alt={reel.caption}
          authorName={author?.name}
          authorAvatarUrl={reel.authorAvatarUrl}
          posterUrl={thumbnailUrl}
          allowFrameCapture={allowFrameCapture}
          bucket={mediaBucket}
          active={active}
          muted={muted}
          mediaRef={mediaRef}
          paused={paused}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      </div>


      {burst && (
        <Heart className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 animate-burst fill-primary text-primary" />
      )}

      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,24px)_+_1rem)]"
        style={{ paddingTop: '48px' }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {scoped && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/70 text-white shadow-lg"
              aria-label="Back to creator profile"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <h1 className="truncate font-display text-lg font-bold drop-shadow">
            {scoped ? "Creator videos" : "Reels"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
             onClick={toggleAudio}
            className="grid h-8 w-8 place-items-center rounded-full bg-background/40 backdrop-blur"
            aria-label={muted ? "Turn sound on" : "Mute reel"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-16 space-y-2 px-4">
        <div className="flex items-center gap-2.5">
          <Link
            to="/u/$userId"
            params={{ userId: reel.userId }}
            className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-foreground/30 transition-opacity active:opacity-70"
            aria-label={`View ${user.name}'s profile`}
          >
            <div
              className="grid h-full w-full place-items-center"
              style={{
                backgroundImage: `linear-gradient(140deg, oklch(0.55 0.2 ${user.hue}), oklch(0.32 0.12 ${user.hue + 40}))`,
              }}
            >
              <ProfileAvatar
                user={{
                  full_name: user.name,
                  username: user.username,
                  avatar_url: reel.authorAvatarUrl,
                }}
              />
            </div>
          </Link>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 text-sm font-semibold drop-shadow">
            <Link
              to="/u/$userId"
              params={{ userId: reel.userId }}
              className="truncate transition-opacity active:opacity-70"
            >
              @{user.username || user.name}
            </Link>
            {visibleCollaborator ? (
              <>
                <span className="shrink-0 text-xs font-normal text-white/85">and</span>
                <Link
                  to="/u/$userId"
                  params={{ userId: visibleCollaborator.id }}
                  className="max-w-[42%] truncate transition-opacity active:opacity-70"
                >
                  @{visibleCollaborator.username || visibleCollaborator.display_name || "Creator"}
                </Link>
              </>
            ) : null}
            <span className="shrink-0 text-xs font-normal text-gray-300">
              • {reel.createdAt ? timeAgo(reel.createdAt) : "Just now"}
            </span>
          </div>
          {!isOwnReel ? (
            <button
              onClick={() => {
                if (!viewer) {
                  requestAuthAction({ type: "follow-user", targetId: user.id });
                  return;
                }
                void toggleFollow(user.id);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                following[user.id]
                  ? "border-border bg-background/40 text-muted-foreground"
                  : "border-foreground/50",
              )}
            >
              {following[user.id] ? "Following" : "Follow"}
            </button>
          ) : null}
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="block text-left text-sm drop-shadow"
        >
          <span className={cn(!expanded && "line-clamp-1")}>{reel.caption}</span>
          <span className="text-accent"> {reel.hashtags.map((h) => `#${h}`).join(" ")}</span>
        </button>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Music2 className="h-3.5 w-3.5" /> <span className="truncate">{reel.audio}</span>
        </p>
      </div>

      <div
        className="absolute bottom-14 right-3 flex flex-col items-center gap-2.5"
        style={{ right: "14px" }}
      >
        <Action
          onClick={() => void handleLike()}
          label={hideLikeCount ? "Likes hidden" : formatCount(reel.likes)}
          active={isLiked}
        >
          <Heart
            strokeWidth={2.3}
            className={cn(
              "h-[22px] w-[22px] transition-colors",
              isLiked ? "fill-rose-500 text-rose-500" : "text-white",
            )}
          />
        </Action>

        <CommentsSheet
          postId={reel.id}
          commentsDisabled={commentsDisabled}
          initialOpen={initialCommentsOpen}
          initialCommentId={initialCommentId}
        >
          <Action label={formatCount(reel.commentCount)}>
            <MessageCircle strokeWidth={2.3} className="h-[22px] w-[22px]" />
          </Action>
        </CommentsSheet>

        <ShareSheet
          title={reel.caption}
          url={mediaType === "video" ? shareUrl : undefined}
          media={mediaUrl ?? reel.poster}
          mediaKind={mediaType === "video" ? "video" : "photo"}
          contentId={mediaType === "video" ? reel.id : undefined}
          contentKind={mediaType === "video" ? "reel" : undefined}
          momentShare={
            mediaType === "video"
              ? {
                  kind: mediaBucket === "videos" ? "video" : "reel",
                  creatorName: author?.name ?? "Creator",
                  creatorUsername: author?.username ?? "",
                  mediaBucket: mediaBucket === "videos" ? "videos" : "reels",
                  thumbnailUrl: reel.thumbnailUrl,
                }
              : undefined
          }
          thumbnailUrl={reel.thumbnailUrl}
          thumbnailBucket="thumbnails"
          onShareEvent={onShareEvent}
        >
          <Action label={hideShareCount ? "Shares hidden" : formatCount(reel.shares)}>
            <Send strokeWidth={2.3} className="h-[22px] w-[22px]" />
          </Action>
        </ShareSheet>

        <Action
          onClick={onRepost}
          label={repostPending ? "Reposting…" : `${formatCount(reel.reposts ?? 0)} reposts`}
          active={reposted}
          disabled={!onRepost || repostPending || reposted}
        >
          <Repeat2
            strokeWidth={2.3}
            className={cn("h-[22px] w-[22px]", reposted && "text-emerald-300")}
          />
        </Action>

        <div className="relative">
          <Action onClick={() => setMenuOpen((v) => !v)} label="More">
            <MoreVertical strokeWidth={2.3} className="h-[22px] w-[22px]" />
          </Action>
        </div>
      </div>


      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 z-40 cursor-default bg-background/30 backdrop-blur-[2px]"
          />
          <div
            role="menu"
            className="absolute bottom-16 right-3 z-50 w-56 overflow-hidden rounded-2xl border border-border/60 bg-background/85 shadow-2xl backdrop-blur-xl animate-rise"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleCopyLink()}
              className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10"
            >
              <Link2 strokeWidth={1.6} className="h-[17px] w-[17px] text-muted-foreground" />
              Copy Link
            </button>
            {reel.allowDownload ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  const isVideoDownload =
                    mediaType?.startsWith("video") && Boolean(mediaUrl);
                  if (isVideoDownload && isMediaDownloadLocked()) {
                    showMediaDownloadBusyToast();
                    return;
                  }
                  if (isVideoDownload) {
                    if (isAndroidNativeDownloads()) {
                      void handleDownload("original");
                    } else {
                      setDownloadOpen(true);
                    }
                  } else {
                    void handleDownload();
                  }
                }}
                aria-disabled={
                  Boolean(mediaType?.startsWith("video") && mediaUrl) &&
                  isMediaDownloadInProgress
                }
                className={`flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10 ${
                  mediaType?.startsWith("video") && mediaUrl && isMediaDownloadInProgress
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                <Download strokeWidth={1.6} className="h-[17px] w-[17px] text-muted-foreground" />
                Download to Gallery
              </button>
            ) : null}
            {!canDelete ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  disabled={contextActionBusy}
                  onClick={() => void handleNotInterested()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10 disabled:opacity-60"
                >
                  <EyeOff strokeWidth={1.6} className="h-[17px] w-[17px] text-muted-foreground" />
                  Not Interested
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={contextActionBusy}
                  onClick={() => void handleMuteCreator()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10 disabled:opacity-60"
                >
                  <UserX strokeWidth={1.6} className="h-[17px] w-[17px] text-muted-foreground" />
                  Don't Recommend Creator
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10"
                >
                  <Flag strokeWidth={1.6} className="h-[17px] w-[17px] text-muted-foreground" />
                  Report
                </button>
              </>
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={contextActionBusy}
              onClick={() => void handleFavorite()}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10 disabled:opacity-60"
            >
              <Star
                strokeWidth={1.6}
                className={`h-[17px] w-[17px] ${isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
              />
              {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            </button>
            {canDelete ? (
              <>
                {visibleCollaborator ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={contextActionBusy || removingCollaborator}
                    onClick={() => {
                      setMenuOpen(false);
                      setRemoveCollaboratorOpen(true);
                    }}
                    className="flex w-full items-center gap-3 border-t border-border/50 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10 disabled:opacity-60"
                  >
                    <UserX strokeWidth={1.6} className="h-[17px] w-[17px] text-muted-foreground" />
                    Remove Collaborator
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="flex w-full items-center gap-3 border-t border-border/50 px-4 py-3 text-left text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 strokeWidth={1.6} className="h-[17px] w-[17px]" />
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </>
      )}

      {/* timeline / scrubber */}
      <div
        ref={barRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={100}
             aria-valuenow={Math.round(progress)}
        tabIndex={0}
        onPointerDown={onBarPointerDown}
        onPointerMove={onBarPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 flex touch-none cursor-pointer items-end px-3 pb-3 pt-6"
      >
        <div className="relative w-full">
          <span className="pointer-events-none absolute bottom-2 right-0 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div
            className={cn(
              "w-full overflow-hidden rounded-full bg-foreground/20 transition-all duration-200",
              scrubbing ? "h-1.5" : "h-[3px]",
            )}
          >
            <div
               className={cn(
                  "h-full rounded-full bg-pink-500 transition-[width] duration-100 ease-linear",
                 scrubbing && "transition-none",
               )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -ml-[7px] h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-foreground shadow-lg transition-transform duration-200",
              scrubbing ? "scale-100" : "scale-0",
            )}
             style={{ left: `${progress}%` }}
          />
        </div>
      </div>
      <DownloadSheet
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        title={reel.caption || "YourWorld reel"}
        durationSeconds={reel.durationSeconds ?? REEL_DURATION}
        sourceQualityTier={reel.sourceQualityTier ?? null}
        qualityMediaUrls={reel.qualityUrls}
        cloudflareStreamId={reel.cloudflareStreamId}
        sourceMediaUrl={mediaUrl}
        mediaBucket={mediaBucket ?? "reels"}
        enforceSourceQualityLimit={false}
        onDownload={handleDownload}
      />
      <AlertDialog open={reportOpen} onOpenChange={(open) => !reporting && setReportOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this Reel</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the reason that best describes this Reel.
            </AlertDialogDescription>
            <div
              role="radiogroup"
              aria-label="Report reason"
              className="mt-3 grid w-full gap-2"
            >
              {[
                "Inappropriate content / Nudity",
                "Spam or Scam",
                "Hate speech or Harassment",
                "Intellectual Property / Copyright",
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-left text-sm text-foreground transition-colors ${
                    reportReason === reason
                      ? "border-violet-400 bg-violet-500/15"
                      : "border-border bg-background/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="reel-report-reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    className="h-4 w-4 shrink-0 accent-violet-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <label className="mt-3 block text-left">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Additional details (optional)
              </span>
              <textarea
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Add context to help the review team"
                className="w-full resize-y rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-violet-400"
              />
            </label>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={reporting}
              onClick={(event) => {
                event.preventDefault();
                void handleReport();
              }}
            >
              {reporting ? "Submitting…" : "Submit report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={removeCollaboratorOpen}
        onOpenChange={(open) => {
          if (!removingCollaborator) setRemoveCollaboratorOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this collaborator?</AlertDialogTitle>
            <AlertDialogDescription>
              {visibleCollaborator
                ? `This will unlink @${visibleCollaborator.username || visibleCollaborator.display_name || "Creator"} from this Reel. The Reel itself will stay on your profile.`
                : "This will unlink the collaborator from this Reel. The Reel itself will stay on your profile."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingCollaborator}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removingCollaborator}
              onClick={(event) => {
                event.preventDefault();
                void handleRemoveCollaborator();
              }}
            >
              {removingCollaborator ? "Removing…" : "Remove collaborator"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Action({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "group flex w-12 shrink-0 flex-col items-center gap-1 text-foreground transition-transform duration-150 active:scale-90 disabled:pointer-events-none disabled:opacity-60",
        active && "animate-pop",
      )}
    >
      <span
        className="grid h-9 w-9 place-items-center text-white"
        style={{ filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.6))" }}
      >
        {children}
      </span>
      <span className="w-full truncate text-center text-[11px] font-semibold tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]">
        {label}
      </span>
    </button>

  );
}
