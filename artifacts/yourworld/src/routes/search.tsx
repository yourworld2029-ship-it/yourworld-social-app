import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Eye,
  Film,
  Hash,
  Play,
  Search,
  Tag,
  TrendingUp,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/lib/search-store";
import { ProfileAvatar } from "@/components/yw/ProfileAvatar";
import { VideoPoster } from "@/components/yw/VideoPoster";
import { formatCount } from "@/lib/yw-data";
import { formatDuration, formatViews } from "@/lib/video-data";
import { useYw } from "@/lib/yw-store";
import { supabase } from "@/integrations/supabase/client";
import {
  loadSearchData,
  searchPublicProfiles,
  type SearchUser,
  type SearchVideo,
} from "@/lib/search-data";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [{ title: "Search · YourWorld" }],
  }),
  component: SearchPage,
});

type Tab = "top" | "accounts" | "reels" | "videos" | "tags";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "top", label: "Top" },
  { id: "accounts", label: "Accounts" },
  { id: "reels", label: "Reels" },
  { id: "videos", label: "Videos" },
  { id: "tags", label: "Tags" },
];

function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("top");
  const inputRef = useRef<HTMLInputElement>(null);
  const { history, push, remove, clear } = useSearch();
  const { following, toggleFollow } = useYw();
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [reels, setReels] = useState<SearchVideo[]>([]);
  const [videos, setVideos] = useState<SearchVideo[]>([]);
  const [hashtags, setHashtags] = useState<
    Array<{ tag: string; postCount: number; trending?: boolean }>
  >([]);
  const [remoteUsers, setRemoteUsers] = useState<SearchUser[]>([]);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await loadSearchData();
        if (!active) return;
        setUsers(next.users);
        setReels(next.reels);
        setVideos(next.videos);
        setHashtags(next.hashtags);
        setLoadError(null);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Couldn't load search.");
        }
      }
    };

    void load();
    const channel = supabase
      .channel("search-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, () => void load())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const q = query.trim().toLowerCase().replace(/^[#@]/, "");
  const hasQuery = q.length > 0;

  useEffect(() => {
    if (!hasQuery || (tab !== "accounts" && tab !== "top")) {
      setRemoteUsers([]);
      setUserSearchError(null);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void searchPublicProfiles(query).then(
        (results) => {
          if (active) {
            setRemoteUsers(results);
            setUserSearchError(null);
          }
        },
        () => {
          if (active) setUserSearchError("Couldn't search accounts. Please try again.");
        },
      );
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [hasQuery, query, tab]);

  const matchingReels = useMemo(
    () => (hasQuery ? reels.filter((reel) => matchesVideo(reel, q)) : []),
    [hasQuery, reels, q],
  );
  const matchingVideos = useMemo(
    () => (hasQuery ? videos.filter((video) => matchesVideo(video, q)) : []),
    [hasQuery, videos, q],
  );
  const matchingHashtags = useMemo(
    () => (hasQuery ? hashtags.filter((tag) => tag.tag.toLowerCase().includes(q)) : []),
    [hasQuery, hashtags, q],
  );
  const topUsers = remoteUsers.slice(0, 4);

  function rememberQuery() {
    const label = query.trim();
    if (label) push({ kind: "query", label });
  }

  function handleUserClick(user: SearchUser) {
    push({ kind: "user", label: user.username, sublabel: user.name, userId: user.id });
    void navigate({ to: "/u/$userId", params: { userId: user.id } });
  }

  function handleHashtagClick(tag: string) {
    push({ kind: "hashtag", label: tag });
    setQuery(`#${tag}`);
    setTab("tags");
  }

  function handleReelClick(reel: SearchVideo) {
    rememberQuery();
    void navigate({ to: "/reels", search: { reelId: reel.id } });
  }

  function handleVideoClick(video: SearchVideo) {
    rememberQuery();
    void navigate({ to: "/video/$videoId", params: { videoId: video.id } });
  }

  function clearQuery() {
    setQuery("");
    setTab("top");
    inputRef.current?.focus();
  }

  const counts: Record<Tab, number> = {
    top: topUsers.length + matchingReels.length + matchingVideos.length + matchingHashtags.length,
    accounts: remoteUsers.length,
    reels: matchingReels.length,
    videos: matchingVideos.length,
    tags: matchingHashtags.length,
  };

  return (
    <main className="grain relative min-h-screen pb-28">
      <div aria-hidden className="ambient-canvas" />

      <header className="header-lux sticky top-0 z-40 px-4 pb-3 pt-3">
        <h1 className="mb-3 font-ui text-[18px] font-semibold leading-none tracking-[-0.03em] text-foreground">
          Search
        </h1>
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground"
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search accounts, reels, videos, tags…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-10 w-full rounded-[14px] bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] pl-9 pr-9 font-ui text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[color-mix(in_oklab,var(--foreground)_18%,transparent)] transition-all duration-200"
          />
          {query && (
            <button
              onClick={clearQuery}
              className="absolute right-2.5 grid h-5 w-5 place-items-center rounded-full bg-muted-foreground/30 transition-all duration-150 active:scale-90"
              aria-label="Clear search"
            >
              <X className="h-3 w-3 text-foreground" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {hasQuery && (
          <div className="mt-3 flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-1.5 font-ui text-[12px] font-medium transition-all duration-200",
                  tab === item.id
                    ? "bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.id === "tags" && <Hash className="h-3 w-3" strokeWidth={2.2} />}
                {item.label}
                <span className="text-[10px] opacity-60">{counts[item.id]}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {hasQuery ? (
        <div className="space-y-6 px-4 pb-6 pt-4">
          {tab === "top" ? (
            <TopResults
              users={topUsers}
              reels={matchingReels.slice(0, 4)}
              videos={matchingVideos.slice(0, 3)}
              hashtags={matchingHashtags.slice(0, 5)}
              userError={userSearchError}
              onUserClick={handleUserClick}
              onReelClick={handleReelClick}
              onVideoClick={handleVideoClick}
              onHashtagClick={handleHashtagClick}
            />
          ) : tab === "accounts" ? (
            remoteUsers.length > 0 ? (
              <ul className="space-y-1">
                {remoteUsers.map((user, index) => (
                  <li key={user.id} className="animate-rise" style={{ animationDelay: `${index * 35}ms` }}>
                    <UserRow user={user} onClick={() => handleUserClick(user)} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState label={userSearchError ?? `No accounts match "${q}"`} />
            )
          ) : tab === "reels" ? (
            matchingReels.length > 0 ? (
              <ReelGrid reels={matchingReels} onOpen={handleReelClick} />
            ) : (
              <EmptyState label={`No reels match "${q}"`} />
            )
          ) : tab === "videos" ? (
            matchingVideos.length > 0 ? (
              <VideoList videos={matchingVideos} onOpen={handleVideoClick} />
            ) : (
              <EmptyState label={`No videos match "${q}"`} />
            )
          ) : matchingHashtags.length > 0 ? (
            <ul className="space-y-1">
              {matchingHashtags.map((tag, index) => (
                <li key={tag.tag} className="animate-rise" style={{ animationDelay: `${index * 35}ms` }}>
                  <HashtagRow
                    tag={tag.tag}
                    postCount={tag.postCount}
                    onClick={() => handleHashtagClick(tag.tag)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState label={`No tags match "#${q}"`} />
          )}
          {loadError && <p className="text-center text-xs text-muted-foreground">{loadError}</p>}
        </div>
      ) : (
        <div className="space-y-6 px-4 pb-6 pt-4">
          {history.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-ui text-[13px] font-semibold text-foreground">Recent Searches</span>
                <button
                  onClick={clear}
                  className="font-ui text-[12px] text-primary transition-opacity active:opacity-60"
                >
                  Clear all
                </button>
              </div>
              <ul className="space-y-0.5">
                {history.map((entry) => (
                  <li key={entry.id} className="group flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
                      {entry.kind === "user" ? (
                        <span className="font-ui text-[13px] font-semibold text-foreground/70">
                          {(entry.sublabel ?? entry.label).charAt(0).toUpperCase()}
                        </span>
                      ) : entry.kind === "hashtag" ? (
                        <Hash className="h-4 w-4 text-foreground/60" strokeWidth={2} />
                      ) : (
                        <Search className="h-4 w-4 text-foreground/60" strokeWidth={2} />
                      )}
                    </div>
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setQuery(
                          entry.kind === "user"
                            ? `@${entry.label}`
                            : entry.kind === "hashtag"
                              ? `#${entry.label}`
                              : entry.label,
                        );
                        setTab(entry.kind === "user" ? "accounts" : entry.kind === "hashtag" ? "tags" : "top");
                      }}
                    >
                      <p className="font-ui text-[14px] font-medium text-foreground">
                        {entry.kind === "user"
                          ? `@${entry.label}`
                          : entry.kind === "hashtag"
                            ? `#${entry.label}`
                            : entry.label}
                      </p>
                      {entry.sublabel && (
                        <p className="font-ui text-[12px] text-muted-foreground">{entry.sublabel}</p>
                      )}
                    </button>
                    <button
                      onClick={() => remove(entry.id)}
                      aria-label="Remove from history"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)] active:scale-90"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" strokeWidth={2} />
              <span className="font-ui text-[13px] font-semibold text-foreground">Trending</span>
            </div>
            <div className="surface-card overflow-hidden rounded-[20px]">
              {hashtags.filter((tag) => tag.trending).slice(0, 6).map((tag, index, list) => (
                <button
                  key={tag.tag}
                  onClick={() => handleHashtagClick(tag.tag)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]",
                    index < list.length - 1 &&
                      "border-b border-[color-mix(in_oklab,var(--foreground)_6%,transparent)]",
                  )}
                >
                  <span className="w-5 shrink-0 text-center font-ui text-[13px] font-bold text-muted-foreground/50">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-ui text-[14px] font-semibold text-foreground">#{tag.tag}</p>
                    <p className="font-ui text-[11px] text-muted-foreground">
                      {formatCount(tag.postCount)} posts
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-ui text-[13px] font-semibold text-foreground">Suggested Creators</span>
              <Link to="/" className="font-ui text-[12px] text-primary transition-opacity active:opacity-60">
                See all
              </Link>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {users.map((user) => (
                <SuggestedCard
                  key={user.id}
                  user={user}
                  isFollowing={!!following[user.id]}
                  onClick={() => handleUserClick(user)}
                  onFollow={() => toggleFollow(user.id)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function matchesVideo(video: SearchVideo, query: string) {
  return [
    video.title,
    video.description,
    video.caption,
    ...video.hashtags,
  ].some((value) => value.toLowerCase().includes(query));
}

function TopResults({
  users,
  reels,
  videos,
  hashtags,
  userError,
  onUserClick,
  onReelClick,
  onVideoClick,
  onHashtagClick,
}: {
  users: SearchUser[];
  reels: SearchVideo[];
  videos: SearchVideo[];
  hashtags: Array<{ tag: string; postCount: number }>;
  userError: string | null;
  onUserClick: (user: SearchUser) => void;
  onReelClick: (video: SearchVideo) => void;
  onVideoClick: (video: SearchVideo) => void;
  onHashtagClick: (tag: string) => void;
}) {
  if (!users.length && !reels.length && !videos.length && !hashtags.length) {
    return <EmptyState label={userError ?? "No results found"} />;
  }

  return (
    <>
      {users.length > 0 && (
        <ResultSection icon={<Users className="h-4 w-4" />} title="Accounts">
          <ul className="space-y-1">
            {users.map((user) => (
              <li key={user.id}>
                <UserRow user={user} onClick={() => onUserClick(user)} />
              </li>
            ))}
          </ul>
        </ResultSection>
      )}
      {reels.length > 0 && (
        <ResultSection icon={<Film className="h-4 w-4" />} title="Reels">
          <ReelGrid reels={reels} onOpen={onReelClick} />
        </ResultSection>
      )}
      {videos.length > 0 && (
        <ResultSection icon={<Video className="h-4 w-4" />} title="Videos">
          <VideoList videos={videos} onOpen={onVideoClick} />
        </ResultSection>
      )}
      {hashtags.length > 0 && (
        <ResultSection icon={<Tag className="h-4 w-4" />} title="Tags">
          <ul className="space-y-1">
            {hashtags.map((tag) => (
              <li key={tag.tag}>
                <HashtagRow
                  tag={tag.tag}
                  postCount={tag.postCount}
                  onClick={() => onHashtagClick(tag.tag)}
                />
              </li>
            ))}
          </ul>
        </ResultSection>
      )}
    </>
  );
}

function ResultSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 font-ui text-[13px] font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function UserRow({ user, onClick }: { user: SearchUser; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[16px] px-1 py-2 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]"
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
        <ProfileAvatar
          user={{
            full_name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-ui text-[14px] font-semibold text-foreground">@{user.username}</p>
          {user.verified && (
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary">
              <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
            </span>
          )}
        </div>
        <p className="font-ui text-[12px] text-muted-foreground">
          {user.name}
          {user.category ? ` · ${user.category}` : ""}
        </p>
      </div>
      {user.followerCount !== undefined && (
        <p className="shrink-0 font-ui text-[12px] font-medium text-muted-foreground/70">
          {formatCount(user.followerCount)}
        </p>
      )}
    </button>
  );
}

function ReelGrid({
  reels,
  onOpen,
}: {
  reels: SearchVideo[];
  onOpen: (video: SearchVideo) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {reels.map((reel) => (
        <button
          key={reel.id}
          type="button"
          onClick={() => onOpen(reel)}
          className="group min-w-0 text-left"
        >
          <div className="relative aspect-[9/12] overflow-hidden rounded-[16px] bg-zinc-900">
            <VideoPoster
              thumbnailUrl={reel.thumbnailUrl}
              mediaUrl={reel.mediaUrl}
              alt={reel.title}
              className="h-full w-full transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
            <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            <span className="absolute bottom-2 left-2 flex items-center gap-1 font-ui text-[10px] font-medium text-white">
              <Eye className="h-3 w-3" />
              {formatViews(reel.views)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 font-ui text-[12px] font-semibold text-foreground">
            {reel.title}
          </p>
        </button>
      ))}
    </div>
  );
}

function VideoList({
  videos,
  onOpen,
}: {
  videos: SearchVideo[];
  onOpen: (video: SearchVideo) => void;
}) {
  return (
    <div className="space-y-2">
      {videos.map((video) => (
        <button
          key={video.id}
          type="button"
          onClick={() => onOpen(video)}
          className="flex w-full items-center gap-3 rounded-[16px] p-1 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]"
        >
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-[12px] bg-zinc-900">
            <VideoPoster
              thumbnailUrl={video.thumbnailUrl}
              mediaUrl={video.mediaUrl}
              alt={video.title}
              className="h-full w-full"
            />
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-ui text-[10px] font-medium text-white">
              {formatDuration(video.durationSeconds)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-ui text-[13px] font-semibold text-foreground">{video.title}</p>
            <p className="mt-1 truncate font-ui text-[11px] text-muted-foreground">
              {video.author.name} · {formatViews(video.views)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function HashtagRow({
  tag,
  postCount,
  onClick,
}: {
  tag: string;
  postCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[16px] px-1 py-2 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
        <Hash className="h-5 w-5 text-foreground/70" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-ui text-[14px] font-semibold text-foreground">#{tag}</p>
        <p className="font-ui text-[12px] text-muted-foreground">
          {formatCount(postCount)} posts
        </p>
      </div>
    </button>
  );
}

function SuggestedCard({
  user,
  isFollowing,
  onClick,
  onFollow,
}: {
  user: SearchUser;
  isFollowing: boolean;
  onClick: () => void;
  onFollow: () => void;
}) {
  return (
    <article className="surface-card flex w-[142px] shrink-0 flex-col items-center rounded-[20px] px-3 pb-3.5 pt-4 text-center transition-transform duration-200">
      <button type="button" onClick={onClick} className="flex w-full flex-col items-center">
        <div className="h-[52px] w-[52px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
          <ProfileAvatar
            user={{
              full_name: user.name,
              username: user.username,
              avatar_url: user.avatar_url,
            }}
          />
        </div>
        <p className="mt-2.5 w-full truncate font-ui text-[12px] font-semibold text-foreground">
          @{user.username}
        </p>
        {user.category && (
          <p className="w-full truncate font-ui text-[10px] text-muted-foreground">{user.category}</p>
        )}
        <p className="mt-1 font-ui text-[11px] font-medium text-muted-foreground/70">
          {user.followerCount !== undefined && formatCount(user.followerCount)}
        </p>
      </button>
      <button
        type="button"
        onClick={onFollow}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-1 rounded-[10px] py-1.5 font-ui text-[11px] font-semibold transition-colors",
          isFollowing
            ? "bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] text-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isFollowing ? <Check className="h-3 w-3" strokeWidth={3} /> : <UserPlus className="h-3 w-3" />}
        {isFollowing ? "Following" : "Follow"}
      </button>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Search className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
      <p className="font-ui text-[14px] text-muted-foreground">{label}</p>
    </div>
  );
}