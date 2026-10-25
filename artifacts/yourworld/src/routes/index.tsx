import React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FeedVideoShelfPreview } from "@/components/yw/FeedVideoShelfPreview";
import { FeedVideoTray } from "@/components/yw/FeedVideoTray";
import { LongVideoCard } from "@/components/yw/LongVideoCard";
import { LazyVideoThumbnail } from "@/components/yw/LazyVideoThumbnail";
import {
  FeedVideoAutoplayProvider,
} from "@/components/yw/FeedVideoAutoplay";
import { VirtualizedFeedWindow } from "@/components/yw/VirtualizedFeedWindow";
import {
  formatDuration,
  loadLongVideosByIds,
  useLongVideos,
  type LongVideo,
} from "@/lib/video-data";
import { setVideoQueue } from "@/lib/video-queue";
import { Search, Heart, Plus } from "lucide-react";
import { useMoments } from "@/lib/moment-context";
import { useAlertsCount } from "@/lib/alerts-count";
import { useAuth } from "@/lib/auth-store";
import { useActiveLiveStreams } from "@/lib/live-data";
import ywLogo from "@/assets/yw-logo.png";
import { ProfileAvatar } from "@/components/yw/ProfileAvatar";
import { useVideoPlayback } from "@/lib/video-playback";
import {
  LONG_VIDEO_PLAYBACK_PREFETCH_STALE_MS,
  longVideoPlaybackQueryOptions,
} from "@/lib/video-playback-data";
import {
  getUnfinishedVideoResumes,
  requestVideoResume,
  useVideoResumeEntries,
} from "@/lib/video-resume";
import { getAppScrollContainer } from "@/lib/app-scroll-container";
import {
  buildHomeVerticalVideoShelfBatches,
  HOME_SHORTS_INTERVAL,
  rankHomeVerticalVideos,
} from "@/lib/home-short-video-recommendations";

type FeedItem =
  | {
      kind: "standard";
      key: string;
      video: LongVideo;
      prefetchNextVideos: Array<Pick<LongVideo, "mediaUrl" | "access" | "durationSeconds">>;
    }
  | {
      kind: "vertical-shelf";
      key: string;
      videos: LongVideo[];
    };

function estimateFeedItemHeight(item: FeedItem) {
  if (item.kind === "vertical-shelf") {
    const viewportWidth = typeof window === "undefined" ? 402 : window.innerWidth;
    const shelfCardWidth = Math.max(0, Math.min(viewportWidth, 512) - 52) / 2;
    return Math.max(240, Math.ceil(shelfCardWidth * (16 / 9)));
  }
  return item.video.orientation === "portrait" ? 920 : 660;
}

function isVerticalLongVideo(video: LongVideo) {
  const title = video.title.toLowerCase();
  const hasPortraitDimensions =
    typeof video.originalWidth === "number" &&
    typeof video.originalHeight === "number" &&
    video.originalHeight > video.originalWidth;

  return (
    video.aspectRatio === "9:16" ||
    video.videoType === "vertical" ||
    Boolean(video.isReel) ||
    video.postType === "vertical" ||
    hasPortraitDimensions ||
    video.orientation === "portrait" ||
    title.includes("#shorts") ||
    title.includes("#reel")
  );
}

