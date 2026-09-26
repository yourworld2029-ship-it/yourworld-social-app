import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Link2,
  MapPin,
  MoreVertical,
  Pin,
  Play,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bio } from "@/components/yw/Bio";
import { FollowListDialog } from "@/components/yw/FollowListDialog";
import {
  getUserEnteredProfileBio,
  type SportsProfileInfo,
} from "@/components/yw/SportsProfile";
import { SportsIdentityBadge } from "@/components/yw/SportsIdentityBadge";
import { VideoPoster } from "@/components/yw/VideoPoster";
import { ProfilePhotoViewer } from "@/components/yw/ProfilePhotoViewer";
import type { DbPost } from "@/lib/social-data";
import type { FollowCounts } from "@/lib/follow-data";
import { formatCount } from "@/lib/yw-data";
import {
  formatNormalProfileCategoryForDisplay,
  resolveNormalProfileCategories,
} from "@/lib/profile-category";
import { useVerifiedSportsIdentity } from "@/lib/sports-identity";
import { DownloadedVideoList } from "@/components/yw/DownloadedVideoList";
import type { DownloadedVideo } from "@/lib/yw-download";

export type ProfileTemplateProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  category: string;
  normal_categories: string[];
  location: string;
  website: string;
  avatar_url: string | null;
  cover_url: string | null;
};

export type ProfileTemplateProps = {
  profile: ProfileTemplateProfile;
  avatarSrc: string | null;
  coverSrc: string | null;
  userId: string;
  posts: DbPost[];
  grid: DbPost[];
  reels: DbPost[];
  downloads?: DownloadedVideo[];
  downloadsLoading?: boolean;
  mediaLoading: boolean;
  counts: Pick<FollowCounts, "followers" | "following">;
  sportsProfile: SportsProfileInfo | null;
  isVerifiedSports: boolean;
  isOwner: boolean;
  following?: boolean;
  followBusy?: boolean;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  listOpen: boolean;
  listTab: "followers" | "following";
  onListOpenChange: (open: boolean) => void;
  onListTabChange: (tab: "followers" | "following") => void;
  onEditProfile?: () => void;
  onBack?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onShare: () => void;
  onOpen: (post: DbPost) => void;
  onManage?: (post: DbPost) => void;
  onOpenDownload?: (video: DownloadedVideo) => void;
  onDeleteDownload?: (video: DownloadedVideo) => Promise<void> | void;
  onOpenDownloadAthlete?: (video: DownloadedVideo) => void;
  selectedTab?: "videos" | "reels" | "downloads";
  onTabChange?: (tab: "videos" | "reels" | "downloads") => void;
  mediaSrc?: (url: string) => string;
  emptyVideos?: string;
  emptyReels?: string;
  children?: ReactNode;
};

type ProfileTab = "videos" | "reels" | "downloads";

const ownerEditButtonClass =
  "h-8 rounded-lg border-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(217,70,239,0.9)] hover:from-fuchsia-400 hover:to-violet-400";
const ownerShareButtonClass =
  "h-8 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold hover:bg-white/[0.12]";
const otherFollowButtonClass =
  "h-8 rounded-lg border-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(217,70,239,0.9)] hover:from-fuchsia-400 hover:to-violet-400 disabled:opacity-60";

