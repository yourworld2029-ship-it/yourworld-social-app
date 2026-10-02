import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  loadLongVideosByIds,
  resolveLongVideoUrl,
  useLongVideos,
  type LongVideo,
} from "@/lib/video-data";
import { isPlayableMediaUrl } from "@/lib/video-playback-engine";
import { useVideoPlayback } from "@/lib/video-playback";
import { consumeVideoResumeRequest } from "@/lib/video-resume";
import {
  downloadVideoForOfflineInBackground,
  sanitizeDownloadName,
  type DownloadedVideoMetadata,
} from "@/lib/yw-download";
import { useAuth, useResumeAuthAction } from "@/lib/auth-store";
import { useYw } from "@/lib/yw-store";
import { buildWatchShareUrl } from "@/lib/watch-links";
import { VideoWatchDetails } from "@/components/yw/VideoWatchDetails";

type VideoRouteData = {
  video: LongVideo;
  url: string | null;
  locked: boolean;
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

export const Route = createFileRoute("/video/$videoId")({
  component: VideoRouteComponent,
});

async function loadVideoForPlayback(videoId: string): Promise<VideoRouteData> {
  const video = (await loadLongVideosByIds([videoId]))[0];
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
  const isOwner = user?.id === video.userId;
  const requiresGrant =
    video.access !== "public" ||
    Number(video.price ?? 0) > 0 ||
    isRestrictedAudience(row);

  if (requiresGrant && !isOwner) {
    if (!user || isRestrictedAudience(row)) return { video, url: null, locked: true };
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
    if (!grantIsActive) return { video, url: null, locked: true };
  }

  const url = await resolveLongVideoUrl(video.mediaUrl);
  if (!url || !isPlayableMediaUrl(url)) {
    throw new Error("The video source is not available.");
  }
  return { video, url, locked: false };
}

function VideoRouteComponent() {
  const { videoId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeVideo, activateVideo, closeVideo, isPlaying } = useVideoPlayback();
  const { videos, countView, loadMore, hasNextPage, isFetchingNextPage } = useLongVideos();
  const { user, requestAuthAction } = useAuth();
  const { following, saved, toggleFollow, toggleSave } = useYw();
  const resumeTimeRef = useRef<number | null>(null);
  const scrollRestoreRef = useRef<Array<{ element: HTMLElement; top: number }> | null>(null);
  const loadMoreTargetRef = useRef<HTMLDivElement | null>(null);
  const [lastPlayableData, setLastPlayableData] = useState<VideoRouteData | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [likeOverride, setLikeOverride] = useState<{
    videoId: string;
    liked: boolean;
    count: number;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
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
  const visibleData = currentData ?? lastPlayableData;
  const video = visibleData?.video ?? null;
  const isCurrentVideo = video?.id === videoId && Boolean(currentData);
  const isSwitching = query.isFetching || (!!video && video.id !== videoId);
  const liked =
    likeOverride?.videoId === video?.id
      ? likeOverride.liked
      : Boolean(video?.likedByMe);
  const likeCount =
    likeOverride?.videoId === video?.id
      ? likeOverride.count
      : Number(video?.likeCount ?? 0);
  const isOwner = Boolean(video && user?.id === video.userId);

  useEffect(() => {
    resumeTimeRef.current = consumeVideoResumeRequest(videoId);
  }, [videoId]);

  useEffect(() => {
    setLikeOverride(null);
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

    activateVideo({
      id: data.video.id,
      url: data.url,
      title: data.video.title,
      thumbnailUrl: data.video.thumbnailUrl,
      initialTime: resumeTimeRef.current ?? undefined,
    });
    resumeTimeRef.current = null;
  }, [activateVideo, query.data, query.isFetching, videoId]);

  useEffect(() => {
    if (!isPlaying || activeVideo?.id !== videoId || !isCurrentVideo) return;
    void countView(videoId)
      .then((counted) => {
        if (!counted) return;
        queryClient.setQueryData<VideoRouteData>(
          ["long-video-playback", videoId],
          (current) =>
            current
              ? { ...current, video: { ...current.video, views: current.video.views + 1 } }
              : current,
        );
      })
      .catch(() => {});
  }, [activeVideo?.id, countView, isCurrentVideo, isPlaying, queryClient, videoId]);

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

  const handleLike = async () => {
    if (!video || !isCurrentVideo || isLiking) return;
    if (!user?.id) {
      requestAuthAction({ type: "post-like", targetId: video.id });
      return;
    }

    const nextLiked = !liked;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
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

  const handleDownload = async () => {
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
      quality: "original",
    };
    const fileName = sanitizeDownloadName(video.title, `yourworld-video-${video.id}`);

    setIsDownloading(true);
    try {
      const result = await downloadVideoForOfflineInBackground(
        data.url,
        fileName,
        video.author.username,
        undefined,
        metadata,
      );
      toast.success(
        result === "native-original"
          ? "Saved video for offline viewing"
          : "Saved video with YourWorld watermark",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save this video");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!video || !isCurrentVideo) return;
    try {
      await navigator.clipboard.writeText(buildWatchShareUrl(video.id, "video"));
      toast.success("Video link copied");
    } catch {
      toast.error("Could not copy video link");
    }
  };

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
      <div className="grid min-h-[50vh] place-items-center bg-[#0b0b0d] px-5 text-center text-white">
        <div role="status" aria-label="Loading video" className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white/90"
          />
          <span className="text-sm text-white/65">Loading video and recommendations…</span>
        </div>
      </div>
    );
  }

  const recommendationIds = new Set([videoId, video.id]);
  const recommendations = videos.filter((item) => !recommendationIds.has(item.id));

  return (
    <VideoWatchDetails
      video={video}
      recommendations={recommendations}
      liked={liked}
      likeCount={likeCount}
      following={Boolean(following[video.userId])}
      isOwner={isOwner}
      isSaved={Boolean(saved[video.id])}
      isSwitching={isSwitching}
      isLiking={isLiking}
      isDownloading={isDownloading}
      onLike={() => void handleLike()}
      onFollow={handleFollow}
      onDownload={() => void handleDownload()}
      onCopyLink={() => void handleCopyLink()}
      onToggleSave={() => toggleSave(video.id)}
      onOpenCreator={() => {
        void navigate({ to: "/u/$userId", params: { userId: video.userId } });
      }}
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