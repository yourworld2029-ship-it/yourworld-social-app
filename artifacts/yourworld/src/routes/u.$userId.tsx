import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { dmThreadId, resolveMediaUrl, type DbPost } from "@/lib/social-data";
import { useResolvedMedia } from "@/lib/profile-data";
import { isRealUserId, useFollowCounts } from "@/lib/follow-data";
import { fetchOrbitProfileRow, rowToOrbitProfile } from "@/lib/orbit-live";
import { useYw } from "@/lib/yw-store";
import { useAuth } from "@/lib/auth-store";
import { getOrCreateSportsProfile } from "@/components/yw/SportsProfile";
import { ProfileTemplate } from "@/components/yw/ProfileTemplate";

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
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listTab, setListTab] = useState<"followers" | "following">("followers");

  const counts = useFollowCounts(isRealUserId(userId) ? userId : null);
  const { following, toggleFollow } = useYw();
  const me = authUser?.id ?? null;
  const isOwnProfile = Boolean(me && me === userId);
  const loadRequestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setLoadError(null);
    setProfile(null);
    setPosts([]);
    setAvatarSrc(null);

    try {
      const [profileResult, postsResult, orbitRow] = await Promise.all([
        supabase.rpc("get_public_profiles", { ids: [userId] }),
        supabase
          .from("posts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100),
        fetchOrbitProfileRow(userId),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (postsResult.error) throw postsResult.error;

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
      const next: PublicProfile = {
        id: userId,
        username: row?.username ?? orbitProfile?.handle ?? `user${userId.slice(0, 4)}`,
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
      const nextAvatar = next.avatar_url
        ? await resolveMediaUrl(next.avatar_url, "avatars")
        : null;
      if (requestId !== loadRequestRef.current) return;
      setProfile(next);
      setPosts((postsResult.data ?? []) as DbPost[]);
      setAvatarSrc(nextAvatar);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      console.error("[PublicProfilePage] unable to load profile", error);
      setLoadError("This profile could not be loaded.");
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isOwnProfile) return;
    void navigate({ to: "/profile", replace: true });
  }, [isOwnProfile, navigate]);

  const media = useResolvedMedia(posts.map((post) => post.media_url));
  const mediaSrc = (url: string) => media[url] ?? url;
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
    if (busy || isOwnProfile) return;
    setBusy(true);
    try {
      const wasFollowing = Boolean(following[userId]);
      const changed = await toggleFollow(userId);
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
    if (!me || isOwnProfile) return;
    void navigate({
      to: "/chat/$threadId",
      params: { threadId: dmThreadId(me, userId) },
    });
  };

  const onShare = async () => {
    const url = `${window.location.origin}/u/${userId}`;
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
        userId,
        initialVideoId: id,
        returnTo: "public",
      },
    });
  };

  if (loading || !profile) return null;

  return (
    <ProfileTemplate
      profile={profile}
      avatarSrc={avatarSrc}
      coverSrc={null}
      userId={userId}
      posts={posts}
      grid={grid}
      reels={reels}
      savedPosts={[]}
      mediaLoading={loading}
      counts={counts}
      sportsProfile={sportsProfile}
      isVerifiedSports={isVerifiedSports}
      isOwner={false}
      following={Boolean(following[userId])}
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
      onOpen={openViewer}
      mediaSrc={mediaSrc}
      emptyVideos={loadError ?? "No posts yet. Create your first one."}
      emptyReels={loadError ?? "No reels yet."}
    />
  );
}