const FeedTopBar = React.memo(function FeedTopBar({
  alertCount,
}: {
  alertCount: number;
}) {
  return (
    <header
      className="feed-header sticky top-0 z-50 flex min-h-14 items-center justify-between gap-3 border-b border-neutral-900 bg-black px-4 pb-2"
      style={{ paddingTop: "48px" }}
    >
      <Link
        to="/"
        aria-label="YourWorld home"
        className="flex min-w-0 items-center gap-2"
      >
        <img src={ywLogo} alt="" className="h-7 w-auto shrink-0 object-contain" />
        <span className="truncate bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-[21px] font-semibold tracking-tight text-transparent">
          YourWorld
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          to="/search"
          aria-label="Search"
          className="grid size-10 place-items-center rounded-full text-neutral-200 transition-colors hover:bg-neutral-900"
        >
          <Search className="size-6 max-h-6 max-w-6" strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <Link
          to="/notifications"
          aria-label={alertCount > 0 ? `Notifications, ${alertCount} unread` : "Notifications"}
          className="relative grid size-10 place-items-center rounded-full text-neutral-200 transition-colors hover:bg-neutral-900"
        >
          <Heart className="size-6 max-h-6 max-w-6" strokeWidth={1.8} aria-hidden="true" />
          {alertCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
});

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "YourWorld – Moments, Reels & Chat" },
      { name: "description", content: "YourWorld (YW) is a premium social app for sharing moments, reels, stories and private chat." },
      { property: "og:title", content: "YourWorld – Moments, Reels & Chat" },
      { property: "og:description", content: "Share moments, watch reels and chat privately on YourWorld." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function MomentAvatar({
  username,
  fullName,
  src,
}: {
  username: string;
  fullName?: string | null;
  src?: string | null;
}) {
  return <ProfileAvatar user={{ full_name: fullName, username, avatar_url: src }} />;
}

type LongVideoQuery = ReturnType<typeof useLongVideos>;
type VideoResumeEntry = ReturnType<typeof getUnfinishedVideoResumes>[number];
type ContinueWatchingItem = { video: LongVideo; entry: VideoResumeEntry };

type HomeVideoFeedProps = Pick<
  LongVideoQuery,
  "currentUserId" | "isFetchingNextPage"
> & {
  feedItems: FeedItem[];
  feedAutoplayDisabled: boolean;
  hydrated: boolean;
  loading: boolean;
  videos: LongVideo[];
  hasContinueWatching: boolean;
};

const HomeVideoFeed = React.memo(function HomeVideoFeed({
  feedItems,
  feedAutoplayDisabled,
  hydrated,
  loading,
  videos,
  hasContinueWatching,
  currentUserId,
  isFetchingNextPage,
}: HomeVideoFeedProps) {
  const navigate = useNavigate();
  const renderFeedItem = React.useCallback(
    (item: FeedItem) => {
      if (item.kind === "vertical-shelf") {
        return (
          <FeedVideoTray
            videos={item.videos}
            renderPreview={(video) => <FeedVideoShelfPreview video={video} />}
            onOpenVideo={(video) => {
              void navigate({
                to: "/video/$videoId",
                params: { videoId: video.id },
              });
            }}
          />
        );
      }

      return (
        <LongVideoCard
          key={item.key}
          video={item.video}
          prefetchNextVideos={item.prefetchNextVideos}
          currentUserId={currentUserId}
        />
      );
    },
    [currentUserId, navigate],
  );

  return (
    <FeedVideoAutoplayProvider disabled={feedAutoplayDisabled}>
      {({ activeVideoId }) => {
        const pinnedKey = activeVideoId
          ? feedItems.find(
              (item) =>
                item.kind === "standard" && item.video.id === activeVideoId,
            )?.key ?? null
          : null;

        return (
          <main className="feed-post-list flex flex-col gap-[10px] max-w-lg mx-auto px-2 sm:px-4 pt-0 pb-4">
            {!hydrated || loading ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                Loading feed...
              </div>
            ) : null}
            {hydrated &&
            !loading &&
            feedItems.length === 0 &&
            videos.length === 0 &&
            !hasContinueWatching ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                No videos yet. Be the first to share!
              </div>
            ) : hydrated && !loading && feedItems.length > 0 ? (
              <VirtualizedFeedWindow
                items={feedItems}
                pinnedKey={pinnedKey}
                estimateHeight={estimateFeedItemHeight}
                renderItem={renderFeedItem}
              />
            ) : null}
            {isFetchingNextPage ? (
              <p className="py-3 text-center text-xs text-neutral-500">
                Loading more videos…
              </p>
            ) : null}
          </main>
        );
      }}
    </FeedVideoAutoplayProvider>
  );
});

