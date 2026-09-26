import React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LongVideoCard } from "@/components/yw/LongVideoCard";
import { VideoPoster } from "@/components/yw/VideoPoster";
import { useLongVideos, type LongVideo } from "@/lib/video-data";
import { setVideoQueue } from "@/lib/video-queue";
import { Search, Heart, Plus, MoreVertical, Play } from "lucide-react";
import { useMoments } from "@/lib/moment-context";
import { useAlertsCount } from "@/lib/alerts-count";
import { useAuth } from "@/lib/auth-store";
import { useActiveLiveStreams } from "@/lib/live-data";
import ywLogo from "@/assets/yw-logo.png";
import { ProfileAvatar } from "@/components/yw/ProfileAvatar";

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

function HomePage() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = React.useState(false);
  const {
    videos,
    loading,
    currentUserId,
    countView,
    toggleLike,
    reload,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  } = useLongVideos();
  const { moments } = useMoments();
  const { user } = useAuth();
  const {
    streams: liveStreams,
    error: liveStreamsError,
  } = useActiveLiveStreams();
  const { count: alertCount } = useAlertsCount();
  React.useEffect(() => setHydrated(true), []);

  React.useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 900) {
        void loadMore();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  // Keep the fullscreen swipe queue in sync with the feed.
  React.useEffect(() => {
    setVideoQueue(
      videos.map((v) => ({
        id: v.id,
        title: v.title,
        mediaUrl: v.mediaUrl,
        thumbnailUrl: v.thumbnailUrl,
        portrait: v.orientation === "portrait",
      })),
    );
  }, [videos]);

  const myLatest = React.useMemo(
    () => moments.find((m) => m.mine),
    [moments],
  );
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
    const list: StoryRing[] = [];
    for (const m of moments) {
      if (m.mine) continue;
      const uid = m.author?.id;
      if (!uid) continue;
      if (!seen.has(uid)) {
        seen.add(uid);
        list.push({
          userId: uid,
          username: m.author?.username ?? "user",
          displayName: m.author?.name || m.author?.username || "user",
          avatarUrl: m.author?.avatar ?? undefined,
          hasUnseen: true,
          momentId: m.id,
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

  const feedGroups = React.useMemo<
    Array<
      | { kind: "standard"; video: LongVideo }
      | { kind: "vertical"; verticalPostsGroup: LongVideo[] }
    >
  >(() => {
    const groups: Array<
      | { kind: "standard"; video: LongVideo }
      | { kind: "vertical"; verticalPostsGroup: LongVideo[] }
    > = [];

    for (const video of videos) {
      const title = video.title.toLowerCase();
      const hasPortraitDimensions =
        typeof video.originalWidth === "number" &&
        typeof video.originalHeight === "number" &&
        video.originalHeight > video.originalWidth;
      const isVertical =
        video.aspectRatio === "9:16" ||
        video.videoType === "vertical" ||
        Boolean(video.isReel) ||
        video.postType === "vertical" ||
        hasPortraitDimensions ||
        video.orientation === "portrait" ||
        title.includes("#shorts") ||
        title.includes("#reel");
      const previous = groups[groups.length - 1];

      if (
        isVertical &&
        previous?.kind === "vertical" &&
        previous.verticalPostsGroup.length < 2
      ) {
        previous.verticalPostsGroup.push(video);
      } else if (isVertical) {
        groups.push({ kind: "vertical", verticalPostsGroup: [video] });
      } else {
        groups.push({ kind: "standard", video });
      }
    }

    return groups;
  }, [videos]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-900 bg-black px-4 pb-3 pt-[calc(env(safe-area-inset-top,24px)_+_0.75rem)]">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={ywLogo} alt="YourWorld" className="h-8 w-auto object-contain" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            YourWorld
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/search" className="p-2 rounded-full hover:bg-neutral-900 text-neutral-200 transition-colors">
            <Search className="w-[22px] h-[22px]" strokeWidth={1.8} />
          </Link>
          <Link to="/notifications" className="relative p-2 rounded-full hover:bg-neutral-900 text-neutral-200 transition-colors">
            <Heart className="w-[22px] h-[22px]" strokeWidth={1.8} />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-pink-600 text-[10px] font-bold rounded-full flex items-center justify-center text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Stories / Moments Tray */}
      <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto no-scrollbar border-b border-neutral-900/60 bg-black">
        <div className="flex flex-col items-center gap-1 shrink-0">
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
            className={`relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr ${
              myActiveLiveStream
                ? "live-avatar-ring from-rose-300 via-red-500 to-fuchsia-500"
                : "from-pink-500 to-purple-600"
            } flex items-center justify-center`}
            aria-label={myActiveLiveStream ? "Open your live broadcast" : "Open your moment"}
          >
            <div className="w-full h-full rounded-full bg-neutral-900 border-2 border-black overflow-hidden flex items-center justify-center">
              <MomentAvatar
                username={myUsername}
                fullName={myLatest?.author?.name}
                src={myAvatarUrl}
              />
            </div>
            {/* Always-on "add another moment" badge (Snapchat-style) */}
            <span
              role="button"
              aria-label="Add another moment"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/moment/create" });
              }}
              className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-pink-500 border-2 border-black"
            >
              <Plus className="h-3 w-3 text-white" strokeWidth={3} />
            </span>
          </button>
          {myActiveLiveStream && (
            <span className="live-avatar-badge -mt-1 rounded-full border border-rose-200/40 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-2 py-0.5 text-[8px] font-black tracking-[0.14em] text-white shadow-lg shadow-rose-500/40">
              LIVE
            </span>
          )}
          <span className="text-xs text-neutral-300 font-medium truncate max-w-[68px]">
            Your moment
          </span>
        </div>

        {stories.map((s) => (
          <div key={s.userId} className="flex flex-col items-center gap-1 shrink-0">
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
              className={`relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr ${
                s.liveStreamId
                  ? "live-avatar-ring from-rose-300 via-red-500 to-fuchsia-500"
                  : "from-pink-500 via-purple-500 to-yellow-500"
              } flex items-center justify-center`}
              aria-label={
                s.liveStreamId
                  ? `Watch ${s.displayName} live`
                  : `Open ${s.displayName}'s moment`
              }
            >
              <div className="w-full h-full rounded-full bg-neutral-900 border-2 border-black overflow-hidden">
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
            <span className="text-xs text-neutral-400 truncate max-w-[68px]">
              <span className="truncate">{s.displayName}</span>
            </span>
          </div>
        ))}
      </div>
      {liveStreamsError && (
        <p className="border-b border-neutral-900/60 bg-black px-4 pb-2 text-center text-[11px] text-rose-300/80" role="status">
          Live status is temporarily unavailable.
        </p>
      )}

      {/* Main Long Video Feed */}
      <main className="max-w-lg mx-auto px-2 sm:px-4 py-4 space-y-4">
        {!hydrated || loading ? (
          <div className="text-center py-12 text-neutral-500 text-sm">Loading feed...</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-sm">No videos yet. Be the first to share!</div>
        ) : (
          feedGroups.map((group) =>
            group.kind === "vertical" ? (
              <div
                key={group.verticalPostsGroup[0]?.id}
                className="grid grid-cols-2 gap-2.5 px-3 py-2 w-full"
              >
                {group.verticalPostsGroup.map((video) => {
                  const post = video as LongVideo & {
                    media_url?: string | null;
                    thumbnail_url?: string | null;
                    poster_url?: string | null;
                    views_count?: number | null;
                  };
                  return (
                    <button
                      type="button"
                      key={post.id}
                      aria-label={`Open ${post.title || "Shorts"}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        window.location.href = `/video/${post.id}`;
                      }}
                      className="group relative z-20 block aspect-[9/16] w-full cursor-pointer touch-manipulation select-none overflow-hidden rounded-2xl border-0 bg-zinc-900 p-0 text-left"
                    >
                      <VideoPoster
                        mediaUrl={post.media_url || post.mediaUrl}
                        thumbnailUrl={
                          post.thumbnail_url || post.poster_url || post.thumbnailUrl || undefined
                        }
                        alt={post.title || "Shorts"}
                        loading="lazy"
                        bucket="videos"
                        className="pointer-events-none select-none"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-black/70 text-white shadow-lg">
                          <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" />
                        </span>
                      </span>
                      <div className="pointer-events-none absolute top-2 right-2 p-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 flex flex-col justify-end">
                        <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                          {post.title || "Shorts"}
                        </p>
                        <span className="text-[10px] text-zinc-300 mt-1">
                          {post.views_count || post.views || 0} views
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <LongVideoCard
                key={group.video.id}
                video={group.video}
                currentUserId={currentUserId}
                onView={countView}
                onLike={toggleLike}
                onDeleted={() => reload()}
              />
            ),
          )
        )}
        {isFetchingNextPage ? (
          <p className="py-3 text-center text-xs text-neutral-500">Loading more videos…</p>
        ) : null}

      </main>
    </div>
  );
}
