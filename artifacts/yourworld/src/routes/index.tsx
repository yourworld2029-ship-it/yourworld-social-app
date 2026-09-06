import React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePostSaves } from "@/lib/post-actions";
import { LongVideoCard } from "@/components/yw/LongVideoCard";
import { useLongVideos, type LongVideo } from "@/lib/video-data";
import { setVideoQueue } from "@/lib/video-queue";
import { Search, Heart, Plus, MoreVertical } from "lucide-react";
import { useMoments } from "@/lib/moment-store";
import { useAlertsCount } from "@/lib/alerts-count";
import { useAuth } from "@/lib/auth-store";
import ywLogo from "@/assets/yw-logo.png";

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
  src,
  alt,
}: {
  username: string;
  src?: string | null;
  alt: string;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const initial = (username.trim().charAt(0) || "U").toUpperCase();

  React.useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (!src || imageFailed) {
    return (
      <div
        role="img"
        aria-label={`${alt} avatar`}
        className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-xl font-extrabold leading-none text-white"
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setImageFailed(true)}
      className="h-full w-full rounded-full object-cover"
      loading="lazy"
    />
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = React.useState(false);
  const { videos, loading, currentUserId, countView, toggleLike, reload } = useLongVideos();
  const { saved, toggleSave } = usePostSaves();
  const { moments } = useMoments();
  const { user } = useAuth();
  const { count: alertCount } = useAlertsCount();

  React.useEffect(() => setHydrated(true), []);

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
    (typeof userMetadata.picture === "string" ? userMetadata.picture : null);

  type StoryRing = {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    hasUnseen: boolean;
    mine?: boolean;
    momentId?: string;
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
        });
      }
    }
    return list;
  }, [moments]);

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
      const metadata = video as LongVideo & {
        aspect_ratio?: string | null;
        video_type?: string | null;
        is_reel?: boolean | null;
        type?: string | null;
        media_url?: string | null;
      };
      const title = video.title.toLowerCase();
      const isVertical =
        metadata.aspect_ratio === "9:16" ||
        metadata.video_type === "vertical" ||
        Boolean(metadata.is_reel) ||
        metadata.type === "vertical" ||
        Boolean(metadata.media_url && !metadata.media_url.includes("16_9")) ||
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
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-900 bg-black px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
        <Link to="/" className="flex items-center gap-2">
          <img src={ywLogo} alt="YourWorld" className="h-8 w-auto object-contain" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            YourWorld
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/search" className="p-2 rounded-full hover:bg-neutral-900 text-neutral-200 transition-colors">
            <Search className="w-5 h-5" />
          </Link>
          <Link to="/notifications" className="relative p-2 rounded-full hover:bg-neutral-900 text-neutral-200 transition-colors">
            <Heart className="w-5 h-5" />
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
              if (myLatest) {
                navigate({ to: "/moment/$momentId", params: { momentId: myLatest.id } });
              } else {
                navigate({ to: "/moment/create" });
              }
            }}
            className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-neutral-900 border-2 border-black overflow-hidden flex items-center justify-center">
              <MomentAvatar username={myUsername} src={myAvatarUrl} alt="Your avatar" />
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
          <span className="text-xs text-neutral-300 font-medium truncate max-w-[68px]">
            Your moment
          </span>
        </div>

        {stories.map((s) => (
          <div key={s.userId} className="flex flex-col items-center gap-1 shrink-0">
            <button
              onClick={() => {
                if (s.momentId) {
                  navigate({ to: "/moment/$momentId", params: { momentId: s.momentId } });
                }
              }}
              className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500 flex items-center justify-center"
            >
              <div className="w-full h-full rounded-full bg-neutral-900 border-2 border-black overflow-hidden">
                <MomentAvatar username={s.username} src={s.avatarUrl} alt={s.displayName} />
              </div>
            </button>
            <span className="text-xs text-neutral-400 truncate max-w-[68px]">
              {s.displayName}
            </span>
          </div>
        ))}
      </div>

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
                className="grid grid-cols-2 gap-2.5 px-3 py-3 w-full"
              >
                {group.verticalPostsGroup.map((video) => {
                  const post = video as LongVideo & {
                    media_url?: string | null;
                    thumbnail_url?: string | null;
                    poster_url?: string | null;
                    views_count?: number | null;
                  };
                  return (
                    <div
                      key={post.id}
                      onClick={() =>
                        navigate({ to: "/video/$videoId", params: { videoId: post.id } })
                      }
                      className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10"
                    >
                      <video
                        src={post.media_url || post.mediaUrl}
                        poster={post.thumbnail_url || post.poster_url || post.thumbnailUrl || undefined}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 flex flex-col justify-end">
                        <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                          {post.title || "Shorts"}
                        </p>
                        <span className="text-[10px] text-zinc-300 mt-1">
                          {post.views_count || post.views || 0} views
                        </span>
                      </div>
                    </div>
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
                isSaved={!!saved[group.video.id]}
                onToggleSave={toggleSave}
                onDeleted={() => reload()}
              />
            ),
          )
        )}

      </main>
    </div>
  );
}
