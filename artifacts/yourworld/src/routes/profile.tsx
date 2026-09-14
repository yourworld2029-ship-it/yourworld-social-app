import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Settings,
  Play,
  MapPin,
  Link2,
  Trash2,
  Heart,
  MessageCircleOff,
  Send,
  Pencil,
  Pin,
  PinOff,
  Archive,
  MoreHorizontal,
  Trophy,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { YwAvatar } from "@/components/yw/Avatar";
import { Bio } from "@/components/yw/Bio";
import { EditProfileSheet, type ProfileEdit } from "@/components/yw/EditProfileSheet";
import { formatCount } from "@/lib/yw-data";
import {
  useMyProfile,
  useResolvedMedia,
  updateMyPost,
  deleteMyPost,
  createSportsDocumentSignedUrl,
  deleteSportsDocument,
  listSportsDocuments,
  uploadSportsDocument,
  type SportsDocument,
} from "@/lib/profile-data";
import {
  getSportsProfile,
  serializeSportsProfileBio,
  SportsDetailsPanel,
  VerifiedSportsProfilePromo,
  SportsProfileBadge,
  SportsProfileCard,
  type SportsProfileDraft,
} from "@/components/yw/SportsProfile";
import type { DbPost } from "@/lib/social-data";
import { UserWatermark } from "@/components/yw/UserWatermark";
import { FollowListDialog } from "@/components/yw/FollowListDialog";
import { useFollowCounts } from "@/lib/follow-data";
import { Highlights } from "@/components/yw/Highlights";
import { VideoPoster } from "@/components/yw/VideoPoster";





