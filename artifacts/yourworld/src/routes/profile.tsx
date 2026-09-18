import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Settings,
  MapPin,
  Link2,
  Heart,
  MessageCircleOff,
  Send,
  Pencil,
  Pin,
  PinOff,
  Archive,
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

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { YwAvatar } from "@/components/yw/Avatar";
import { EditProfileSheet, type ProfileEdit } from "@/components/yw/EditProfileSheet";
import {
  useMyProfile,
  useResolvedMedia,
  updateMyPost,
  deleteSportsIntroduction,
  uploadSportsIntroduction,
  deleteSportsVerificationEvidence,
  createSportsDocumentSignedUrl,
  getSportsVerificationDetails,
  saveSportsVerificationDetails,
  uploadSportsVerificationEvidence,
  type SportsVerificationDetails,
  type SportsVerificationEvidenceKind,
} from "@/lib/profile-data";
import {
  getOrCreateSportsProfile,
  serializeSportsProfileBio,
  SportsDetailsPanel,
  toSportsProfileDraft,
  type SportsProfileDraft,
} from "@/components/yw/SportsProfile";
import { resolveMediaUrl, type DbPost } from "@/lib/social-data";
import { STORAGE_BUCKETS } from "@/lib/storage-upload";
import { useFollowCounts } from "@/lib/follow-data";
import { ProfileTemplate } from "@/components/yw/ProfileTemplate";
import {
  SPORTS_VERIFICATION_DUPLICATE_MESSAGE,
  submitSportsVerification,
} from "@/lib/sports-verification.functions";





