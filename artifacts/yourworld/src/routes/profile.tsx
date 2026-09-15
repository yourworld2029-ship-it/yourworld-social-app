import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
  deleteSportsIntroduction,
  uploadSportsIntroduction,
  deleteSportsVerificationEvidence,
  getSportsVerificationDetails,
  saveSportsVerificationDetails,
  uploadSportsVerificationEvidence,
  type SportsDocument,
  type SportsVerificationDetails,
  type SportsVerificationEvidenceKind,
} from "@/lib/profile-data";
import {
  getSportsProfile,
  serializeSportsProfileBio,
  SportsDetailsPanel,
  SportsProfileBadge,
  toSportsProfileDraft,
  type SportsProfileDraft,
} from "@/components/yw/SportsProfile";
import { resolveMediaUrl, type DbPost } from "@/lib/social-data";
import { STORAGE_BUCKETS } from "@/lib/storage-upload";
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

// Temporary testing-only timing. Change this constant when manual review returns.
const SPORTS_VERIFICATION_TEST_DELAY_MS = 2 * 60 * 1000;

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
  const [sportsDocuments, setSportsDocuments] = useState<SportsDocument[]>([]);
  const [sportsDocumentsLoading, setSportsDocumentsLoading] = useState(false);
  const [sportsDocumentsError, setSportsDocumentsError] = useState<string | null>(null);
  const [sportsDocumentsUploading, setSportsDocumentsUploading] = useState(false);
  const [sportsDocumentToDelete, setSportsDocumentToDelete] = useState<SportsDocument | null>(null);
  const [sportsDocumentDeleting, setSportsDocumentDeleting] = useState(false);
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
  const sportsVerificationTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sportsVerificationTimer.current !== null) {
        window.clearTimeout(sportsVerificationTimer.current);
        sportsVerificationTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      !userId ||
      userId !== profile.id ||
      !profile.verification_requested ||
      profile.is_verified ||
      sportsVerificationTimer.current !== null
    ) {
      return;
    }

    sportsVerificationTimer.current = window.setTimeout(async () => {
      sportsVerificationTimer.current = null;
      try {
        await save({
          name: profile.display_name,
          username: profile.username,
          category: profile.category,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          avatarUrl: profile.avatar_url ?? undefined,
          isVerified: true,
          verificationRequested: false,
        });
        toast.success("Sports Profile Verified Successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Sports Profile verification could not be completed.",
        );
      }
    }, SPORTS_VERIFICATION_TEST_DELAY_MS);

    return () => {
      if (sportsVerificationTimer.current !== null) {
        window.clearTimeout(sportsVerificationTimer.current);
        sportsVerificationTimer.current = null;
      }
    };
  }, [profile, save, userId]);

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
  const isVerifiedSports = Boolean(sportsProfile?.verified);
  const sportsNameBadge =
    isVerifiedSports && sportsProfile
      ? sportsProfile.role === "Coach"
        ? "VERIFIED COACH"
        : sportsProfile.status !== "Not recorded"
          ? `${sportsProfile.status.toUpperCase()} PLAYER`
          : "VERIFIED PLAYER"
      : null;
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

  useEffect(() => {
    const path = sportsProfile?.sportsIntroductionPath;
    if (!sportsDetailsOpen || !path) {
      setSportsIntroductionUrl(null);
      return;
    }

    let cancelled = false;
    void resolveMediaUrl(path, STORAGE_BUCKETS.videos).then((url) => {
      if (!cancelled) setSportsIntroductionUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [sportsDetailsOpen, sportsProfile?.sportsIntroductionPath]);

  useEffect(() => {
    if (!sportsDetailsOpen || !userId || userId !== profile.id || !hasSportsProfile) {
      setSportsVerificationDetails(null);
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

  const editValue: ProfileEdit = {
    name: profile.display_name,
    username: profile.username,
    category: profile.category,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    avatarUrl: avatarSrc ?? undefined,
    verificationRequested: profile.verification_requested,
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

  const handleSubmitSportsVerification = async () => {
    if (!userId || userId !== profile.id || profile.verification_requested || profile.is_verified) return;
    setSportsVerificationSubmitting(true);
    try {
      await save({
        ...editValue,
        verificationRequested: true,
      });
      toast.success("Verification request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't submit for verification.");
    } finally {
      setSportsVerificationSubmitting(false);
    }
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
    <main className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_15%_0%,rgba(214,93,177,0.11),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(115,93,214,0.10),transparent_30%)] pb-8">
      <UserWatermark username={profile.username} />
      <header className="header-lux sticky top-0 z-40 flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-amber-200/70">YourWorld</p>
          <h1 data-testid="text-profile-username" className="mt-0.5 truncate font-display text-[15px] font-bold tracking-tight">
            @{profile.username || "…"}
          </h1>
        </div>
        <Link data-testid="link-profile-settings" to="/settings" aria-label="Settings" className="action-btn grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </header>

      {coverSrc ? (
        <div className="relative h-28 overflow-hidden sm:h-36">
          <img src={coverSrc} alt="" className="h-full w-full scale-105 object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-background/25 to-background" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-md sm:left-4">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            Athlete profile
          </div>
        </div>
      ) : (
        <div className="relative h-28 overflow-hidden bg-[radial-gradient(circle_at_85%_10%,rgba(216,180,91,0.22),transparent_32%),linear-gradient(135deg,rgba(210,56,151,0.16),transparent_55%)] sm:h-36">
          <div className="absolute inset-x-3 bottom-4 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent sm:inset-x-4" />
        </div>
      )}

      <section className="relative mx-auto -mt-9 max-w-2xl px-2.5 sm:-mt-11 sm:px-4">
        <div className="rounded-[1.5rem] border border-white/[0.13] bg-[linear-gradient(145deg,rgba(33,25,39,0.95),rgba(10,12,18,0.97)_58%,rgba(20,15,30,0.97))] p-3.5 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.98),0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-xl sm:rounded-[1.75rem] sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f4d58d,#d987c4_48%,#8647d2)] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_12px_34px_-12px_rgba(231,135,196,0.8)] sm:h-[92px] sm:w-[92px]">
              <span className="grid h-full w-full place-items-center rounded-full bg-[#0c0d12] p-[3px]">
                {avatarSrc ? (
                  <img data-testid="img-profile-avatar" src={avatarSrc} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <YwAvatar user={avatarUser} size={84} />
                )}
              </span>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p data-testid="text-profile-display-name" className="font-display text-[17px] font-bold tracking-tight sm:text-xl">
                  {profile.display_name || "Add your name"}
                </p>
                {sportsNameBadge ? <SportsProfileBadge badge={sportsNameBadge} verified /> : null}
              </div>
              {isVerifiedSports && sportsProfile ? (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-amber-100/80">
                  {sportsProfile.sport} · {sportsProfile.role}
                </p>
              ) : profile.category ? (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">{profile.category}</p>
              ) : null}
            </div>
          </div>

          <dl data-testid="stats-profile" className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/25 px-1 py-3 shadow-inner shadow-white/[0.02] sm:px-2 sm:py-3.5">
            <Stat label="Posts" value={mediaLoading ? "—" : formatCount(posts.length)} />
            <Stat label="Followers" value={counts.followers === null ? "—" : formatCount(counts.followers)} onClick={() => { setListTab("followers"); setListOpen(true); }} />
            <Stat label="Following" value={counts.following === null ? "—" : formatCount(counts.following)} onClick={() => { setListTab("following"); setListOpen(true); }} />
          </dl>

          <div className="pt-3.5">
            {profile.bio ? <Bio text={isVerifiedSports ? sportsProfile?.publicDetails || profile.bio : profile.bio} /> : null}
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
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3.5">
            <Button data-testid="button-edit-profile" variant="secondary" className="h-9 rounded-lg border-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(217,70,239,0.9)] hover:from-fuchsia-400 hover:to-violet-400" onClick={() => setEditOpen(true)}>
              Edit profile
            </Button>
            <Button data-testid="button-share-profile" variant="secondary" className="h-9 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold hover:bg-white/[0.12]" onClick={async () => {
              const url = `${window.location.origin}/profile`;
              try {
                if (navigator.share) await navigator.share({ title: profile.username, url });
                else { await navigator.clipboard.writeText(url); toast.success("Profile link copied"); }
              } catch { /* user cancelled */ }
            }}>
              Share profile
            </Button>
          </div>

        </div>
      </section>

      <Highlights
        userId={userId}
        posts={posts.map((post) => ({ ...post, media_url: src(post.media_url) }))}
      />

      <Tabs defaultValue="videos" className="mx-auto w-full max-w-3xl pt-4">
        <TabsList className="mx-3 grid w-auto grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-1 backdrop-blur-xl sm:mx-4">
          <TabsTrigger value="videos" className="rounded-lg py-2 text-[11px] data-[state=active]:bg-white/[0.09] data-[state=active]:text-white" aria-label="Videos">
            Videos
          </TabsTrigger>
          <TabsTrigger value="reels" className="rounded-lg py-2 text-[11px] data-[state=active]:bg-white/[0.09] data-[state=active]:text-white" aria-label="Reels">
            Reels
          </TabsTrigger>
          <TabsTrigger value="saved" className="rounded-lg py-2 text-[11px] data-[state=active]:bg-white/[0.09] data-[state=active]:text-white" aria-label="Saved">
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
            <Empty text={mediaLoading ? "Loading your posts…" : "No posts yet. Create your first one."} />
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
            <Empty text={mediaLoading ? "Loading reels…" : "No reels yet."} />
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
              verificationEvidenceUploading={sportsVerificationEvidenceUploading}
              onSubmitVerification={handleSubmitSportsVerification}
              onOpenVerificationReview={() => {
                setSportsDetailsOpen(false);
                navigate({ to: "/admin/sports-verification" });
              }}
              verificationSubmitting={sportsVerificationSubmitting}
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
        sportsProfile={sportsProfile}
        onOpenSportsDetails={() => {
          setEditOpen(false);
          setSportsDetailsOpen(true);
        }}
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
      <dd className="font-display text-lg font-bold leading-none sm:text-xl">{value}</dd>
      <dt className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">{label}</dt>
    </>
  );
  if (!onClick) return <div className="flex min-w-0 flex-col items-center justify-center px-2 py-1">{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 w-full flex-col items-center justify-center rounded-xl px-2 py-1 transition-transform active:scale-95"
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
    <ul data-testid="grid-profile-media" className="grid grid-cols-3 gap-1.5 bg-transparent px-3 sm:px-4">
      {items.map((it, i) => (
        <li
          key={`${it.post?.id ?? it.src}-${i}`}
          data-testid={`card-profile-media-${it.post?.id ?? i}`}
          className="media-frame relative overflow-hidden rounded-lg bg-secondary"
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