function ContinueWatchingShelf({
  items,
  onOpen,
  onPrepare,
}: {
  items: ContinueWatchingItem[];
  onOpen: (item: ContinueWatchingItem) => void;
  onPrepare: (item: ContinueWatchingItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Continue watching"
      className="border-b border-neutral-900/60 bg-black px-4 py-3"
      data-testid="continue-watching-shelf"
    >
      <h2 className="mb-2 text-sm font-semibold text-white">Continue Watching</h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => {
          const { video, entry } = item;
          const duration =
            entry.duration > 0 ? entry.duration : video.durationSeconds ?? 0;
          const progress = duration > 0
            ? Math.max(0, Math.min(100, (entry.currentTime / duration) * 100))
            : 0;
          const thumbnailUrl =
            entry.thumbnailUrl ||
            video.thumbnailUrl ||
            undefined;
          const canCaptureResumeFrame =
            video.access === "public" && video.audienceRestricted !== true;

          return (
            <button
              key={video.id}
              type="button"
              aria-label={`Continue watching ${video.title}`}
              className="w-[208px] shrink-0 snap-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              data-testid={`continue-watching-${video.id}`}
              onClick={() => onOpen({ video, entry })}
              onTouchStart={() => onPrepare(item)}
              onPointerEnter={() => onPrepare(item)}
              onFocus={() => onPrepare(item)}
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900">
                <LazyVideoThumbnail
                  thumbnailUrl={thumbnailUrl}
                  mediaUrl={canCaptureResumeFrame ? video.mediaUrl : null}
                  streamId={canCaptureResumeFrame ? video.cloudflareStreamId : null}
                  alt={video.title}
                  bucket="thumbnails"
                  className="bg-black [&_img]:object-contain"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  frameCacheKey={`continue:${video.id}:${Math.floor(entry.currentTime)}`}
                  frameCaptureTimeSeconds={entry.currentTime}
                  posterTimeSeconds={entry.currentTime}
                  preferVideoFrame={canCaptureResumeFrame}
                  showFrameStatus={false}
                  allowFrameCapture={canCaptureResumeFrame}
                />
                <span className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
                  <span
                    className="block h-full bg-fuchsia-500"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </div>
              <span className="mt-1.5 block truncate text-xs font-medium text-white">
                {video.title || "Untitled video"}
              </span>
              <span className="block text-[11px] text-neutral-400">
                {formatDuration(entry.currentTime)} / {formatDuration(duration)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeVideo } = useVideoPlayback();
  const resumeEntries = useVideoResumeEntries();
  const [hydrated, setHydrated] = React.useState(false);
  const {
    videos,
    loading,
    currentUserId,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  } = useLongVideos();
  const resumeCandidates = React.useMemo(
    () => getUnfinishedVideoResumes(resumeEntries),
    [resumeEntries],
  );
  const resumeVideoQuery = useQuery<LongVideo[]>({
    queryKey: ["long-video-resume-post", resumeCandidates.map((entry) => entry.id)],
    enabled:
      resumeCandidates.length > 0 &&
      resumeCandidates.some(
        (entry) =>
          !videos.some(
            (video) => video.id === entry.id && video.isReel !== true,
          ),
      ),
    staleTime: 60_000,
    queryFn: async () => {
      return loadLongVideosByIds(
        resumeCandidates.map((entry) => entry.id),
        { includeLiveReplays: false },
      );
    },
  });
  const continueWatchingItems = React.useMemo(() => {
    const videosById = new Map<string, LongVideo>();
    for (const video of [...videos, ...(resumeVideoQuery.data ?? [])]) {
      const isReel =
        video.isReel === true ||
        video.videoType?.toLowerCase() === "reel" ||
        video.postType?.toLowerCase() === "reel";
      if (!isReel) videosById.set(video.id, video);
    }
    return resumeCandidates.flatMap((entry) => {
      const video = videosById.get(entry.id);
      return video ? [{ video, entry }] : [];
    });
  }, [resumeCandidates, resumeVideoQuery.data, videos]);
  const continueWatchingIds = React.useMemo(
    () => new Set(continueWatchingItems.map((item) => item.video.id)),
    [continueWatchingItems],
  );
  const latestResumeVideo = continueWatchingItems[0]?.video ?? null;
  const { moments } = useMoments();
  const { user } = useAuth();
  const { streams: liveStreams } = useActiveLiveStreams();
  const { count: alertCount } = useAlertsCount();
  const prepareContinuePlayback = React.useCallback(
    (item: ContinueWatchingItem) => {
      void queryClient.prefetchQuery(
        longVideoPlaybackQueryOptions(
          item.video.id,
          user?.id ?? null,
          LONG_VIDEO_PLAYBACK_PREFETCH_STALE_MS,
        ),
      );
    },
    [queryClient, user?.id],
  );
  const firstContinueItem = continueWatchingItems[0] ?? null;
  React.useEffect(() => {
    if (firstContinueItem) prepareContinuePlayback(firstContinueItem);
  }, [firstContinueItem, prepareContinuePlayback]);
  const homeSwipeStartRef = React.useRef<{
    x: number;
    y: number;
    direction: "undecided" | "horizontal" | "vertical";
  } | null>(null);
  React.useEffect(() => setHydrated(true), []);

  const handleHomeTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    const target = event.target;
    if (
      !touch ||
      (target instanceof Element && target.closest(".touch-pan-x, [data-swipe-navigation-ignore]"))
    ) {
      homeSwipeStartRef.current = null;
      return;
    }
    homeSwipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      direction: "undecided",
    };
    event.currentTarget.style.transition = "none";
    event.currentTarget.style.transform = "translate3d(0, 0, 0)";
  };
  const handleHomeTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const gesture = homeSwipeStartRef.current;
    const touch = event.touches[0];
    if (!gesture || !touch) return;
    const deltaX = touch.clientX - gesture.x;
    const deltaY = touch.clientY - gesture.y;
    if (
      gesture.direction === "undecided" &&
      Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 8
    ) {
      gesture.direction =
        Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }
    if (gesture.direction === "horizontal") {
      const feedbackX = Math.max(-18, Math.min(0, deltaX * 0.08));
      event.currentTarget.style.transform = `translate3d(${feedbackX}px, 0, 0)`;
    } else if (gesture.direction === "vertical") {
      event.currentTarget.style.transform = "translate3d(0, 0, 0)";
    }
  };
  const handleHomeTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const gesture = homeSwipeStartRef.current;
    homeSwipeStartRef.current = null;
    const touch = event.changedTouches[0];
    event.currentTarget.style.transition =
      "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)";
    if (!gesture || !touch) {
      event.currentTarget.style.transform = "translate3d(0, 0, 0)";
      return;
    }
    const deltaX = touch.clientX - gesture.x;
    const deltaY = touch.clientY - gesture.y;
    if (
      gesture.direction === "horizontal" &&
      deltaX <= -50 &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.25
    ) {
      void navigate({ to: "/reels" });
    } else {
      event.currentTarget.style.transform = "translate3d(0, 0, 0)";
    }
  };

  React.useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const scrollContainer = getAppScrollContainer();
    if (!scrollContainer) return;
    const onScroll = () => {
      if (
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 900
      ) {
        void loadMore();
      }
    };
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  // Keep the fullscreen swipe queue in sync with the feed.
  React.useEffect(() => {
    setVideoQueue(
      videos.map((v) => ({
        id: v.id,
        title: v.title,
        mediaUrl: v.mediaUrl,
        thumbnailUrl: v.thumbnailUrl,
        portrait: isVerticalLongVideo(v),
      })),
    );
  }, [videos]);

  const myLatest = React.useMemo(() => {
    const newest = moments.find((moment) => moment.mine);
    if (!newest?.partGroupId) return newest;
    return (
      moments.find(
        (moment) =>
          moment.mine &&
          moment.partGroupId === newest.partGroupId &&
          moment.partIndex === 1,
      ) ?? newest
    );
  }, [moments]);
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const myUsername =
    myLatest?.author?.username ||
    (typeof userMetadata.username === "string" ? userMetadata.username : null) ||
    (typeof userMetadata.user_name === "string" ? userMetadata.user_name : null) ||
    (typeof user?.email === "string" ? user.email.split("@")[0] : null) ||
    "user";
  const myAvatarUrl =
    myLatest?.author?.avatar ||
    (typeof userMetadata.avatar_url === "string" ? userMetadata.avatar_url : null) ||
    (typeof userMetadata.profile_pic === "string" ? userMetadata.profile_pic : null) ||
    (typeof userMetadata.profile_image === "string" ? userMetadata.profile_image : null) ||
    (typeof userMetadata.picture === "string" ? userMetadata.picture : null);

  type StoryRing = {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    hasUnseen: boolean;
    mine?: boolean;
    momentId?: string;
    liveStreamId?: string;
  };

  const stories = React.useMemo<StoryRing[]>(() => {
    const seen = new Set<string>();
    const viewedAuthors = new Set(
      moments
        .filter((moment) =>
          moment.viewers.some((viewer) => viewer.userId === user?.id),
        )
        .map((moment) => moment.author?.id)
        .filter((id): id is string => Boolean(id)),
    );
    const list: StoryRing[] = [];
    for (const m of moments) {
      if (m.mine) continue;
      const uid = m.author?.id;
      if (!uid) continue;
      if (!seen.has(uid)) {
        seen.add(uid);
        const storyStart =
          m.partGroupId
            ? moments.find(
                (part) =>
                  part.author?.id === uid &&
                  part.partGroupId === m.partGroupId &&
                  part.partIndex === 1,
              ) ?? m
            : m;
        list.push({
          userId: uid,
          username: m.author?.username ?? "user",
          displayName: m.author?.name || m.author?.username || "user",
          avatarUrl: m.author?.avatar ?? undefined,
          hasUnseen: !viewedAuthors.has(uid),
          momentId: storyStart.id,
          liveStreamId: liveStreams.find(
            (stream) => stream.broadcaster_id === uid,
          )?.id,
        });
      }
    }
    for (const stream of liveStreams) {
      if (
        seen.has(stream.broadcaster_id) ||
        stream.broadcaster_id === user?.id
      ) {
        continue;
      }
      seen.add(stream.broadcaster_id);
      list.push({
        userId: stream.broadcaster_id,
        username: stream.username,
        displayName: stream.displayName,
        avatarUrl: stream.avatarUrl ?? undefined,
        hasUnseen: true,
        liveStreamId: stream.id,
      });
    }
    return list;
  }, [liveStreams, moments, user?.id]);
  const myActiveLiveStream = liveStreams.find(
    (stream) => stream.broadcaster_id === user?.id,
  );

  const { regularVideos, verticalVideos } = React.useMemo(() => {
    const regular: LongVideo[] = [];
    const vertical: LongVideo[] = [];

    for (const video of videos.filter((item) => !continueWatchingIds.has(item.id))) {
      (isVerticalLongVideo(video) ? vertical : regular).push(video);
    }

    return { regularVideos: regular, verticalVideos: vertical };
  }, [continueWatchingIds, videos]);
  const recentVideoInteractions = React.useMemo(() => {
    const interactions: LongVideo[] = [];
    const seen = new Set<string>();
    const addInteraction = (video: LongVideo) => {
      if (seen.has(video.id)) return;
      seen.add(video.id);
      interactions.push(video);
    };

    if (latestResumeVideo) addInteraction(latestResumeVideo);
    const likedVideos = videos
      .filter((video) => video.likedByMe)
      .sort((left, right) => {
        const leftDate = Date.parse(left.createdAt);
        const rightDate = Date.parse(right.createdAt);
        return (
          (Number.isFinite(rightDate) ? rightDate : 0) -
          (Number.isFinite(leftDate) ? leftDate : 0)
        );
      });
    for (const video of likedVideos) {
      if (interactions.length >= 12) break;
      addInteraction(video);
    }
    return interactions;
  }, [latestResumeVideo, videos]);
  const verticalVideoGroups = React.useMemo(
    () => rankHomeVerticalVideos(verticalVideos, recentVideoInteractions),
    [recentVideoInteractions, verticalVideos],
  );
  const verticalShelfBatches = React.useMemo(
    () =>
      buildHomeVerticalVideoShelfBatches(
        verticalVideoGroups,
        regularVideos.length,
        hasNextPage,
      ),
    [hasNextPage, regularVideos.length, verticalVideoGroups],
  );
  const feedItems = React.useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    if (regularVideos.length === 0) {
      verticalShelfBatches.forEach((batch, index) => {
        items.push({
          kind: "vertical-shelf",
          key: `vertical-video-shelf-${index}`,
          videos: batch,
        });
      });
    } else {
      let shelfIndex = 0;
      regularVideos.forEach((video, index) => {
        const immediateNextVideo = regularVideos[index + 1];
        const prefetchNextVideos =
          immediateNextVideo?.access === "public"
            ? [{
                mediaUrl: immediateNextVideo.mediaUrl,
                access: immediateNextVideo.access,
                durationSeconds: immediateNextVideo.durationSeconds,
              }]
            : [];
        items.push({
          kind: "standard",
          key: `post-${video.id}`,
          video,
          prefetchNextVideos,
        });

        const reachedInterval = (index + 1) % HOME_SHORTS_INTERVAL === 0;
        const finalShortShelf =
          !hasNextPage &&
          regularVideos.length < HOME_SHORTS_INTERVAL &&
          index === regularVideos.length - 1;
        const nextBatch = verticalShelfBatches[shelfIndex];
        if ((reachedInterval || finalShortShelf) && nextBatch?.length) {
          items.push({
            kind: "vertical-shelf",
            key: `vertical-video-shelf-${shelfIndex}`,
            videos: nextBatch,
          });
          shelfIndex += 1;
        }
      });
    }

    return items;
  }, [hasNextPage, regularVideos, verticalShelfBatches]);

  return (
    <div
      className="yw-media-scroll-surface min-h-screen bg-black text-white pb-24"
      style={{
        willChange: "transform",
        transform: "translate3d(0, 0, 0)",
        transition: "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      onTouchStartCapture={handleHomeTouchStart}
      onTouchMoveCapture={handleHomeTouchMove}
      onTouchEndCapture={handleHomeTouchEnd}
      onTouchCancelCapture={(event) => {
        homeSwipeStartRef.current = null;
        event.currentTarget.style.transition =
          "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)";
        event.currentTarget.style.transform = "translate3d(0, 0, 0)";
      }}
    >
      <FeedTopBar alertCount={alertCount} />
      <ContinueWatchingShelf
        items={continueWatchingItems}
        onPrepare={prepareContinuePlayback}
        onOpen={({ video, entry }) => {
          requestVideoResume(video.id, entry.currentTime);
          void navigate({
            to: "/video/$videoId",
            params: { videoId: video.id },
            search: { continueWatching: true },
          });
        }}
      />

      {/* Stories / Moments Tray */}
      <div className="flex snap-x snap-proximity items-center gap-2 overflow-x-auto overscroll-x-contain touch-pan-x scroll-smooth px-4 py-3 no-scrollbar border-b border-neutral-900/60 bg-black">
        <div className="flex min-w-[72px] snap-start flex-col items-center gap-1">
          <div className="relative">
            <button
              onClick={() => {
                if (myActiveLiveStream) {
                  navigate({
                    to: "/live/$streamId",
                    params: { streamId: myActiveLiveStream.id },
                  });
                } else if (myLatest) {
                  navigate({ to: "/moment/$momentId", params: { momentId: myLatest.id } });
                } else {
                  navigate({ to: "/moment/create" });
                }
              }}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr p-[2px] shadow-[0_0_18px_rgba(217,70,239,0.18)] ${
                myActiveLiveStream
                  ? "live-avatar-ring from-rose-300 via-red-500 to-fuchsia-500"
                  : "from-pink-400 via-fuchsia-500 to-violet-600"
              }`}
              aria-label={myActiveLiveStream ? "Open your live broadcast" : "Open your moment"}
            >
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-black bg-neutral-900">
                <MomentAvatar
                  username={myUsername}
                  fullName={myLatest?.author?.name}
                  src={myAvatarUrl}
                />
              </div>
            </button>
            <button
              type="button"
              aria-label="Add another moment"
              onClick={() => navigate({ to: "/moment/create" })}
              className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-black bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30 transition-transform active:scale-90"
            >
              <Plus className="h-3 w-3" strokeWidth={3} />
            </button>
          </div>
          {myActiveLiveStream && (
            <span className="live-avatar-badge -mt-1 rounded-full border border-rose-200/40 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-2 py-0.5 text-[8px] font-black tracking-[0.14em] text-white shadow-lg shadow-rose-500/40">
              LIVE
            </span>
          )}
          <span className="max-w-[70px] truncate text-xs font-medium text-white/90">
            Your moment
          </span>
        </div>

        {stories.map((s) => (
          <div key={s.userId} className="flex min-w-[72px] snap-start flex-col items-center gap-1">
            <button
              onClick={() => {
                if (s.liveStreamId) {
                  navigate({
                    to: "/live/$streamId",
                    params: { streamId: s.liveStreamId },
                  });
                } else if (s.momentId) {
                  navigate({ to: "/moment/$momentId", params: { momentId: s.momentId } });
                }
              }}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr p-[2px] transition-colors duration-300 ${
                s.liveStreamId
                  ? "live-avatar-ring from-rose-300 via-red-500 to-fuchsia-500 shadow-[0_0_18px_rgba(217,70,239,0.18)]"
                  : s.hasUnseen
                    ? "from-yellow-300 via-fuchsia-500 to-violet-600 shadow-[0_0_18px_rgba(217,70,239,0.18)]"
                    : "from-neutral-400 via-neutral-500 to-neutral-400 shadow-none"
              }`}
              aria-label={
                s.liveStreamId
                  ? `Watch ${s.displayName} live`
                  : `Open ${s.displayName}'s moment`
              }
            >
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-black bg-neutral-900">
                <MomentAvatar
                  username={s.username}
                  fullName={s.displayName}
                  src={s.avatarUrl}
                />
              </div>
            </button>
            {s.liveStreamId && (
              <span className="live-avatar-badge -mt-1 rounded-full border border-rose-200/40 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-2 py-0.5 text-[8px] font-black tracking-[0.14em] text-white shadow-lg shadow-rose-500/40">
                LIVE
              </span>
            )}
            <span className="max-w-[70px] truncate text-xs font-medium text-white/90">
              {s.displayName}
            </span>
          </div>
        ))}
      </div>
      {/* Main Long Video Feed */}
      <HomeVideoFeed
        feedItems={feedItems}
        feedAutoplayDisabled={Boolean(activeVideo)}
        hydrated={hydrated}
        loading={loading}
        videos={videos}
        hasContinueWatching={continueWatchingItems.length > 0}
        currentUserId={currentUserId}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