export const Route = createFileRoute("/profile")({
  validateSearch: (search: Record<string, unknown>): { connections?: "followers" | "following" } => ({
    connections:
      search.connections === "following"
        ? "following"
        : search.connections === "followers"
          ? "followers"
          : undefined,
  }),
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
  const {
    profile,
    avatarSrc,
    coverSrc,
    grid,
    reels,
    posts,
    savedPosts,
    loading,
    mediaLoading,
    save,
    userId,
    reload,
  } =
    useMyProfile();
  const navigate = useNavigate();
  const { connections } = Route.useSearch();
  const [editOpen, setEditOpen] = useState(false);
  const counts = useFollowCounts(userId);
  const [listOpen, setListOpen] = useState(false);
  const [listTab, setListTab] = useState<"followers" | "following">("followers");
  const [manage, setManage] = useState<DbPost | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [sportsDetailsOpen, setSportsDetailsOpen] = useState(false);
  const [sportsIntroductionUrl, setSportsIntroductionUrl] = useState<string | null>(null);
  const [sportsIntroductionUploading, setSportsIntroductionUploading] = useState(false);
  const [sportsIntroductionProgress, setSportsIntroductionProgress] = useState(0);
  const [sportsVerificationDetails, setSportsVerificationDetails] =
    useState<SportsVerificationDetails | null>(null);
  const [sportsVerificationDetailsLoading, setSportsVerificationDetailsLoading] = useState(false);
  const [sportsVerificationDetailsSaving, setSportsVerificationDetailsSaving] = useState(false);
  const [sportsVerificationEvidenceUploading, setSportsVerificationEvidenceUploading] =
    useState<SportsVerificationEvidenceKind | null>(null);
  const [sportsVerificationSubmitting, setSportsVerificationSubmitting] = useState(false);
  const [sportsDuplicateSubmissionWarning, setSportsDuplicateSubmissionWarning] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (connections === "followers" || connections === "following") {
      setListTab(connections);
      setListOpen(true);
    }
  }, [connections]);

  // Sports details are account-owned UI state. Clear it as soon as the
  // authenticated profile key changes so another account cannot see the
  // previous account while ID-scoped requests are being refreshed.
  useEffect(() => {
    setSportsDetailsOpen(false);
    setSportsIntroductionUrl(null);
    setSportsVerificationDetails(null);
    setSportsVerificationDetailsLoading(false);
    setSportsVerificationEvidenceUploading(null);
    setSportsIntroductionUploading(false);
    setSportsIntroductionProgress(0);
    setSportsVerificationDetailsSaving(false);
    setSportsVerificationSubmitting(false);
    setSportsDuplicateSubmissionWarning(null);
  }, [profile.id, userId]);

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
  const sportsProfile = getOrCreateSportsProfile({
    ...profile,
    username: profile.username,
    displayName: profile.display_name,
  });
  const hasSportsProfile = Boolean(sportsProfile);
  const isVerifiedSports = Boolean(sportsProfile?.verified);

  useEffect(() => {
    const path = sportsProfile?.sportsIntroductionPath;
    setSportsIntroductionUrl(null);
    if (!sportsDetailsOpen || !path || !userId || userId !== profile.id) {
      return;
    }

    let cancelled = false;
    void resolveMediaUrl(path, STORAGE_BUCKETS.videos).then((url) => {
      if (!cancelled) setSportsIntroductionUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [profile.id, sportsDetailsOpen, sportsProfile?.sportsIntroductionPath, userId]);

  useEffect(() => {
    setSportsVerificationDetails(null);
    if (!sportsDetailsOpen || !userId || userId !== profile.id || !hasSportsProfile) {
      setSportsVerificationDetailsLoading(false);
      return;
    }

    let cancelled = false;
    setSportsVerificationDetailsLoading(true);
    void getSportsVerificationDetails(userId)
      .then((details) => {
        if (!cancelled) setSportsVerificationDetails(details);
      })
      .catch((error) => {
        if (!cancelled) {
          setSportsVerificationDetails(null);
          toast.error(error instanceof Error ? error.message : "Verification details are unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setSportsVerificationDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile.bio, profile.category, profile.id, sportsDetailsOpen, hasSportsProfile, userId]);

  const handleSportsIntroductionUpload = async (file: File) => {
    if (!userId || userId !== profile.id || !sportsProfile) return;
    const previousPath = sportsProfile.sportsIntroductionPath;
    setSportsIntroductionUploading(true);
    setSportsIntroductionProgress(0);
    try {
      const nextPath = await uploadSportsIntroduction(userId, file, (progress) =>
        setSportsIntroductionProgress(progress),
      );
      const draft = toSportsProfileDraft(sportsProfile);
      draft.sportsIntroductionPath = nextPath;
      await saveSportsDetails(draft);
      if (previousPath && previousPath !== nextPath) {
        await deleteSportsIntroduction(userId, previousPath);
      }
      toast.success(previousPath ? "Sports Introduction replaced" : "Sports Introduction uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't upload this video.");
    } finally {
      setSportsIntroductionUploading(false);
    }
  };

  const handleSportsIntroductionDelete = async () => {
    if (!userId || userId !== profile.id || !sportsProfile?.sportsIntroductionPath) return;
    const path = sportsProfile.sportsIntroductionPath;
    setSportsIntroductionUploading(true);
    try {
      await deleteSportsIntroduction(userId, path);
      const draft = toSportsProfileDraft(sportsProfile);
      draft.sportsIntroductionPath = "";
      await saveSportsDetails(draft);
      toast.success("Sports Introduction deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete this video.");
    } finally {
      setSportsIntroductionUploading(false);
    }
  };

  const handleSaveSportsVerificationDetails = async (details: SportsVerificationDetails) => {
    if (!userId || userId !== profile.id) return;
    setSportsVerificationDetailsSaving(true);
    try {
      const savedDetails = await saveSportsVerificationDetails(userId, details);
      setSportsVerificationDetails(savedDetails);
      toast.success("Verification details saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save verification details.");
    } finally {
      setSportsVerificationDetailsSaving(false);
    }
  };

  const handleSportsVerificationEvidenceUpload = async (
    kind: SportsVerificationEvidenceKind,
    file: File,
  ) => {
    if (!userId || userId !== profile.id) return;
    setSportsVerificationEvidenceUploading(kind);
    try {
      const currentDetails =
        sportsVerificationDetails ?? (await getSportsVerificationDetails(userId));
      const previousEvidence = currentDetails[kind];
      const uploaded = await uploadSportsVerificationEvidence(userId, kind, file);
      const nextDetails = { ...currentDetails, [kind]: uploaded } as SportsVerificationDetails;
      const savedDetails = await saveSportsVerificationDetails(userId, nextDetails);
      setSportsVerificationDetails(savedDetails);
      if (previousEvidence?.path && previousEvidence.path !== uploaded.path) {
        await deleteSportsVerificationEvidence(userId, previousEvidence.path);
      }
      toast.success("Private verification evidence uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't upload verification evidence.");
    } finally {
      setSportsVerificationEvidenceUploading(null);
    }
  };

  const handleSportsVerificationEvidenceDelete = async (
    kind: SportsVerificationEvidenceKind,
  ) => {
    if (!userId || userId !== profile.id) return;
    setSportsVerificationEvidenceUploading(kind);
    try {
      const currentDetails =
        sportsVerificationDetails ?? (await getSportsVerificationDetails(userId));
      const evidence = currentDetails[kind];
      if (!evidence) return;
      await deleteSportsVerificationEvidence(userId, evidence.path);
      const savedDetails = await saveSportsVerificationDetails(userId, {
        ...currentDetails,
        [kind]: null,
      });
      setSportsVerificationDetails(savedDetails);
      toast.success("Private verification evidence deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete verification evidence.");
    } finally {
      setSportsVerificationEvidenceUploading(null);
    }
  };

  const handleSportsVerificationEvidencePreview = async (
    _kind: SportsVerificationEvidenceKind,
    path: string,
  ) => {
    if (!userId || userId !== profile.id) return;
    try {
      const url = await createSportsDocumentSignedUrl(userId, path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't preview this document.");
    }
  };

  const editValue: ProfileEdit = {
    name: profile.display_name,
    username: profile.username,
    category: profile.category,
    normalCategories: profile.normal_categories,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    avatarUrl: avatarSrc ?? undefined,
    verificationRequested: profile.verification_requested,
  };

  const saveSportsDetails = async (draft: SportsProfileDraft) => {
    if (!sportsProfile) return;
    if (
      (profile.is_verified || profile.verification_requested) &&
      draft.sportsIntroductionPath !== sportsProfile.sportsIntroductionPath
    ) {
      throw new Error("Sports Introduction is locked after verification submission.");
    }
    await save({
      ...editValue,
      username: draft.username.trim() || profile.username,
      category: `${draft.role}${draft.sport.trim() ? ` · ${draft.sport.trim()}` : ""}`,
      bio: serializeSportsProfileBio(profile.bio, draft),
    });
    toast.success("Sports details saved");
  };

  const handleSubmitSportsVerification = async (details: SportsVerificationDetails) => {
    if (!userId || userId !== profile.id || profile.verification_requested || profile.is_verified) return;
    setSportsVerificationSubmitting(true);
    try {
      const result = await submitSportsVerification({
        data: {
          fullName: details.fullName,
          fatherName: details.fatherName,
          dateOfBirth: details.dateOfBirth,
          address: details.address,
          passportNumber: details.passportNumber,
          certificateNumber: details.certificateNumber,
          identityDetailsConfirmed: details.identityDetailsConfirmed,
        },
      });
      await reload();
      const submittedDetails = await getSportsVerificationDetails(userId);
      setSportsVerificationDetails(submittedDetails);
      if (result.notification.sent) {
        toast.success("Verification request submitted");
      } else {
        toast.warning("Verification request submitted, but Support could not be notified yet.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't submit for verification.";
      if (message.includes(SPORTS_VERIFICATION_DUPLICATE_MESSAGE)) {
        setSportsDuplicateSubmissionWarning(SPORTS_VERIFICATION_DUPLICATE_MESSAGE);
      } else {
        toast.error(message);
      }
    } finally {
      setSportsVerificationSubmitting(false);
    }
  };

  if (loading || (userId !== null && profile.id !== userId)) {
    return null;
  }

  if (!userId) {
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
    <ProfileTemplate
      profile={profile}
      avatarSrc={avatarSrc}
      coverSrc={coverSrc}
      userId={userId}
      posts={posts}
      grid={grid}
      reels={reels}
      savedPosts={savedPosts}
      mediaLoading={mediaLoading}
      counts={counts}
      sportsProfile={sportsProfile}
      isVerifiedSports={isVerifiedSports}
      isOwner
      listOpen={listOpen}
      listTab={listTab}
      onListOpenChange={(open) => {
         setListOpen(open);
         if (!open && connections) {
           void navigate({ to: "/profile", search: {}, replace: true });
         }
       }}
      onListTabChange={(tab) => {
        setListTab(tab);
        if (listOpen) {
          void navigate({ to: "/profile", search: { connections: tab }, replace: true });
        }
      }}
      onFollowersClick={() => {
         setListTab("followers");
         setListOpen(true);
         void navigate({ to: "/profile", search: { connections: "followers" }, replace: true });
       }}
      onFollowingClick={() => {
         setListTab("following");
         setListOpen(true);
         void navigate({ to: "/profile", search: { connections: "following" }, replace: true });
       }}
      onEditProfile={() => setEditOpen(true)}
      onShare={async () => {
        const url = `${window.location.origin}/profile`;
        try {
          if (navigator.share) await navigator.share({ title: profile.username, url });
          else { await navigator.clipboard.writeText(url); toast.success("Profile link copied"); }
        } catch { /* user cancelled */ }
      }}
      onOpen={openViewer}
      onManage={openManage}
      mediaSrc={src}
      emptyVideos={mediaLoading ? "Loading your posts…" : "No posts yet. Create your first one."}
      emptyReels={mediaLoading ? "Loading reels…" : "No reels yet."}
    >

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
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

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
              onSave={saveSportsDetails}
              sportsIntroductionUrl={sportsIntroductionUrl}
              sportsIntroductionUploading={sportsIntroductionUploading}
              sportsIntroductionProgress={sportsIntroductionProgress}
              onUploadSportsIntroduction={handleSportsIntroductionUpload}
              onDeleteSportsIntroduction={handleSportsIntroductionDelete}
              verificationDetails={sportsVerificationDetails}
              verificationDetailsLoading={sportsVerificationDetailsLoading}
              verificationDetailsSaving={sportsVerificationDetailsSaving}
              onSaveVerificationDetails={handleSaveSportsVerificationDetails}
              onUploadVerificationEvidence={handleSportsVerificationEvidenceUpload}
              onDeleteVerificationEvidence={handleSportsVerificationEvidenceDelete}
              onPreviewVerificationEvidence={handleSportsVerificationEvidencePreview}
              verificationEvidenceUploading={sportsVerificationEvidenceUploading}
              onSubmitVerification={handleSubmitSportsVerification}
              onOpenVerificationReview={() => {
                setSportsDetailsOpen(false);
                navigate({ to: "/admin/sports-verification" });
              }}
              verificationSubmitting={sportsVerificationSubmitting}
              duplicateSubmissionWarning={sportsDuplicateSubmissionWarning}
              onDismissDuplicateSubmissionWarning={() => setSportsDuplicateSubmissionWarning(null)}
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

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        user={avatarUser}
        value={editValue}
        onSave={save}
        sportsProfile={sportsProfile}
        onOpenSportsDetails={() => {
          setEditOpen(false);
          setSportsDetailsOpen(true);
        }}
      />

    </ProfileTemplate>
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