export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — YourWorld" },
      {
        name: "description",
        content:
          "Your YourWorld profile: followers, following, saved posts, reels and account settings.",
      },
      { property: "og:title", content: "Profile — YourWorld" },
      {
        property: "og:description",
        content: "Followers, following, saved posts and settings on YourWorld.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, avatarSrc, coverSrc, grid, reels, posts, savedPosts, loading, save, userId, reload } =
    useMyProfile();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const counts = useFollowCounts(userId);
  const [listOpen, setListOpen] = useState(false);
  const [listTab, setListTab] = useState<"followers" | "following">("followers");
  const [manage, setManage] = useState<DbPost | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sportsDetailsOpen, setSportsDetailsOpen] = useState(false);
  const [sportsPromoOpen, setSportsPromoOpen] = useState(false);
  const [sportsDocuments, setSportsDocuments] = useState<SportsDocument[]>([]);
  const [sportsDocumentsLoading, setSportsDocumentsLoading] = useState(false);
  const [sportsDocumentsError, setSportsDocumentsError] = useState<string | null>(null);
  const [sportsDocumentsUploading, setSportsDocumentsUploading] = useState(false);
  const [sportsDocumentToDelete, setSportsDocumentToDelete] = useState<SportsDocument | null>(null);
  const [sportsDocumentDeleting, setSportsDocumentDeleting] = useState(false);

  const openManage = (post: DbPost) => {
    setManage(post);
    setEditing(false);
    setTitle(post.title ?? "");
    setCaption(post.caption ?? "");
    setLocation(post.location ?? "");
  };

  const startEdit = (post: DbPost) => {
    setTitle(post.title ?? "");
    setCaption(post.caption ?? "");
    setLocation(post.location ?? "");
    setEditing(true);
  };

  const patchManaged = async (patch: Parameters<typeof updateMyPost>[1], msg: string) => {
    if (!manage) return;
    const prev = manage;
    setManage({ ...manage, ...patch } as DbPost);
    try {
      await updateMyPost(prev.id, patch);
      toast.success(msg);
      await reload();
    } catch (e) {
      setManage(prev);
      toast.error(e instanceof Error ? e.message : "Couldn't update");
    }
  };

  const sortPinned = (list: DbPost[]) =>
    [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

  const openViewer = (post: DbPost) => {
    const id = typeof post?.id === "string" ? post.id.trim() : "";
    if (!id) {
      toast.error("This media is unavailable.");
      return;
    }
    if (post.kind === "reel") {
      void navigate({
        to: "/reels",
        search: {
          reelId: undefined,
          userId: post.user_id,
          initialVideoId: id,
          returnTo: "profile",
        },
      });
      return;
    }
    void navigate({
      to: "/reels",
      search: {
        reelId: undefined,
        userId: post.user_id,
        initialVideoId: id,
        returnTo: "profile",
      },
    });
  };



  const reelMedia = useResolvedMedia(
    [...posts, ...savedPosts]
      .filter((p) => p.kind === "reel")
      .map((p) => p.media_url),
    "reels",
  );
  const videoMedia = useResolvedMedia(
    [...posts, ...savedPosts]
      .filter((p) => p.kind === "video")
      .map((p) => p.media_url),
    "videos",
  );
  const src = (u: string) => reelMedia[u] ?? videoMedia[u] ?? u;

  const avatarUser = {
    id: userId ?? "me",
    username: profile.username || "you",
    name: profile.display_name || profile.username || "You",
    hue: 280,
  };
  const sportsProfile = getSportsProfile({
    ...profile,
    username: profile.username,
    displayName: profile.display_name,
  });
  const hasSportsProfile = Boolean(sportsProfile);

  useEffect(() => {
    if (!sportsDetailsOpen || !hasSportsProfile || !userId || userId !== profile.id) {
      setSportsDocuments([]);
      setSportsDocumentsError(null);
      setSportsDocumentsLoading(false);
      return;
    }

    let cancelled = false;
    setSportsDocumentsLoading(true);
    setSportsDocumentsError(null);
    void listSportsDocuments(userId)
      .then((documents) => {
        if (!cancelled) setSportsDocuments(documents);
      })
      .catch((error) => {
        if (!cancelled) {
          setSportsDocuments([]);
          setSportsDocumentsError(error instanceof Error ? error.message : "Documents are unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setSportsDocumentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSportsProfile, profile.id, sportsDetailsOpen, userId]);

  const openSportsDocument = async (document: SportsDocument, download: boolean) => {
    if (!userId || userId !== profile.id) return;
    try {
      const url = await createSportsDocumentSignedUrl(userId, document.path);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.rel = "noopener noreferrer";
      if (download) {
        anchor.download = document.name;
      } else {
        anchor.target = "_blank";
      }
      anchor.click();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "This document is unavailable.");
    }
  };

  const handleSportsDocumentUpload = async (file: File) => {
    if (!userId || userId !== profile.id) return;
    setSportsDocumentsUploading(true);
    try {
      const document = await uploadSportsDocument(userId, file);
      setSportsDocuments((current) => [document, ...current]);
      toast.success("Document uploaded securely");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't upload this document.");
    } finally {
      setSportsDocumentsUploading(false);
    }
  };

  const handleSportsDocumentDelete = async () => {
    if (!sportsDocumentToDelete || !userId || userId !== profile.id) return;
    const document = sportsDocumentToDelete;
    setSportsDocumentDeleting(true);
    try {
      await deleteSportsDocument(userId, document.path);
      setSportsDocuments((current) => current.filter((item) => item.path !== document.path));
      setSportsDocumentToDelete(null);
      toast.success("Document deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete this document.");
    } finally {
      setSportsDocumentDeleting(false);
    }
  };

  const editValue: ProfileEdit = {
    name: profile.display_name,
    username: profile.username,
    category: profile.category,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    avatarUrl: avatarSrc ?? undefined,

  };

  const saveSportsDetails = async (draft: SportsProfileDraft) => {
    if (!sportsProfile) return;
    await save({
      ...editValue,
      username: draft.username.trim() || profile.username,
      category: `${draft.role}${draft.sport.trim() ? ` · ${draft.sport.trim()}` : ""}`,
      bio: serializeSportsProfileBio(profile.bio, draft),
    });
    toast.success("Sports details saved");
  };

  if (!loading && !userId) {
    return (
      <main className="relative min-h-screen">
        <header className="sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border glass px-4 py-3">
          <h1 className="font-display text-xl font-bold">Profile</h1>
          <Link to="/settings" aria-label="Settings" className="transition-transform active:scale-90">
            <Settings className="h-6 w-6" />
          </Link>
        </header>
        <div className="grid place-items-center px-6 py-24 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Sign in to see your profile.</p>
            <Link
              to="/auth"
              className="mt-4 inline-block rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
      <main className="relative overflow-hidden pb-6">
      <UserWatermark username={profile.username} />
      <header className="header-lux sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <h1 data-testid="text-profile-username" className="flex min-w-0 items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-black text-primary">YW</span>
          <span className="truncate">@{profile.username || "…"}</span>
        </h1>
        <Link data-testid="link-profile-settings" to="/settings" aria-label="Settings" className="action-btn grid h-9 w-9 place-items-center rounded-full">
          <Settings className="h-6 w-6" />
        </Link>
      </header>

      {coverSrc ? (
        <div className="relative h-28 overflow-hidden">
          <img src={coverSrc} alt="" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background" />
        </div>
      ) : (
        <div className="h-10 bg-gradient-to-b from-primary/10 to-transparent" />
      )}

      <section className="-mt-2 px-4 pt-1">
        <div className="flex items-center gap-5">
          <span className="grid h-[86px] w-[86px] shrink-0 place-items-center rounded-full p-[3px] ring-story">
            <span className="grid h-full w-full place-items-center rounded-full bg-background p-[2px]">
              {avatarSrc ? (
              <img
                data-testid="img-profile-avatar"
                  src={avatarSrc}
                  alt=""
                  className="h-[74px] w-[74px] rounded-full object-cover"
                />
              ) : (
                <YwAvatar user={avatarUser} size={74} />
              )}
            </span>
          </span>
          <dl data-testid="stats-profile" className="grid flex-1 grid-cols-3 text-center">
            <Stat label="Posts" value={formatCount(posts.length)} />
            <Stat
              label="Followers"
               value={counts.followers === null ? "—" : formatCount(counts.followers)}
              onClick={() => {
                setListTab("followers");
                setListOpen(true);
              }}
            />
            <Stat
              label="Following"
               value={counts.following === null ? "—" : formatCount(counts.following)}
              onClick={() => {
                setListTab("following");
                setListOpen(true);
              }}
            />
          </dl>

        </div>

        <div className="pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <p data-testid="text-profile-display-name" className="font-semibold">{profile.display_name || "Add your name"}</p>
            {sportsProfile ? (
              <SportsProfileBadge badge={sportsProfile.badge} verified={sportsProfile.verified} />
            ) : null}
          </div>
          {profile.category ? (
            <p className="text-xs text-muted-foreground">{profile.category}</p>
          ) : null}
          {profile.bio ? <Bio text={profile.bio} /> : null}
          {(profile.location || profile.website) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs">
              {profile.location ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {profile.location}
                </span>
              ) : null}
              {profile.website ? (
                <a
                  href={
                    profile.website.startsWith("http")
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
            </div>
          )}
          {sportsProfile ? (
            <SportsProfileCard
              profile={sportsProfile}
              onClick={() => setSportsPromoOpen(true)}
            />
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-4">
          <Button
            data-testid="button-edit-profile"
            variant="secondary"
            className="h-10 rounded-full"
            onClick={() => setEditOpen(true)}
          >
            Edit profile
          </Button>
          <Button
            data-testid="button-share-profile"
            variant="secondary"
            className="h-10 rounded-full"
            onClick={async () => {
              const url = `${window.location.origin}/profile`;
              try {
                if (navigator.share) await navigator.share({ title: profile.username, url });
                else {
                  await navigator.clipboard.writeText(url);
                  toast.success("Profile link copied");
                }
              } catch {
                /* user cancelled */
              }
            }}
          >
            Share profile
          </Button>
        </div>
      </section>

      <Highlights
        userId={userId}
        posts={posts.map((post) => ({ ...post, media_url: src(post.media_url) }))}
      />

      <Tabs defaultValue="videos" className="pt-7">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-y border-border/70 bg-background/70 p-0 backdrop-blur-xl">
          <TabsTrigger value="videos" className="rounded-none py-3 text-xs data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md" aria-label="Videos">
            Videos
          </TabsTrigger>
          <TabsTrigger value="reels" className="rounded-none py-3 text-xs data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md" aria-label="Reels">
            Reels
          </TabsTrigger>
          <TabsTrigger value="saved" className="rounded-none py-3 text-xs data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md" aria-label="Saved">
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-0">
          {grid.length ? (
            <MediaGrid
              onOpen={openViewer}
              onManage={openManage}
              items={sortPinned(grid).map((p) => ({
                src: src(p.media_url),
                type: p.kind === "video" ? "video" : p.media_type,
                post: p,
                ratio: mediaAspect(p),
              }))}
            />
          ) : (
            <Empty text={loading ? "Loading your posts…" : "No posts yet. Create your first one."} />
          )}
        </TabsContent>
        <TabsContent value="reels" className="mt-0">
          {reels.length ? (
            <MediaGrid
              onOpen={openViewer}
              onManage={openManage}
              items={sortPinned(reels).map((p) => ({
                src: src(p.media_url),
                type: "video",
                post: p,
                 ratio: mediaAspect(p),
              }))}
            />
          ) : (
            <Empty text={loading ? "Loading reels…" : "No reels yet."} />
          )}
        </TabsContent>
        <TabsContent value="saved" className="mt-0">
          {savedPosts.length ? (
            <MediaGrid
              onOpen={openViewer}
              items={savedPosts.map((p) => ({
                src: src(p.media_url),
                type: "video",
                post: p,
                 ratio: mediaAspect(p),
              }))}
            />
          ) : (
            <Empty text="Nothing saved yet. Tap the bookmark on a post to keep it here." />
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!manage && !editing} onOpenChange={(o) => !o && setManage(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border px-0 pb-6 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/40" />
          {manage ? (
            <div className="max-h-[70vh] overflow-y-auto">
              <OptionRow
                icon={<Heart className="h-5 w-5" />}
                label="Hide like count to others"
                sub="Only you will see the total number of likes."
                toggle={!!manage.hide_like_count}
                onToggle={(v) => patchManaged({ hide_like_count: v }, v ? "Like count hidden" : "Like count visible")}
              />
              <OptionRow
                icon={<Send className="h-5 w-5" />}
                label="Hide share count"
                sub="Others won't see how many times this was shared."
                toggle={!!manage.hide_share_count}
                onToggle={(v) => patchManaged({ hide_share_count: v }, v ? "Share count hidden" : "Share count visible")}
              />
              <OptionRow
                icon={<MessageCircleOff className="h-5 w-5" />}
                label="Turn off commenting"
                sub="No one can comment on this post."
                toggle={!!manage.comments_off}
                onToggle={(v) => patchManaged({ comments_off: v }, v ? "Commenting turned off" : "Commenting turned on")}
              />
              <OptionRow
                icon={manage.pinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                label={manage.pinned ? "Unpin from your grid" : "Pin to your main grid"}
                onClick={() =>
                  patchManaged({ pinned: !manage.pinned }, manage.pinned ? "Unpinned" : "Pinned to your grid")
                }
              />
              <OptionRow
                icon={<Pencil className="h-5 w-5" />}
                label="Edit"
                onClick={() => startEdit(manage)}
              />
              <OptionRow
                icon={<Link2 className="h-5 w-5" />}
                label="Copy link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/?post=${manage.id}`,
                    );
                    toast.success("Link copied");
                  } catch {
                    toast.error("Couldn't copy link");
                  }
                }}
              />
              <OptionRow
                icon={<Archive className="h-5 w-5" />}
                label={manage.archived ? "Unarchive" : "Archive"}
                onClick={() =>
                  patchManaged({ archived: !manage.archived }, manage.archived ? "Unarchived" : "Archived")
                }
              />
              <OptionRow
                icon={<Trash2 className="h-5 w-5" />}
                label="Delete"
                destructive
                onClick={() => setConfirmDelete(true)}
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {sportsProfile ? (
        <Sheet open={sportsPromoOpen} onOpenChange={setSportsPromoOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[90vh] overflow-y-auto rounded-t-[2rem] border-amber-200/20 bg-[#0b0c12] px-4 pb-8 pt-5 text-white sm:mx-auto sm:max-w-xl"
          >
            <SheetHeader className="mb-5 pr-8 text-left">
              <SheetTitle className="text-left text-xl text-white">Premium Sports Profile</SheetTitle>
              <SheetDescription className="text-left text-zinc-400">
                Learn how YourWorld supports verified Player and Coach profiles.
              </SheetDescription>
            </SheetHeader>
            <VerifiedSportsProfilePromo
              onOpenDetails={() => {
                setSportsPromoOpen(false);
                setSportsDetailsOpen(true);
              }}
            />
          </SheetContent>
        </Sheet>
      ) : null}

      {sportsProfile ? (
        <Sheet open={sportsDetailsOpen} onOpenChange={setSportsDetailsOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[90vh] overflow-y-auto rounded-t-[2rem] border-amber-200/20 bg-[#0b0c12] px-4 pb-8 pt-5 text-white sm:mx-auto sm:max-w-xl"
          >
            <SheetHeader className="mb-5 pr-8 text-left">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-200/25 bg-amber-300/10 text-amber-200">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <SheetTitle className="text-left text-xl text-white">Sports Details</SheetTitle>
                  <SheetDescription className="text-left text-zinc-400">
                    Public sports identity and verified profile information.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <SportsDetailsPanel
              profile={sportsProfile}
              isOwner={Boolean(userId && userId === profile.id)}
              documents={sportsDocuments}
              documentsLoading={sportsDocumentsLoading}
              documentsError={sportsDocumentsError}
              documentsUploading={sportsDocumentsUploading}
              onUploadDocument={handleSportsDocumentUpload}
              onDocumentAction={openSportsDocument}
              onDeleteDocument={setSportsDocumentToDelete}
              onSave={saveSportsDetails}
            />
          </SheetContent>
        </Sheet>
      ) : null}

      <Dialog open={!!manage && editing} onOpenChange={(o) => !o && setEditing(false)}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="grid grid-cols-[auto_1fr_auto] items-center border-b border-border px-4 py-3 text-center">
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <DialogTitle className="text-sm font-semibold">
              Edit {manage?.kind === "reel" ? "reel" : "post"}
            </DialogTitle>
            <Button
              size="sm"
              className="h-8 rounded-full px-4"
              disabled={busy}
              onClick={async () => {
                if (!manage) return;
                setBusy(true);
                try {
                  await updateMyPost(manage.id, {
                    title,
                    caption,
                    location: location.trim() || null,
                  });
                  toast.success("Updated");
                  setEditing(false);
                  setManage(null);
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Couldn't update");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Saving…" : "Done"}
            </Button>
          </DialogHeader>
          {manage ? (
            <div className="max-h-[75vh] overflow-y-auto">
              <div className="relative bg-secondary">
                {manage.media_type?.startsWith("video") ? (
                  <video
                    src={src(manage.media_url)}
                    controls
                    playsInline
                    className="max-h-64 w-full object-contain"
                  />
                ) : (
                  <img src={src(manage.media_url)} alt="" className="max-h-64 w-full object-contain" />
                )}
              </div>
              <div className="space-y-1 px-4 py-3">
                <div className="flex items-start gap-3 py-1.5">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <YwAvatar user={avatarUser} size={36} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="pb-1 text-sm font-semibold">@{profile.username || "you"}</p>
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
                      placeholder="Write a caption…"
                      rows={4}
                      className="resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                    />
                    <input
                      data-testid="input-edit-post-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 180))}
                      placeholder="Add a title"
                      className="mb-2 w-full border-b border-border/60 bg-transparent pb-2 text-sm font-semibold outline-none placeholder:text-muted-foreground"
                    />
                    <p className="pt-1 text-right text-[11px] text-muted-foreground">
                      {caption.length}/2,200
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-border py-3">
                  <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-border py-3">
                  <div>
                    <p className="text-sm">Hide like count to others</p>
                    <p className="text-xs text-muted-foreground">Only you will see total likes.</p>
                  </div>
                  <Switch
                    checked={!!manage.hide_like_count}
                    onCheckedChange={(v) =>
                      patchManaged({ hide_like_count: v }, v ? "Like count hidden" : "Like count visible")
                    }
                  />
                </div>
                <div className="flex items-center justify-between border-t border-border py-3">
                  <div>
                    <p className="text-sm">Turn off commenting</p>
                    <p className="text-xs text-muted-foreground">No one can comment on this post.</p>
                  </div>
                  <Switch
                    checked={!!manage.comments_off}
                    onCheckedChange={(v) =>
                      patchManaged({ comments_off: v }, v ? "Commenting turned off" : "Commenting turned on")
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {manage?.kind === "reel" ? "reel" : "post"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes it and its media. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!manage) return;
                try {
                  await deleteMyPost(manage);
                  toast.success("Deleted");
                  setManage(null);
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Couldn't delete");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(sportsDocumentToDelete)}
        onOpenChange={(open) => {
          if (!open && !sportsDocumentDeleting) setSportsDocumentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {sportsDocumentToDelete?.name.split("/").at(-1) || "this document"}
              from your private sports documents. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sportsDocumentDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={sportsDocumentDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleSportsDocumentDelete();
              }}
            >
              {sportsDocumentDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        user={avatarUser}
        value={editValue}
        onSave={save}
      />

      <FollowListDialog
        open={listOpen}
        onOpenChange={setListOpen}
        userId={userId}
        tab={listTab}
        onTabChange={setListTab}
      />



    </main>
  );
}

function OptionRow({
  icon,
  label,
  sub,
  toggle,
  onToggle,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const content = (
    <div className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
      <span className={destructive ? "text-destructive" : "text-foreground"}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`}
        >
          {label}
        </span>
        {sub ? <span className="block text-xs text-muted-foreground">{sub}</span> : null}
      </span>
      {onToggle ? (
        <Switch checked={!!toggle} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} />
      ) : null}
    </div>
  );
  if (onToggle) return <div className="w-full">{content}</div>;
  return (
    <button type="button" onClick={onClick} className="w-full transition-colors active:bg-secondary">
      {content}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p data-testid="status-profile-empty" className="px-4 py-14 text-center text-sm text-muted-foreground">{text}</p>;
}

function Stat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <dd className="font-display text-lg font-bold">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </>
  );
  if (!onClick) return <div>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl py-0.5 transition-transform active:scale-95"
    >
      {body}
    </button>
  );
}


function MediaGrid({
  items,
  onOpen,
  onManage,
}: {
  items: { src: string; type: string; post?: DbPost; ratio?: number }[];
  onOpen?: (post: DbPost) => void;
  onManage?: (post: DbPost) => void;
}) {
  return (
    <ul data-testid="grid-profile-media" className="grid grid-cols-3 gap-1 bg-background">
      {items.map((it, i) => (
        <li
          key={`${it.post?.id ?? it.src}-${i}`}
          data-testid={`card-profile-media-${it.post?.id ?? i}`}
          className="media-frame relative overflow-hidden bg-secondary"
          style={{ aspectRatio: it.ratio ?? 1 }}
        >
          {it.post?.kind === "video" || it.post?.kind === "reel" || it.type?.startsWith("video") ? (
            <VideoPoster
              mediaUrl={it.src}
              thumbnailUrl={it.post?.thumbnail_url}
              alt=""
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
          {it.post?.pinned ? (
            <Pin className="absolute bottom-1.5 left-1.5 h-4 w-4 fill-current text-white drop-shadow" />
          ) : null}
          {it.post?.kind !== "reel" && it.post?.views != null ? (
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {formatCount(it.post.views)} views
            </span>
          ) : null}
          {it.post?.duration_seconds != null ? (
            <span className="absolute right-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {formatDuration(it.post.duration_seconds)}
            </span>
          ) : null}
           {it.post && onOpen && (it.post.kind === "reel" || it.post.kind === "video" || it.type?.startsWith("video")) ? (
            <>
              <button
                type="button"
                 aria-label={`Open ${it.post.kind === "reel" ? "reel" : "post"}`}
                 data-testid={`button-open-media-${it.post.id}`}
                  onClick={() => {
                    const post = it.post;
                    if (!post || typeof post.id !== "string" || !post.id.trim()) return;
                    onOpen(post);
                  }}
                 className="absolute inset-0 z-10"
              />
               {onManage ? (
                 <button
                   type="button"
                   aria-label="Manage post"
                   data-testid={`button-manage-media-${it.post.id}`}
                   onClick={(e) => {
                     e.stopPropagation();
                     onManage(it.post!);
                   }}
                   className="absolute right-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-full bg-background/75 backdrop-blur transition-transform active:scale-90"
                 >
                   <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                 </button>
               ) : null}
            </>
          ) : null}
        </li>
      ))}
    </ul>


  );
}

function mediaAspect(post: DbPost) {
  const width = post.original_width;
  const height = post.original_height;
  if (width && height && width > 0 && height > 0) {
    return Math.min(1.65, Math.max(0.62, width / height));
  }
  return post.kind === "reel" ? 0.8 : 1;
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  if (total >= 3600) {
    return `${Math.floor(total / 3600)}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
