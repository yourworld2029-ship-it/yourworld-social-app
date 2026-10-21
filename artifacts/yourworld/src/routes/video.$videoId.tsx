import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
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
import { supabase } from "@/integrations/supabase/client";
import {
  announceVideoCreatorMuted,
  announceVideoPostSuppressed,
  announceVideoPostRestored,
  getPostFavoriteState,
  markPostNotInterested,
  removePostNotInterested,
  submitVideoReport,
  togglePostFavorite,
} from "@/lib/video-context-actions";
import { setLongVideoCreatorHidden } from "@/lib/long-video-preferences";
import { deleteMyPost } from "@/lib/profile-data";
import {
  loadLongVideosByIds,
  resolveLongVideoUrl,
  useLongVideos,
  type LongVideo,
} from "@/lib/video-data";
import { isPlayableMediaUrl } from "@/lib/video-playback-engine";
import {
  useVideoPlayback,
  type LongVideoPlayerMenuActions,
  type QualityId,
} from "@/lib/video-playback";
import { useValidatedVideoViewTracker } from "@/lib/video-view-validation";
import { consumeVideoResumeRequest } from "@/lib/video-resume";
import {
  downloadAudioOnly,
  downloadVideoForOfflineInBackground,
  sanitizeDownloadName,
  type DownloadedVideoMetadata,
} from "@/lib/yw-download";
import { useAuth, useResumeAuthAction } from "@/lib/auth-store";
import { useYw } from "@/lib/yw-store";
import {
  getCurrentNetworkHints,
  shouldUseDataSaverOnNetwork,
  useUserPreferences,
  type NetworkHints,
} from "@/lib/user-preferences";
import {
  resolveAuthorizedPlaybackRendition,
  resolveAuthorizedOfflineSource,
  resolveAuthorizedPlaybackUrl,
  resolveAuthorizedStoragePlaybackUrl,
} from "@/lib/video-media-api";
import {
  VIDEO_QUALITY_TIERS,
  resolveVideoDownloadSelection,
  type DownloadQualityUrls,
} from "@/lib/video-quality";
import type { DownloadChoice } from "@/components/yw/DownloadSheet";
import { VideoWatchDetails } from "@/components/yw/VideoWatchDetails";
import type { MediaDownloadLease } from "@/lib/media-concurrency";

type VideoRouteData = {
  video: LongVideo;
  url: string | null;
  locked: boolean;
  qualityMediaUrls: DownloadQualityUrls | null;
  fallbackUrls?: string[];
};

type VideoRouteSearch = {
  focusComments?: boolean;
  commentId?: string;
};

function isRestrictedAudience(row: Record<string, unknown>) {
  if (row.is_private === true || row.is_followers_only === true || row.close_friends_only === true) {
    return true;
  }
  const restrictedAudiences = ["private", "close_friends", "friends", "followers", "only_me"];
  return [row.audience, row.privacy, row.visibility]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((audience) => audience.trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .some((audience) => restrictedAudiences.includes(audience));
}

function readQualityMediaUrls(row: Record<string, unknown>): DownloadQualityUrls | null {
  const raw = row.qualityUrls ?? row.quality_urls;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const source = raw as Record<string, unknown>;
  const qualityMediaUrls: DownloadQualityUrls = {};
  for (const { id } of VIDEO_QUALITY_TIERS) {
    const url = source[id];
    if (typeof url === "string" && url.trim()) qualityMediaUrls[id] = url.trim();
  }
  return Object.keys(qualityMediaUrls).length ? qualityMediaUrls : null;
}

function isCloudflareStreamManifest(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.hostname === "videodelivery.net" ||
        url.hostname.endsWith(".cloudflarestream.com")) &&
      url.pathname.includes("/manifest/video.m3u8")
    );
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/video/$videoId")({
  validateSearch: (search: Record<string, unknown>): VideoRouteSearch => ({
    focusComments: search.focusComments === true || search.focusComments === "true",
    commentId:
      typeof search.commentId === "string" && search.commentId.trim()
        ? search.commentId.trim()
        : undefined,
  }),
  component: VideoRouteComponent,
});

