import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { dmThreadId, resolveMediaUrl, type DbPost } from "@/lib/social-data";
import { isRealUserId, useFollowCounts } from "@/lib/follow-data";
import { fetchOrbitProfileRow, rowToOrbitProfile } from "@/lib/orbit-live";
import { missingColumn, normalizePostRow } from "@/lib/supabase-compat";
import { historyBackOr } from "@/lib/navigation";
import { useYw } from "@/lib/yw-store";
import { useAuth, useResumeAuthAction } from "@/lib/auth-store";
import { getOrCreateSportsProfile } from "@/components/yw/SportsProfile";
import { ProfileTemplate } from "@/components/yw/ProfileTemplate";

const PUBLIC_PROFILE_MEDIA_PAGE_SIZE = 12;

export const Route = createFileRoute("/u/$userId")({
  head: () => ({
    meta: [
      { title: "Creator Profile — YourWorld" },
      {
        name: "description",
        content:
          "View a YourWorld creator profile: their posts, reels, long videos, followers and following.",
      },
      { property: "og:title", content: "Creator Profile — YourWorld" },
      {
        property: "og:description",
        content: "Posts, reels and videos from a YourWorld creator.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicProfilePage,
});

type PublicProfile = {
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
  is_verified: boolean;
  verification_requested: boolean;
};

function PublicProfilePage() {
  const { userId: routeParam } = Route.useParams();
  const userId = normalizeProfileRouteParam(routeParam);
  const navigate = useNavigate();
  const { user: authUser, requestAuthAction } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [hasMoreMedia, setHasMoreMedia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listTab, setListTab] = useState<"followers" | "following">("followers");
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const counts = useFollowCounts(resolvedUserId);
  const { following, toggleFollow } = useYw();
  const me = authUser?.id ?? null;
  const isOwnProfile = Boolean(me && resolvedUserId && me === resolvedUserId);
  const loadRequestRef = useRef(0);
  const mediaLoadInFlightRef = useRef(false);

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setMediaLoading(true);
    setLoadError(null);
    setMediaError(null);
    setProfile(null);
    setPosts([]);
    setHasMoreMedia(false);
    mediaLoadInFlightRef.current = false;
    setAvatarSrc(null);
    setResolvedUserId(null);

    try {
      const targetId = await resolvePublicProfileId(userId);
      if (!targetId) throw new Error("PROFILE_NOT_FOUND");

      const [profileResult, orbitRow] = await Promise.all([
        supabase.rpc("get_public_profiles", { ids: [targetId] }),
        fetchOrbitProfileRow(targetId).catch(() => null),
      ]);
      if (profileResult.error) throw profileResult.error;

      const row = (profileResult.data ?? [])[0] as
        | {
            id: string;
            username: string | null;
            display_name: string | null;
            avatar_url: string | null;
            bio?: string | null;
            category?: string | null;
            normal_categories?: string[] | null;
            is_verified?: boolean | null;
          }
        | undefined;
      const orbitProfile = orbitRow ? rowToOrbitProfile(orbitRow) : null;
      if (!row && !orbitProfile) throw new Error("PROFILE_NOT_FOUND");

      const next: PublicProfile = {
        id: targetId,
        username: row?.username ?? orbitProfile?.handle ?? `user${targetId.slice(0, 4)}`,
        display_name:
          row?.display_name ?? row?.username ?? orbitProfile?.name ?? "YourWorld user",
        bio: row?.bio ?? orbitProfile?.about ?? "",
        category: row?.category ?? "",
        normal_categories: Array.isArray(row?.normal_categories) ? row.normal_categories : [],
        location: "",
        website: "",
        avatar_url: row?.avatar_url ?? orbitProfile?.photo ?? null,
        cover_url: null,
        is_verified: row?.is_verified === true,
        verification_requested: false,
      };
      if (requestId !== loadRequestRef.current) return;
      setResolvedUserId(targetId);
      setProfile(next);
      setAvatarSrc(null);
      setLoading(false);
      if (next.avatar_url) {
        void resolveMediaUrl(next.avatar_url, "avatars")
          .then((resolved) => {
            if (requestId === loadRequestRef.current) {
              setAvatarSrc(resolved || next.avatar_url);
            }
          })
          .catch(() => {
            if (requestId === loadRequestRef.current) {
              // A missing private avatar must not hide the public profile shell.
              setAvatarSrc(next.avatar_url);
            }
          });
      }

      try {
        const firstPage = await fetchPublicPostsPage(targetId, 0);
        if (requestId !== loadRequestRef.current) return;
        setPosts(firstPage.slice(0, PUBLIC_PROFILE_MEDIA_PAGE_SIZE));
        setHasMoreMedia(firstPage.length > PUBLIC_PROFILE_MEDIA_PAGE_SIZE);
      } catch (error) {
        if (requestId !== loadRequestRef.current) return;
        console.error("[PublicProfilePage] unable to load profile media", error);
        setMediaError("Posts are temporarily unavailable.");
      } finally {
        if (requestId === loadRequestRef.current) setMediaLoading(false);
      }
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      console.error("[PublicProfilePage] unable to load profile", error);
      setLoadError(error instanceof Error && error.message === "PROFILE_NOT_FOUND"
        ? "This profile could not be found."
        : "This profile could not be loaded.");
      setMediaLoading(false);
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMoreMedia = useCallback(async () => {
    if (
      !resolvedUserId ||
      !hasMoreMedia ||
      mediaLoading ||
      mediaLoadInFlightRef.current
    ) {
      return;
    }

    const requestId = loadRequestRef.current;
    const offset = posts.length;
    mediaLoadInFlightRef.current = true;
    setMediaLoading(true);
    setMediaError(null);
    try {
      const nextPage = await fetchPublicPostsPage(resolvedUserId, offset);
      if (requestId !== loadRequestRef.current) return;
      setPosts((current) => [
        ...current,
        ...nextPage.slice(0, PUBLIC_PROFILE_MEDIA_PAGE_SIZE),
      ]);
      setHasMoreMedia(nextPage.length > PUBLIC_PROFILE_MEDIA_PAGE_SIZE);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      console.error("[PublicProfilePage] unable to load more profile media", error);
      setMediaError("More posts are temporarily unavailable.");
    } finally {
      if (requestId === loadRequestRef.current) {
        mediaLoadInFlightRef.current = false;
        setMediaLoading(false);
      }
    }
  }, [hasMoreMedia, mediaLoading, posts.length, resolvedUserId]);

  useEffect(() => {
    if (!isOwnProfile) return;
    void navigate({ to: "/profile", replace: true });
  }, [isOwnProfile, navigate]);

  const grid = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.kind === "video" ||
          (post.kind !== "reel" && post.media_type?.startsWith("video")),
      ),
    [posts],
  );
  const reels = useMemo(() => posts.filter((post) => post.kind === "reel"), [posts]);
  const sportsProfile = useMemo(
    () =>
      profile
        ? getOrCreateSportsProfile({
            ...profile,
            username: profile.username,
            displayName: profile.display_name,
          })
        : null,
    [profile],
  );
  const isVerifiedSports = Boolean(sportsProfile?.verified);

  const onFollow = async () => {
    if (isOwnProfile) return;
    if (!authUser) {
      if (resolvedUserId) {
        requestAuthAction({ type: "follow-user", targetId: resolvedUserId });
      }
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (!resolvedUserId) return;
      const wasFollowing = Boolean(following[resolvedUserId]);
      const changed = await toggleFollow(resolvedUserId);
      if (!changed) return;
      void counts.reload();
      toast.success(wasFollowing ? "Unfollowed" : `Following @${profile?.username}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update follow");
    } finally {
      setBusy(false);
    }
  };

  const onMessage = () => {
    if (!resolvedUserId || isOwnProfile) return;
    if (!authUser) {
      requestAuthAction({
        type: "profile-message",
        targetId: resolvedUserId,
      });
      return;
    }
    void navigate({
      to: "/chat/$threadId",
      params: { threadId: dmThreadId(authUser.id, resolvedUserId) },
    });
  };

  useResumeAuthAction("follow-user", resolvedUserId, () => onFollow());
  useResumeAuthAction("follow-user", "*", (action) => {
    void toggleFollow(action.targetId);
  });
  useResumeAuthAction("profile-message", resolvedUserId, () => {
    if (!authUser || !resolvedUserId) return;
    void navigate({
      to: "/chat/$threadId",
      params: { threadId: dmThreadId(authUser.id, resolvedUserId) },
    });
  });

  const onShare = async () => {
    const url = `${window.location.origin}/u/${encodeURIComponent(userId)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.username ?? "YourWorld profile", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied");
      }
    } catch {
      // User cancelled sharing.
    }
  };

  const openViewer = (post: DbPost) => {
    const id = typeof post.id === "string" ? post.id.trim() : "";
    if (!id) {
      toast.error("This media is unavailable.");
      return;
    }
    void navigate({
      to: "/reels",
      search: {
        reelId: undefined,
        userId: resolvedUserId ?? undefined,
        initialVideoId: id,
        returnTo: "public",
      },
    });
  };

  const onBack = () => historyBackOr(() => void navigate({ to: "/" }));

  if (loading) {
    return <PublicProfileLoading onBack={onBack} />;
  }

  if (!profile || !resolvedUserId) {
    return (
      <PublicProfileError
        message={loadError ?? "This profile could not be loaded."}
        onBack={onBack}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <ProfileTemplate
      profile={profile}
      avatarSrc={avatarSrc}
      coverSrc={null}
      userId={resolvedUserId}
      posts={posts}
      grid={grid}
      reels={reels}
      mediaLoading={mediaLoading}
      hasMoreMedia={hasMoreMedia}
      onLoadMoreMedia={loadMoreMedia}
      counts={counts}
      sportsProfile={sportsProfile}
      isVerifiedSports={isVerifiedSports}
      isOwner={false}
      following={Boolean(following[resolvedUserId])}
      followBusy={busy}
      onFollowersClick={() => {
        setListTab("followers");
        setListOpen(true);
      }}
      onFollowingClick={() => {
        setListTab("following");
        setListOpen(true);
      }}
      listOpen={listOpen}
      listTab={listTab}
      onListOpenChange={setListOpen}
      onListTabChange={setListTab}
      onFollow={onFollow}
      onMessage={onMessage}
      onShare={onShare}
      onBack={onBack}
      onOpen={openViewer}
      emptyVideos={mediaError ?? (mediaLoading ? "Loading posts…" : "No posts yet.")}
      emptyReels={mediaError ?? (mediaLoading ? "Loading reels…" : "No posts yet.")}
    />
  );
}

function normalizeProfileRouteParam(value: string) {
  try {
    return decodeURIComponent(value).trim().replace(/^@+/, "");
  } catch {
    return value.trim().replace(/^@+/, "");
  }
}

async function resolvePublicProfileId(routeParam: string) {
  if (!routeParam) return null;
  if (isRealUserId(routeParam)) return routeParam;

  const { data, error } = await supabase.rpc("search_profiles", { search: routeParam });
  if (error) throw error;
  const rows = (data ?? []) as Array<{ id: string; username: string | null }>;
  const exact = rows.find(
    (row) => typeof row.username === "string" && row.username.toLowerCase() === routeParam.toLowerCase(),
  );
  return exact?.id ?? rows[0]?.id ?? null;
}

async function fetchPublicPostsPage(targetId: string, offset: number) {
  let postsResult = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", targetId)
    .eq("archived", false)
    .order("pinned", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + PUBLIC_PROFILE_MEDIA_PAGE_SIZE);

  // Older deployments may not have archived yet. Keep the profile media path
  // compatible without delaying the profile shell.
  if (postsResult.error && missingColumn(postsResult.error) === "archived") {
    postsResult = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", targetId)
      .order("pinned", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + PUBLIC_PROFILE_MEDIA_PAGE_SIZE);
  }
  if (postsResult.error) throw postsResult.error;
  return (postsResult.data ?? []).map(normalizePostRow) as DbPost[];
}

function PublicProfileLoading({ onBack }: { onBack: () => void }) {
  return (
    <main className="min-h-[100dvh] bg-background px-4 pb-8">
      <header className="flex items-center gap-3 border-b border-border py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          data-testid="button-profile-back"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04]"
        >
          ←
        </button>
        <span className="text-sm font-semibold">Loading profile…</span>
      </header>
      <section className="mx-auto max-w-4xl animate-pulse pt-8">
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 rounded-full bg-secondary" />
          <div className="space-y-3">
            <div className="h-5 w-40 rounded bg-secondary" />
            <div className="h-3 w-28 rounded bg-secondary" />
          </div>
        </div>
        <div className="mt-6 h-12 rounded-xl bg-secondary" />
        <div className="mt-6 grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((item) => (
            <div key={item} className="aspect-square rounded-lg bg-secondary" />
          ))}
        </div>
      </section>
    </main>
  );
}

function PublicProfileError({
  message,
  onBack,
  onRetry,
}: {
  message: string;
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-6 text-center">
      <div>
        <button
          type="button"
          onClick={onBack}
          data-testid="button-profile-back"
          className="mb-6 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm"
        >
          ← Back
        </button>
        <p data-testid="status-profile-error" className="text-sm text-muted-foreground">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background"
        >
          Try again
        </button>
      </div>
    </main>
  );
}