export function ProfileTemplate({
  profile,
  avatarSrc,
  coverSrc,
  userId,
  posts,
  grid,
  reels,
  downloads = [],
  downloadsLoading = false,
  mediaLoading,
  counts,
  sportsProfile,
  isVerifiedSports: _isVerifiedSports,
  isOwner,
  following = false,
  followBusy = false,
  onFollowersClick,
  onFollowingClick,
  listOpen,
  listTab,
  onListOpenChange,
  onListTabChange,
  onEditProfile,
  onBack,
  onFollow,
  onMessage,
  onShare,
  onOpen,
  onManage,
  onOpenDownload,
  onDeleteDownload,
  onOpenDownloadAthlete,
  selectedTab,
  onTabChange,
  mediaSrc = (url) => url,
  emptyVideos = "No posts yet. Create your first one.",
  emptyReels = "No reels yet.",
  children,
}: ProfileTemplateProps) {
  const [internalTab, setInternalTab] = useState<ProfileTab>("videos");
  const src = mediaSrc;
  const activeTab: ProfileTab = isOwner
    ? selectedTab ?? "videos"
    : internalTab === "reels"
      ? "reels"
      : "videos";
  const normalCategories = resolveNormalProfileCategories(
    profile.normal_categories,
    profile.category,
  );
  const verifiedSportsIdentity = useVerifiedSportsIdentity(profile.id);
  const sportsSubLabel = verifiedSportsIdentity ?? sportsProfile;
  const primaryCategoryLine =
    normalCategories[0]
      ? formatNormalProfileCategoryForDisplay(normalCategories[0])
      : sportsSubLabel
        ? `${sportsSubLabel.sport?.trim() || "Sports"} · ${sportsSubLabel.role?.trim() || "Player"}`
        : "";
  const userBio = getUserEnteredProfileBio(profile.bio);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-black pb-8">
      <header
        className="profile-header header-lux sticky top-0 z-40 flex items-center justify-between gap-3 px-3.5 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-4 sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              data-testid="button-profile-back"
              className="action-btn grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04]"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
          ) : null}
          <div className="min-w-0">
            <p className="bg-gradient-to-r from-[#f1ddb0] via-[#fff8e7] to-[#d0a65a] bg-clip-text text-[9px] font-bold uppercase tracking-[0.34em] text-transparent drop-shadow-[0_0_12px_rgba(214,165,83,0.18)]">YOURWORLD</p>
            <h1 data-testid="text-profile-username" className="mt-0.5 truncate font-display text-[15px] font-bold tracking-tight">
              @{profile.username || "…"}
            </h1>
          </div>
        </div>
        <Link data-testid="link-profile-settings" to="/settings" aria-label="Settings" className="action-btn grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </header>

      {profile.cover_url ? (
        coverSrc ? (
          <div className="relative h-24 overflow-hidden sm:h-32">
            <img src={coverSrc} alt="" className="h-full w-full scale-105 object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-background/25 to-background" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-md sm:left-4">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Athlete profile
            </div>
          </div>
        ) : (
          <div className="relative h-24 overflow-hidden bg-[radial-gradient(circle_at_85%_10%,rgba(216,180,91,0.22),transparent_32%),linear-gradient(135deg,rgba(210,56,151,0.16),transparent_55%)] sm:h-32">
            <div className="absolute inset-x-3 bottom-4 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent sm:inset-x-4" />
          </div>
        )
      ) : null}

      <section className={`relative mx-auto max-w-4xl px-4 sm:px-8 lg:px-10 ${profile.cover_url ? "-mt-8 sm:-mt-10" : "mt-0"}`}>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-4 sm:gap-x-6">
          <span className="grid h-[84px] w-[84px] shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#f4d58d,#d987c4_48%,#8647d2)] p-[3px] sm:h-28 sm:w-28">
            {avatarSrc ? (
               <ProfilePhotoViewer
                 src={avatarSrc}
                 testId="img-profile-avatar"
                 className="h-full w-full rounded-full"
                 imageClassName="rounded-full"
               />
            ) : null}
          </span>

          <div className="min-w-0 self-stretch pt-1 sm:pt-2">
            <div className="flex flex-col items-start gap-1">
              <p data-testid="text-profile-display-name" className="font-display text-[18px] font-bold tracking-tight sm:text-xl">
                {profile.display_name || "Add your name"}
              </p>
              {verifiedSportsIdentity ? (
                <SportsIdentityBadge
                  identity={verifiedSportsIdentity}
                  tier={verifiedSportsIdentity.status === "International" ? "international" : "national"}
                  variant="profile"
                />
              ) : null}
              {primaryCategoryLine ? (
                <p
                  data-testid="text-profile-category"
                  className="text-[11px] font-medium uppercase tracking-[0.12em] text-amber-100/80"
                >
                  {primaryCategoryLine.toLocaleUpperCase()}
                </p>
              ) : null}
            </div>
          </div>

          <dl data-testid="stats-profile" className="col-span-2 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-0.5 sm:py-1">
            <Stat label="Posts" value={mediaLoading ? "—" : formatCount(posts.length)} />
            <Stat label="Followers" value={counts.followers === null ? "—" : formatCount(counts.followers)} onClick={onFollowersClick} />
            <Stat label="Following" value={counts.following === null ? "—" : formatCount(counts.following)} onClick={onFollowingClick} />
          </dl>

          <div className="col-span-2 min-w-0">
            {userBio ? <Bio text={userBio} /> : null}
            {(profile.location || profile.website) ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-xs">
                {profile.location ? <span className="flex items-center gap-1.5 text-zinc-400"><MapPin className="h-3.5 w-3.5 text-amber-200/80" strokeWidth={1.8} />{profile.location}</span> : null}
                {profile.website ? (
                  <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-fuchsia-200 underline-offset-2 hover:underline">
                    <Link2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-4">
              {isOwner ? (
                <>
                  <Button data-testid="button-edit-profile" variant="secondary" className={ownerEditButtonClass} onClick={onEditProfile}>
                    Edit Profile
                  </Button>
                  <Button data-testid="button-share-profile" variant="secondary" className={ownerShareButtonClass} onClick={onShare}>
                    Share Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button data-testid="button-follow-profile" variant="secondary" className={otherFollowButtonClass} disabled={followBusy} onClick={onFollow}>
                    {following ? "Following" : "Follow"}
                  </Button>
                  <Button data-testid="button-message-profile" variant="secondary" className={ownerShareButtonClass} onClick={onMessage}>
                    Message
                  </Button>
                  <Button data-testid="button-share-profile" variant="secondary" className={ownerShareButtonClass} onClick={onShare}>
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === "videos" || value === "reels") {
            setInternalTab(value);
            onTabChange?.(value);
          } else if (isOwner && value === "downloads") {
            setInternalTab(value);
            onTabChange?.(value);
          }
        }}
        className="mx-auto w-full max-w-3xl pt-4"
      >
        <TabsList className="mx-0 flex h-auto w-full justify-center gap-8 rounded-none border-0 border-b border-white/10 bg-transparent px-3 py-0 sm:gap-10">
          <TabsTrigger value="videos" className="min-w-20 rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 text-xs font-semibold text-white/60 shadow-none data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none" aria-label="Videos">
            Videos
          </TabsTrigger>
          <TabsTrigger value="reels" className="min-w-20 rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 text-xs font-semibold text-white/60 shadow-none data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none" aria-label="Reels">
             Reels
          </TabsTrigger>
          {isOwner ? (
            <TabsTrigger value="downloads" className="min-w-20 rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 text-xs font-semibold text-white/60 shadow-none data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none" aria-label="Downloads">
              Downloads
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="videos" className="mt-0">
          {grid.length ? (
            <MediaGrid onOpen={onOpen} onManage={onManage} items={sortPinned(grid).map((post) => ({
              src: post.thumbnail_url ?? post.cover_image ?? (post.kind === "video" || post.kind === "reel" ? post.media_url : src(post.media_url)),
              mediaUrl: post.media_url,
              thumbnail: post.thumbnail_url ?? post.cover_image,
              type: post.kind === "video" ? "video" : post.media_type,
              post,
              ratio: mediaAspect(post),
            }))} />
          ) : (
            <Empty text={emptyVideos} />
          )}
        </TabsContent>
        <TabsContent value="reels" className="mt-0">
          {reels.length ? (
            <MediaGrid onOpen={onOpen} onManage={onManage} items={sortPinned(reels).map((post) => ({
              src: post.thumbnail_url ?? post.cover_image ?? post.media_url,
              mediaUrl: post.media_url,
              thumbnail: post.thumbnail_url ?? post.cover_image,
              type: "video",
              post,
              ratio: mediaAspect(post),
            }))} />
          ) : (
            <Empty text={emptyReels} />
          )}
        </TabsContent>
        {isOwner ? (
          <TabsContent value="downloads" className="mt-0">
            <DownloadedVideoList
              videos={downloads}
              loading={downloadsLoading}
              onOpen={onOpenDownload ?? (() => undefined)}
              onDelete={onDeleteDownload ?? (() => undefined)}
              onOpenAthlete={onOpenDownloadAthlete}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      {children}

      <FollowListDialog
        open={listOpen}
        onOpenChange={onListOpenChange}
        userId={userId}
        tab={listTab}
        onTabChange={onListTabChange}
      />
    </main>
  );
}

function sortPinned(list: DbPost[]) {
  return [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
}

function Empty({ text }: { text: string }) {
  return <p data-testid="status-profile-empty" className="px-4 py-14 text-center text-sm text-muted-foreground">{text}</p>;
}

function Stat({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const body = (
    <>
      <dd className="font-display text-lg font-bold leading-none sm:text-xl">{value}</dd>
      <dt className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">{label}</dt>
    </>
  );
  if (!onClick) return <div className="flex min-w-0 flex-col items-center justify-center px-2 py-0">{body}</div>;
  return (
    <button type="button" onClick={onClick} className="flex min-w-0 w-full flex-col items-center justify-center rounded-xl px-2 py-0 transition-transform active:scale-95">
      {body}
    </button>
  );
}

function MediaGrid({
  items,
  onOpen,
  onManage,
}: {
  items: {
    src: string;
    mediaUrl?: string;
    thumbnail?: string | null;
    type: string;
    post?: DbPost;
    ratio?: number;
  }[];
  onOpen?: (post: DbPost) => void;
  onManage?: (post: DbPost) => void;
}) {
  return (
    <ul data-testid="grid-profile-media" className="grid grid-cols-3 gap-1.5 bg-transparent px-3 sm:px-4">
      {items.map((it, i) => (
        <li key={`${it.post?.id ?? it.src}-${i}`} data-testid={`card-profile-media-${it.post?.id ?? i}`} className="media-frame relative overflow-hidden rounded-lg bg-secondary" style={{ aspectRatio: it.ratio ?? 1 }}>
          {it.post?.kind === "video" || it.post?.kind === "reel" || it.type?.startsWith("video") ? (
              <VideoPoster
                mediaUrl={it.mediaUrl ?? it.src}
                thumbnailUrl={it.thumbnail ?? it.post?.thumbnail_url}
                alt=""
                loading="lazy"
                bucket={it.post?.kind === "reel" ? "reels" : "videos"}
                className="h-full w-full object-cover"
              />
          ) : (
            <img src={it.src} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
          {it.post?.kind === "reel" ? (
            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <Play className="h-3 w-3 fill-current" />
              {formatCount(it.post.views_count ?? it.post.views ?? 0)}
            </span>
          ) : it.post?.kind === "video" || it.type?.startsWith("video") ? (
            <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
          ) : null}
          {it.post?.pinned ? <Pin className="absolute bottom-1.5 left-1.5 h-4 w-4 fill-current text-white drop-shadow" /> : null}
          {it.post?.kind !== "reel" && it.post?.views != null ? (
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {formatCount(it.post.views)} views
            </span>
          ) : null}
          {it.post?.duration_seconds != null ? (
            <span className={`absolute right-1.5 ${onManage ? "top-10" : "top-1.5"} rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white`}>
              {formatDuration(it.post.duration_seconds)}
            </span>
          ) : null}
          {it.post && onOpen && (it.post.kind === "reel" || it.post.kind === "video" || it.type?.startsWith("video")) ? (
            <>
              <button
                type="button"
                aria-label={`Open ${it.post.kind === "reel" ? "reel" : "post"}`}
                data-testid={`button-open-media-${it.post.id}`}
                onClick={() => onOpen(it.post!)}
                onContextMenu={onManage ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onManage(it.post!);
                } : undefined}
                title={onManage ? "Right-click or long-press to manage" : undefined}
                className="absolute inset-0 z-10"
              />
            </>
          ) : null}
          {it.post && onManage && (
            it.post.kind === "reel" ||
            it.post.kind === "video" ||
            it.type?.startsWith("video")
          ) ? (
            <button
              type="button"
              aria-label={`More options for ${it.post.kind === "reel" ? "reel" : "video"}`}
              data-testid={`button-manage-media-${it.post.id}`}
              onClick={() => onManage(it.post!)}
              className="absolute right-1.5 top-1.5 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <MoreVertical className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function mediaAspect(post: DbPost) {
  const width = post.original_width;
  const height = post.original_height;
  if (width && height && width > 0 && height > 0) return Math.min(1.65, Math.max(0.62, width / height));
  return post.kind === "reel" ? 0.8 : 1;
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  if (total >= 3600) {
    return `${Math.floor(total / 3600)}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}