async function loadVideoForPlayback(videoId: string): Promise<VideoRouteData> {
  const video = (
    await loadLongVideosByIds([videoId], {
      includeLiveReplays: true,
      bypassFeedSuppression: true,
    })
  )[0];
  if (!video) throw new Error("Video is no longer available.");

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", video.id)
    .maybeSingle();
  if (postError) throw postError;
  if (!post) throw new Error("Video is no longer available.");
  const row = post as unknown as Record<string, unknown>;

  if (row.archived === true || row.is_hidden === true) {
    throw new Error("Video is no longer available.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  const accessToken = sessionData.session?.access_token;
  const isOwner = user?.id === video.userId;
  const requiresGrant =
    video.access !== "public" ||
    Number(video.price ?? 0) > 0 ||
    isRestrictedAudience(row);

  if (requiresGrant && !isOwner) {
    if (!user || isRestrictedAudience(row)) {
      return { video, url: null, locked: true, qualityMediaUrls: null };
    }
    const { data: grant, error: grantError } = await supabase
      .from("video_access_grants")
      .select("expires_at")
      .eq("post_id", video.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (grantError) throw grantError;

    const grantIsActive =
      !!grant &&
      (grant.expires_at === null ||
        (Number.isFinite(Date.parse(grant.expires_at)) &&
          Date.parse(grant.expires_at) > Date.now()));
    if (!grantIsActive) {
      return { video, url: null, locked: true, qualityMediaUrls: null };
    }
  }

  let url: string | null;
  let fallbackUrls: string[] = [];
  if (isCloudflareStreamManifest(video.mediaUrl)) {
    if (!accessToken) {
      url = video.mediaUrl;
    } else {
      const hasRetainedSource =
        typeof row.video_url === "string" && row.video_url.trim().length > 0;
      const [playbackResult, storageResult] = await Promise.allSettled([
        resolveAuthorizedPlaybackUrl(video.id),
        hasRetainedSource
          ? resolveAuthorizedStoragePlaybackUrl(video.id).catch((error: unknown) => {
              console.warn("[video-playback] retained MP4 fallback could not be resolved", {
                videoId: video.id,
                error: error instanceof Error ? error.message : "unknown error",
              });
              return null;
            })
          : Promise.resolve(null),
      ]);
      const playbackUrl =
        playbackResult.status === "fulfilled" ? playbackResult.value : null;
      const storageFallback =
        storageResult.status === "fulfilled" ? storageResult.value : null;
      if (playbackUrl) {
        url = playbackUrl;
        if (storageFallback) fallbackUrls = [storageFallback];
      } else if (storageFallback) {
        // If the Stream playback token cannot be resolved, start with the
        // retained direct Storage MP4 instead of failing the watch route.
        url = storageFallback;
      } else if (playbackResult.status === "rejected") {
        throw playbackResult.reason;
      } else if (storageResult.status === "rejected") {
        throw storageResult.reason;
      } else {
        throw new Error("The video playback source is unavailable.");
      }
    }
  } else if (
    typeof row.video_url === "string" &&
    row.video_url.startsWith("live-replays/")
  ) {
    const storedMediaUrl = video.mediaUrl
      ? await resolveLongVideoUrl(video.mediaUrl).catch(() => null)
      : null;
    try {
      url = await resolveAuthorizedStoragePlaybackUrl(video.id);
      if (storedMediaUrl && storedMediaUrl !== url) fallbackUrls = [storedMediaUrl];
    } catch (cause) {
      if (storedMediaUrl) {
        console.warn("[video-playback] using the replay's stored signed source URL", {
          videoId: video.id,
        });
        url = storedMediaUrl;
      } else {
        throw cause;
      }
    }
  } else {
    url = await resolveLongVideoUrl(video.mediaUrl);
  }
  if (!url || !isPlayableMediaUrl(url)) {
    throw new Error("The video source is not available.");
  }
  return {
    video,
    url,
    locked: false,
    qualityMediaUrls: readQualityMediaUrls(row),
    fallbackUrls,
  };
}

function VideoRouteComponent() {
  const { videoId } = Route.useParams();
  const { focusComments, commentId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    activeVideo,
    activateVideo,
    closeVideo,
    isPlaying,
    videoRef,
    setLongVideoPlayerMenuActions,
  } = useVideoPlayback();
  const { videos, loadMore, hasNextPage, isFetchingNextPage } = useLongVideos();
  const { user, requestAuthAction } = useAuth();
  const { preferences } = useUserPreferences(user?.id);
  const [networkHints, setNetworkHints] = useState<NetworkHints | null>(
    () => getCurrentNetworkHints(),
  );
  const { following, toggleFollow } = useYw();
  const resumeTimeRef = useRef<number | null>(null);
  const scrollRestoreRef = useRef<Array<{ element: HTMLElement; top: number }> | null>(null);
  const loadMoreTargetRef = useRef<HTMLDivElement | null>(null);
  const [lastPlayableData, setLastPlayableData] = useState<VideoRouteData | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [savedVideoState, setSavedVideoState] = useState<{
    videoId: string;
    saved: boolean | null;
  } | null>(null);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeOverride, setLikeOverride] = useState<{
    videoId: string;
    liked: boolean;
    count: number;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isContextActionBusy, setIsContextActionBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate content / Nudity");
  const [isReporting, setIsReporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const longVideoMenuActionsRef = useRef<LongVideoPlayerMenuActions | null>(null);
  const resolveLongVideoPlaybackQuality = useCallback(
    (quality: Exclude<QualityId, "auto">) =>
      resolveAuthorizedPlaybackRendition(videoId, quality),
    [videoId],
  );
  const useDataSaverRendition = shouldUseDataSaverOnNetwork(
    preferences.dataSaver,
    networkHints,
  );
  useEffect(() => {
    const updateNetwork = () => setNetworkHints(getCurrentNetworkHints());
    const connection = (
      navigator as Navigator & { connection?: EventTarget & NetworkHints }
    ).connection;
    connection?.addEventListener("change", updateNetwork);
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    updateNetwork();
    return () => {
      connection?.removeEventListener("change", updateNetwork);
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);
  const validVideoId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);
  const query = useQuery({
    queryKey: ["long-video-playback", videoId],
    enabled: validVideoId,
    retry: false,
    queryFn: () => loadVideoForPlayback(videoId),
  });
  const currentData =
    query.data?.video.id === videoId && !query.isFetching && !query.data.locked
      ? query.data
      : null;
  const cachedFeedVideo = videos.find((item) => item.id === videoId) ?? null;
  const lastRouteData =
    lastPlayableData?.video.id === videoId ? lastPlayableData : null;
  const cachedRouteData: VideoRouteData | null = cachedFeedVideo
    ? {
        video: cachedFeedVideo,
        url: null,
        locked: false,
        qualityMediaUrls: null,
      }
    : null;
  const visibleData =
    currentData ?? lastRouteData ?? cachedRouteData ?? lastPlayableData;
  const video = visibleData?.video ?? null;
  const isSaved = Boolean(
    savedVideoState &&
      savedVideoState.videoId === video?.id &&
      savedVideoState.saved === true,
  );
  const isSaveStateLoading =
    !!video &&
    !!user?.id &&
    (savedVideoState?.videoId !== video.id || savedVideoState.saved === null);

  useEffect(() => {
    if (!video?.id) {
      setSavedVideoState(null);
      return;
    }
    if (!user?.id) {
      setSavedVideoState({ videoId: video.id, saved: false });
      return;
    }
    let active = true;
    setSavedVideoState({ videoId: video.id, saved: null });
    void getPostFavoriteState(user.id, video.id)
      .then((saved) => {
        if (active) setSavedVideoState({ videoId: video.id, saved });
      })
      .catch((error) => {
        console.warn("Couldn't load saved video state", error);
        if (active) setSavedVideoState({ videoId: video.id, saved: false });
      });
    return () => {
      active = false;
    };
  }, [user?.id, video?.id]);
  const hasResolvedRouteData = Boolean(currentData || lastRouteData);
  const isCurrentVideo = video?.id === videoId && Boolean(currentData);
  const isSwitching = query.isFetching || (!!video && video.id !== videoId);
  const hasLikeOverride = Boolean(video && likeOverride?.videoId === video.id);
  const liked = hasLikeOverride
    ? Boolean(likeOverride?.liked)
    : Boolean(video?.likedByMe);
  const likeCount = hasLikeOverride
    ? Number(likeOverride?.count ?? video?.likeCount ?? 0)
    : Number(video?.likeCount ?? 0);
  const isOwner = Boolean(video && user?.id === video.userId);
  const getVideoElement = useCallback(() => videoRef.current, [videoRef]);
  const handleValidatedView = useCallback(() => {
    queryClient.setQueryData<VideoRouteData>(
      ["long-video-playback", videoId],
      (current) =>
        current
          ? { ...current, video: { ...current.video, views: current.video.views + 1 } }
          : current,
    );
    void queryClient.invalidateQueries({ queryKey: ["long-videos"] });
  }, [queryClient, videoId]);

  useValidatedVideoViewTracker({
    videoId,
    ownerId: video?.userId,
    currentUserId: user?.id,
    enabled: isPlaying && activeVideo?.id === videoId && isCurrentVideo,
    getVideoElement,
    onCounted: handleValidatedView,
  });

  useEffect(() => {
    resumeTimeRef.current = consumeVideoResumeRequest(videoId);
  }, [videoId]);

  useEffect(() => {
    setLikeOverride(null);
    setDisliked(false);
  }, [videoId]);

  useEffect(() => {
    if (
      activeVideo &&
      (!validVideoId ||
        query.isError ||
        (query.data?.video.id === videoId && query.data.locked && !query.isFetching))
    ) {
      closeVideo();
    }
  }, [activeVideo, closeVideo, query.data, query.isError, query.isFetching, validVideoId, videoId]);

  useEffect(() => {
    if (currentData) setLastPlayableData(currentData);
  }, [currentData]);

  useEffect(() => {
    const data = query.data;
    if (
      !data ||
      query.isFetching ||
      data.locked ||
      !data.url ||
      data.video.id !== videoId
    ) return;

    let active = true;
    void (async () => {
      let playbackUrl = data.url!;
      if (useDataSaverRendition) {
        try {
          playbackUrl = await resolveLongVideoPlaybackQuality("480p");
        } catch (error) {
          console.warn(
            "[data-saver] 480p rendition unavailable; keeping adaptive playback",
            error,
          );
        }
      }
      if (!active) return;
      activateVideo({
        id: data.video.id,
        url: playbackUrl,
        title: data.video.title,
        thumbnailUrl: data.video.thumbnailUrl,
        fallbackUrls: data.fallbackUrls,
        resolvePlaybackQuality: resolveLongVideoPlaybackQuality,
        initialTime: resumeTimeRef.current ?? undefined,
      });
      resumeTimeRef.current = null;
    })();
    return () => {
      active = false;
    };
  }, [
    activateVideo,
    query.data,
    query.isFetching,
    resolveLongVideoPlaybackQuality,
    useDataSaverRendition,
    videoId,
  ]);

  useEffect(() => {
    if (
      !cachedFeedVideo ||
      !validVideoId ||
      hasResolvedRouteData ||
      query.isError ||
      query.data?.locked
    ) {
      return;
    }
    if (activeVideo?.id === cachedFeedVideo.id && activeVideo.url) return;

    activateVideo({
      id: cachedFeedVideo.id,
      url: "",
      title: cachedFeedVideo.title,
      thumbnailUrl: cachedFeedVideo.thumbnailUrl,
    });
  }, [
    activateVideo,
    activeVideo,
    cachedFeedVideo,
    hasResolvedRouteData,
    query.data?.locked,
    query.isError,
    validVideoId,
  ]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !loadMoreTargetRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const scrollRoot = document.querySelector<HTMLElement>(".yw-video-detail-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) {
          void loadMore();
        }
      },
      { root: scrollRoot, rootMargin: "320px 0px" },
    );
    observer.observe(loadMoreTargetRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  useEffect(() => {
    const savedPositions = scrollRestoreRef.current;
    if (!savedPositions) return;
    savedPositions.forEach(({ element, top }) => {
      if (element.isConnected) element.scrollTop = top;
    });
    scrollRestoreRef.current = null;
  }, [videoId]);

  const handleLike = async (clearDislike = true) => {
    if (!video || !isCurrentVideo || isLiking) return;
    if (!user?.id) {
      requestAuthAction({ type: "post-like", targetId: video.id });
      return;
    }

    const nextLiked = !liked;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
    if (clearDislike) setDisliked(false);
    setLikeOverride({ videoId: video.id, liked: nextLiked, count: nextCount });
    setIsLiking(true);
    try {
      const result = nextLiked
        ? await supabase.from("likes").upsert(
            { post_id: video.id, user_id: user.id },
            { onConflict: "post_id,user_id", ignoreDuplicates: true },
          )
        : await supabase
            .from("likes")
            .delete()
            .eq("post_id", video.id)
            .eq("user_id", user.id);
      if (result.error) throw result.error;
      void queryClient.invalidateQueries({ queryKey: ["long-videos"] });
      void queryClient.invalidateQueries({ queryKey: ["long-video-playback", video.id] });
    } catch (error) {
      setLikeOverride({ videoId: video.id, liked, count: likeCount });
      toast.error(error instanceof Error ? error.message : "Couldn't update like");
    } finally {
      setIsLiking(false);
    }
  };

  useResumeAuthAction("post-like", video?.id ?? "", () => {
    void handleLike();
  });

  const handleDislike = () => {
    if (!video || !isCurrentVideo || isLiking) return;
    if (!user?.id) {
      toast.error("Sign in to react to videos");
      return;
    }
    setDisliked((current) => !current);
    if (liked) void handleLike(false);
  };

  const handleFollow = () => {
    if (!video || !isCurrentVideo || isOwner) return;
    if (!user?.id) {
      requestAuthAction({ type: "follow-user", targetId: video.userId });
      return;
    }
    void toggleFollow(video.userId);
  };

  useResumeAuthAction("follow-user", video?.userId ?? "", () => {
    if (video && !isOwner) void toggleFollow(video.userId);
  });

  const handleDownload = async (
    choice: DownloadChoice,
    _reportProgress?: (percent: number) => void,
    lease?: MediaDownloadLease,
  ) => {
    const data = query.data;
    if (
      !video ||
      !isCurrentVideo ||
      !data ||
      data.video.id !== videoId ||
      !data.url ||
      isDownloading
    ) return;

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      toast.error(sessionError.message);
      return;
    }
    const ownerId = sessionData.session?.user.id;
    if (!ownerId) {
      toast.error("Sign in to save videos for offline viewing.");
      return;
    }

    const selection =
      choice === "mp3"
        ? null
        : resolveVideoDownloadSelection(
            choice,
            data.url,
            data.qualityMediaUrls,
            video.sourceQualityTier,
          );

    setIsDownloading(true);
    try {
      if (choice !== "mp3" && !selection) {
        throw new Error("This video has no downloadable media");
      }
      let downloadUrl = selection?.url ?? data.url;
      let downloadedQuality: DownloadedVideoMetadata["quality"] =
        (selection?.actualQuality ?? "original") as DownloadedVideoMetadata["quality"];
      const offlineSource = await resolveAuthorizedOfflineSource(
        video.id,
        (choice === "mp3" ? "original" : choice) as
          | "original"
          | "360p"
          | "480p"
          | "720p"
          | "1080p"
          | "1440p"
          | "2160p",
        {
          url: downloadUrl,
          qualityUrl: selection?.usesVariant ? selection.url : null,
          streamId: video.cloudflareStreamId,
          sourceUrl: data.url,
          bucket: "videos",
          sourceQualityTier: video.sourceQualityTier,
        },
      );
      downloadUrl = offlineSource.url;
      downloadedQuality = offlineSource.actualQuality as DownloadedVideoMetadata["quality"];
      if (!downloadUrl) throw new Error("This video has no downloadable media");

      const metadata: DownloadedVideoMetadata = {
        ownerId,
        mediaId: video.id,
        title: video.title,
        creatorName: video.author.name,
        creatorUsername: video.author.username,
        creatorId: video.userId,
        views: video.views,
        createdAt: video.createdAt,
        durationSeconds: video.durationSeconds,
        thumbnailUrl: video.thumbnailUrl,
        posterUrl: video.thumbnailUrl,
        quality: choice === "mp3" ? "original" : downloadedQuality,
      };
      const fileName = sanitizeDownloadName(video.title, `yourworld-video-${video.id}`);

      if (choice === "mp3") {
        const audioDownload = await downloadAudioOnly(data.url, fileName, undefined, lease);
        if (audioDownload === null) return;
        toast.success("Saved to your device");
      } else {
        const result = await downloadVideoForOfflineInBackground(
          downloadUrl,
          fileName,
          video.author.username,
          undefined,
          metadata,
          {
            fallbackUrls: offlineSource.fallbackUrls,
            targetQuality:
              choice !== "original" && !selection?.isSourceFallback
                ? choice
                : undefined,
            transcodeSource:
              choice !== "original" &&
              !selection?.usesVariant &&
              !selection?.isSourceFallback,
            androidSingleGet: true,
          },
          lease,
        );
        if (result === null) return;
        toast.success(
          result === "native-offline"
            ? "Saved video for offline viewing"
            : "Saved video with YourWorld watermark",
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save this video");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleSavedVideo = async () => {
    if (!video?.id || !user?.id || isSavingVideo) {
      if (!user?.id) toast.error("Sign in to save videos");
      return;
    }
    setIsSavingVideo(true);
    try {
      const currentSaved =
        savedVideoState?.videoId === video.id && savedVideoState.saved !== null
          ? savedVideoState.saved
          : await getPostFavoriteState(user.id, video.id);
      const nextSaved = await togglePostFavorite(user.id, video.id, currentSaved);
      setSavedVideoState({ videoId: video.id, saved: nextSaved });
      toast.success(nextSaved ? "Saved to your list" : "Removed from saved");
      void queryClient.invalidateQueries({
        queryKey: ["saved-long-videos", user.id],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update saved videos");
    } finally {
      setIsSavingVideo(false);
    }
  };

  const leaveWatchRoute = () => {
    closeVideo();
    void navigate({ to: "/" });
  };

  const handleNotInterested = async () => {
    if (!video || !isCurrentVideo || isContextActionBusy) return;
    if (!user?.id) {
      toast.error("Sign in to update your feed");
      return;
    }

    setIsContextActionBusy(true);
    let shouldLeave = false;
    try {
      await markPostNotInterested(user.id, video.id);
      announceVideoPostSuppressed(video.id);
      toast("Video hidden", {
        duration: 4000,
        position: "bottom-center",
        action: {
          label: "Undo",
          onClick: () => {
            void removePostNotInterested(user.id, video.id)
              .then(() => {
                announceVideoPostRestored(video.id);
                toast.success("Video restored");
                void navigate({
                  to: "/video/$videoId",
                  params: { videoId: video.id },
                });
              })
              .catch((error: unknown) => {
                toast.error(
                  error instanceof Error ? error.message : "Couldn't restore this video",
                );
              });
          },
        },
      });
      shouldLeave = true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your feed");
    } finally {
      setIsContextActionBusy(false);
    }
    if (shouldLeave) leaveWatchRoute();
  };

  const handleDontRecommendCreator = async () => {
    if (!video || !isCurrentVideo || isContextActionBusy) return;
    if (!user?.id) {
      toast.error("Sign in to update your feed");
      return;
    }

    setIsContextActionBusy(true);
    let shouldLeave = false;
    try {
      await setLongVideoCreatorHidden(user.id, video.userId, true);
      announceVideoCreatorMuted(video.userId);
      toast.success("Won't suggest posts from this creator");
      shouldLeave = true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't hide this creator");
    } finally {
      setIsContextActionBusy(false);
    }
    if (shouldLeave) leaveWatchRoute();
  };

  const handleOpenReport = () => {
    if (!video || !isCurrentVideo) return;
    if (!user?.id) {
      toast.error("Sign in to report videos");
      return;
    }
    setReportOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!video || !isCurrentVideo || !user?.id || isReporting) return;
    setIsReporting(true);
    try {
      await submitVideoReport({
        reporterId: user.id,
        creatorId: video.userId,
        postId: video.id,
        reason: reportReason,
      });
      setReportOpen(false);
      toast.success("Report submitted. Thank you for making our community safe.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't submit this report");
    } finally {
      setIsReporting(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!video || !isCurrentVideo || !isOwner || isDeleting) return;
    setIsDeleting(true);
    let shouldLeave = false;
    try {
      await deleteMyPost({
        id: video.id,
        user_id: video.userId,
        media_url: video.mediaUrl,
        thumbnail_url: video.thumbnailUrl,
        kind: "video",
      });
      void queryClient.invalidateQueries({ queryKey: ["long-videos"] });
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ["saved-long-videos", user.id],
        });
      }
      void queryClient.removeQueries({
        queryKey: ["long-video-playback", video.id],
      });
      setDeleteOpen(false);
      toast.success("Video deleted successfully");
      shouldLeave = true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete this video");
    } finally {
      setIsDeleting(false);
    }
    if (shouldLeave) leaveWatchRoute();
  };

  longVideoMenuActionsRef.current = {
    onNotInterested: () => void handleNotInterested(),
    onDontRecommendCreator: () => void handleDontRecommendCreator(),
    onReport: handleOpenReport,
    ...(isOwner ? { onDelete: () => setDeleteOpen(true) } : {}),
  };

  const registeredLongVideoMenuActions = useMemo<LongVideoPlayerMenuActions>(() => {
    const actions: LongVideoPlayerMenuActions = {
      onNotInterested: () => longVideoMenuActionsRef.current?.onNotInterested(),
      onDontRecommendCreator: () =>
        longVideoMenuActionsRef.current?.onDontRecommendCreator(),
      onReport: () => longVideoMenuActionsRef.current?.onReport(),
    };
    if (isOwner) {
      actions.onDelete = () => longVideoMenuActionsRef.current?.onDelete?.();
    }
    return actions;
  }, [isOwner]);

  useEffect(() => {
    setLongVideoPlayerMenuActions(
      isCurrentVideo ? registeredLongVideoMenuActions : null,
    );
    return () => setLongVideoPlayerMenuActions(null);
  }, [
    isCurrentVideo,
    registeredLongVideoMenuActions,
    setLongVideoPlayerMenuActions,
  ]);

  const handleSelectVideo = (nextVideo: LongVideo) => {
    const scrollContainers = [
      ...document.querySelectorAll<HTMLElement>(
        ".yw-video-detail-scroll, .yw-app-scroll-container",
      ),
    ];
    scrollRestoreRef.current = scrollContainers.map((element) => ({
      element,
      top: element.scrollTop,
    }));
    void navigate({
      to: "/video/$videoId",
      params: { videoId: nextVideo.id },
    });
  };

  if (!validVideoId || query.isError || (query.isSuccess && !query.data)) {
    return (
      <RouteMessage
        title="This video isn’t available"
        description="It may have been removed or shared with a limited audience."
        onBack={() => {
          closeVideo();
          void navigate({ to: "/" });
        }}
        onRetry={validVideoId && query.isError ? () => void query.refetch() : undefined}
      />
    );
  }

  if (
    query.data?.video.id === videoId &&
    query.data.locked &&
    !query.isFetching
  ) {
    return (
      <RouteMessage
        title="This video needs access"
        description="This video is limited to its intended audience or requires an active access grant."
        onBack={() => {
          closeVideo();
          void navigate({ to: "/" });
        }}
      />
    );
  }

  if (!video) {
    return (
      <div className="bg-[#0b0b0d] px-3 pb-8 text-white sm:px-4">
        <div className="mx-auto w-full max-w-lg">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800 via-zinc-950 to-zinc-900"
            />
            <div
              role="status"
              aria-label="Loading video preview"
              data-testid="status-video-loading"
              className="absolute inset-0 grid place-items-center"
            >
              <span className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs text-white/80">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white/90"
                />
                Preparing video…
              </span>
            </div>
          </div>
          <div aria-hidden="true" className="space-y-3 pt-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.07]" />
            <div className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  const recommendationIds = new Set([videoId, video.id]);
  const recommendations = videos.filter((item) => !recommendationIds.has(item.id));

  return (
    <>
      <VideoWatchDetails
        video={video}
        recommendations={recommendations}
        liked={liked}
        disliked={disliked}
        following={Boolean(following[video.userId])}
        isOwner={isOwner}
        isSwitching={isSwitching}
        isLiking={isLiking}
        isSaved={isSaved}
        isSaving={isSavingVideo}
        isSaveStateLoading={isSaveStateLoading}
        isDownloading={isDownloading}
        sourceMediaUrl={isCurrentVideo ? query.data?.url ?? null : null}
        sourceQualityTier={video.sourceQualityTier}
        qualityMediaUrls={isCurrentVideo ? query.data?.qualityMediaUrls ?? null : null}
        initialCommentsOpen={focusComments}
        initialCommentId={commentId}
        onLike={() => void handleLike()}
        onDislike={handleDislike}
        onFollow={handleFollow}
        onToggleSave={() => void handleToggleSavedVideo()}
        onDownload={handleDownload}
        onSelectVideo={handleSelectVideo}
        recommendationsFooter={
          <div className="pb-3 pt-2 text-center">
            <div ref={loadMoreTargetRef} className="h-px w-full" aria-hidden="true" />
            {isFetchingNextPage ? (
              <p className="py-3 text-xs text-zinc-400" role="status">Loading more videos…</p>
            ) : hasNextPage ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.08]"
              >
                Load more videos
              </button>
            ) : null}
          </div>
        }
      />

      <AlertDialog
        open={reportOpen}
        onOpenChange={(open) => !isReporting && setReportOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this video</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the reason that best describes this video.
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
                    name="video-report-reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    className="h-4 w-4 shrink-0 accent-violet-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isReporting}
              onClick={(event) => {
                event.preventDefault();
                void handleSubmitReport();
              }}
            >
              {isReporting ? "Submitting…" : "Submit report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => !isDeleting && setDeleteOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteVideo();
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RouteMessage({
  title,
  description,
  onBack,
  onRetry,
}: {
  title: string;
  description: string;
  onBack: () => void;
  onRetry?: () => void;
}) {
  return (
    <section
      className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white"
      role="alert"
    >
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-white/70">{description}</p>
      <div className="flex items-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Try again
          </button>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
        >
          Back to feed
        </button>
      </div>
    </section>
  );
}