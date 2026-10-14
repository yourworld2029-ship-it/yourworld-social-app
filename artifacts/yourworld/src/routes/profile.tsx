import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Settings,
  Link2,
  Heart,
  MessageCircleOff,
  Send,
  Pencil,
  Download,
  Share2,
  Pin,
  PinOff,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { EditProfileSheet, type ProfileEdit } from "@/components/yw/EditProfileSheet";
import {
  useMyProfile,
  updateMyPost,
  setMyPostPinned,
  deleteMyPost,
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
import { buildWatchShareUrl } from "@/lib/watch-links";
import { buildPublicAppUrl } from "@/lib/public-app-url";
import { sharePublicContent } from "@/lib/share-public";
import { resolveAuthorizedOfflineSource } from "@/lib/video-media-api";
import { removeDeletedPostFromQueryCaches } from "@/lib/post-deletion";
import { STORAGE_BUCKETS } from "@/lib/storage-upload";
import { useFollowCounts } from "@/lib/follow-data";
import { ProfileTemplate } from "@/components/yw/ProfileTemplate";
import { DownloadedVideoList } from "@/components/yw/DownloadedVideoList";
import {
  SPORTS_VERIFICATION_DUPLICATE_MESSAGE,
  submitSportsVerification,
} from "@/lib/sports-verification.functions";
import {
  listDownloadedVideos,
  migrateLegacyDownloadedVideos,
  getDownloadedVideoUrl,
  removeDownloadedVideo,
  subscribeDownloadedVideoLibrary,
  downloadAudioOnly,
  downloadVideoForOfflineInBackground,
  sanitizeDownloadName,
  type DownloadedVideo,
  type DownloadedVideoMetadata,
} from "@/lib/yw-download";
import { loadSavedLongVideos, type LongVideo } from "@/lib/video-data";
import { togglePostFavorite } from "@/lib/video-context-actions";
import { DownloadSheet, type DownloadChoice } from "@/components/yw/DownloadSheet";
import {
  effectiveDownloadSourceQuality,
  needsOnDemandVideoTranscode,
  qualityTierFromDimensions,
  qualityTierFromSourceMetadata,
  resolveVideoDownloadSelection,
  type DownloadQualityUrls,
} from "@/lib/video-quality";
import { useVideoPlayback } from "@/lib/video-playback";
import { supabase } from "@/integrations/supabase/client";
import { PostEditDialog } from "@/components/yw/PostEditDialog";
import {
  isMediaDownloadLocked,
  showMediaDownloadBusyToast,
  useMediaConcurrency,
  type MediaDownloadLease,
} from "@/lib/media-concurrency";





export const Route = createFileRoute("/profile")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    connections?: "followers" | "following";
    tab?: "videos" | "reels" | "saved" | "downloads";
  } => ({
    connections:
      search.connections === "following"
        ? "following"
        : search.connections === "followers"
          ? "followers"
          : undefined,
      tab:
        search.tab === "reels"
          ? "reels"
          : search.tab === "saved"
            ? "saved"
            : search.tab === "downloads"
              ? "downloads"
              : search.tab === "videos"
                ? "videos"
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

const DOWNLOADS_DEVICE_SCOPE = "device";

function ProfilePage() {
  const queryClient = useQueryClient();
  const {
    profile,
    avatarSrc,
    coverSrc,
    grid,
    reels,
    posts,
    loading,
    mediaLoading,
    save,
    userId,
    reload,
    removePost,
    patchPost,
  } =
    useMyProfile();
  const navigate = useNavigate();
  const { isMediaDownloadInProgress } = useMediaConcurrency();
  const { connections, tab } = Route.useSearch();
  const savedVideosQuery = useQuery({
    queryKey: ["saved-long-videos", userId],
    queryFn: () => {
      if (!userId) throw new Error("Sign in to load saved videos");
      return loadSavedLongVideos(userId);
    },
    enabled: Boolean(userId && tab === "saved"),
    staleTime: 0,
  });
  const removeSavedLongVideo = async (video: LongVideo) => {
    if (!userId) return;
    const queryKey = ["saved-long-videos", userId] as const;
    const savedVideos = queryClient.getQueryData<LongVideo[]>(queryKey) ?? [];
    const originalIndex = savedVideos.findIndex((saved) => saved.id === video.id);
    if (originalIndex < 0) return;

    queryClient.setQueryData<LongVideo[]>(queryKey, (current) =>
      (current ?? []).filter((saved) => saved.id !== video.id),
    );
    try {
      await togglePostFavorite(userId, video.id, true);
      toast.success("Removed from saved");
    } catch (error) {
      queryClient.setQueryData<LongVideo[]>(queryKey, (current) => {
        const latest = current ?? [];
        if (latest.some((saved) => saved.id === video.id)) return latest;
        const insertAt = Math.min(originalIndex, latest.length);
        return [...latest.slice(0, insertAt), video, ...latest.slice(insertAt)];
      });
      toast.error(
        error instanceof Error ? error.message : "Couldn't remove this video from Saved.",
      );
    }
  };
  const { activateVideo } = useVideoPlayback();
  const [downloads, setDownloads] = useState<DownloadedVideo[]>([]);
  const [downloadsLoading, setDownloadsLoading] = useState(false);
  const [downloadsLoadedFor, setDownloadsLoadedFor] = useState<string | null>(null);
  const [downloadsAuthRevision, setDownloadsAuthRevision] = useState(0);
  const downloadsRevisionRef = useRef(0);
  const [downloadTarget, setDownloadTarget] = useState<DbPost | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadSourceUrl, setDownloadSourceUrl] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const counts = useFollowCounts(userId);
  const [listOpen, setListOpen] = useState(false);
  const [listTab, setListTab] = useState<"followers" | "following">("followers");
  const [manage, setManage] = useState<DbPost | null>(null);
  const downloadQualityPost = downloadTarget as
    | (DbPost & {
        source_quality_tier?: string | null;
        original_width?: number | null;
        original_height?: number | null;
        quality_urls?: DownloadQualityUrls | null;
        qualityUrls?: DownloadQualityUrls | null;
      })
    | null;
  const downloadSourceQualityTier = downloadQualityPost
    ? qualityTierFromSourceMetadata(downloadQualityPost.source_quality_tier)
      ?? qualityTierFromDimensions(
          downloadQualityPost.original_width,
          downloadQualityPost.original_height,
        )
    : null;
  const downloadQualityUrls =
    downloadQualityPost?.qualityUrls ?? downloadQualityPost?.quality_urls ?? undefined;
  const [editing, setEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbPost | null>(null);
  const [deleting, setDeleting] = useState(false);
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
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      downloadsRevisionRef.current += 1;
      setDownloadsLoading(false);
      setDownloadsLoadedFor(null);
      setDownloadsAuthRevision((revision) => revision + 1);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let subscribed = true;
    const unsubscribe = subscribeDownloadedVideoLibrary(() => {
      const revision = ++downloadsRevisionRef.current;
      void listDownloadedVideos()
        .then((records) => {
          if (!subscribed || revision !== downloadsRevisionRef.current) return;
          setDownloads(records);
          setDownloadsLoadedFor(DOWNLOADS_DEVICE_SCOPE);
        })
        .catch((error) => {
          if (subscribed && revision === downloadsRevisionRef.current) {
            console.error("[downloads] could not refresh the offline library", error);
          }
        });
    });
    return () => {
      subscribed = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (tab !== "downloads" || downloadsLoadedFor === DOWNLOADS_DEVICE_SCOPE) return;
    const revisionAtLoadStart = downloadsRevisionRef.current;
    setDownloadsLoading(true);
    void migrateLegacyDownloadedVideos()
      .then(() => listDownloadedVideos())
      .then((records) => {
        if (!cancelled && revisionAtLoadStart === downloadsRevisionRef.current) {
          setDownloads(records);
          setDownloadsLoadedFor(DOWNLOADS_DEVICE_SCOPE);
        }
      })
      .catch((error) => {
        if (!cancelled && revisionAtLoadStart === downloadsRevisionRef.current) {
          setDownloadsLoadedFor(DOWNLOADS_DEVICE_SCOPE);
          toast.error(error instanceof Error ? error.message : "Could not load offline videos");
        }
      })
      .finally(() => {
        if (!cancelled) setDownloadsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [downloadsAuthRevision, downloadsLoadedFor, tab]);

  const openDownloadedVideo = async (record: DownloadedVideo) => {
    const url = await getDownloadedVideoUrl(record);
    if (!url) {
      toast.error("This download is no longer available on this device");
      return;
    }
    activateVideo({
      id: record.id,
      url,
      title: record.title || "Downloaded video",
      thumbnailUrl: record.thumbnailUrl,
      detailRoute: `/downloads/${encodeURIComponent(record.id)}`,
      backTo: "/profile?tab=downloads",
    });
    await navigate({
      to: "/downloads/$downloadId",
      params: { downloadId: record.id },
    });
  };

  const deleteDownloadedVideo = async (record: DownloadedVideo) => {
    await removeDownloadedVideo(record);
    setDownloads((current) => current.filter((item) => item.id !== record.id));
    toast.success("Removed from downloads");
  };

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
    setDeleteTarget(null);
    setEditing(false);
  };

  const startEdit = (post: DbPost) => {
    setManage(post);
    setEditing(true);
  };

  const patchManaged = async (
    patch: Parameters<typeof updateMyPost>[1] & { pinned?: boolean },
    msg: string,
  ) => {
    if (!manage) return;
    const prev = manage;
    const { pinned, ...postPatch } = patch;

    if (pinned !== undefined) {
      setManage({ ...prev, pinned } as DbPost);
      patchPost({ ...prev, pinned } as DbPost);
      try {
        const saved = await setMyPostPinned(prev.id, pinned);
        const updated = { ...prev, pinned: saved.pinned } as DbPost;
        patchPost(updated);
        setManage(null);
        toast.success(
          saved.pinned ? "Pinned to your main grid" : "Unpinned from your main grid",
          {
            duration: 2600,
            style: {
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              color: "#fafafa",
            },
          },
        );
      } catch (error) {
        setManage(prev);
        patchPost(prev);
        toast.error(
          error instanceof Error ? error.message : "Couldn't update this post's pin state.",
          {
            style: {
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              color: "#fafafa",
            },
          },
        );
      }
      return;
    }
    setManage({ ...prev, ...postPatch } as DbPost);
    patchPost({ ...prev, ...postPatch } as DbPost);
    try {
      await updateMyPost(prev.id, postPatch);
      toast.success(msg);
      await reload();
    } catch (e) {
      setManage(prev);
      patchPost(prev);
      toast.error(e instanceof Error ? e.message : "Couldn't update");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !userId || deleting) return;
    setDeleting(true);
    try {
      await deleteMyPost(deleteTarget);
      removeDeletedPostFromQueryCaches(queryClient, deleteTarget.id);
      removePost(deleteTarget.id);
      setDeleteTarget(null);
      setManage(null);
      toast.success("Post deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete this post");
    } finally {
      setDeleting(false);
    }
  };

  const openManagedDownload = async () => {
    if (!manage || !userId) return;
    if (isMediaDownloadLocked()) {
      showMediaDownloadBusyToast();
      return;
    }
    const post = manage;
    setManage(null);
    setDownloadTarget(post);
    setDownloadSourceUrl(null);
    try {
      const mediaBucket =
        post.kind === "reel" ? STORAGE_BUCKETS.reels : STORAGE_BUCKETS.videos;
      const mediaUrl = await resolveMediaUrl(post.media_url, mediaBucket);
      if (!mediaUrl) throw new Error("This media file is unavailable");
      setDownloadSourceUrl(mediaUrl);
      setDownloadOpen(true);
    } catch (error) {
      setDownloadTarget(null);
      toast.error(error instanceof Error ? error.message : "Couldn't prepare this download");
    }
  };

  const downloadManagedMedia = async (
    choice: DownloadChoice,
    reportProgress?: (percent: number) => void,
    lease?: MediaDownloadLease,
  ) => {
    if (!downloadTarget || !userId) return;
    const post = downloadTarget;
    try {
      if (post.kind === "video") {
        const existingDownloads = await listDownloadedVideos();
        const existingSelection =
          choice === "original" || choice === "mp3"
            ? null
            : resolveVideoDownloadSelection(
                choice,
                downloadSourceUrl ?? post.media_url,
                downloadQualityUrls,
                downloadSourceQualityTier,
                post.cloudflare_stream_id ?? post.cloudflare_stream_uid,
              );
        const cloudflareStreamId =
          post.cloudflare_stream_id ?? post.cloudflare_stream_uid;
        const desiredQuality =
          choice === "original" || choice === "mp3"
            ? "original"
            : existingSelection?.usesVariant
              ? existingSelection.actualQuality
              : existingSelection &&
                  needsOnDemandVideoTranscode(
                    choice,
                    existingSelection,
                    downloadSourceQualityTier,
                    cloudflareStreamId,
                  )
                ? choice
                : effectiveDownloadSourceQuality(
                    downloadSourceQualityTier,
                    cloudflareStreamId,
                  );
        const alreadyDownloaded = existingDownloads.some(
          (item) => item.mediaId === post.id && item.quality === desiredQuality,
        );
        if (alreadyDownloaded) {
          toast.info("Video is already downloaded");
          return;
        }
      }

      const mediaBucket =
        post.kind === "reel" ? STORAGE_BUCKETS.reels : STORAGE_BUCKETS.videos;
      const sourceMediaUrl =
        downloadSourceUrl ?? (await resolveMediaUrl(post.media_url, mediaBucket));
      const selection =
        choice !== "original" && choice !== "mp3"
          ? resolveVideoDownloadSelection(
              choice,
              sourceMediaUrl,
              downloadQualityUrls,
              downloadSourceQualityTier,
              post.cloudflare_stream_id ?? post.cloudflare_stream_uid,
            )
          : null;
      if (!sourceMediaUrl) throw new Error("This media file is unavailable");
      if (choice !== "original" && choice !== "mp3" && !selection) {
        throw new Error("This media file is unavailable");
      }
      const offlineSource = await resolveAuthorizedOfflineSource(
        post.id,
        (choice === "mp3" ? "original" : choice) as
          | "original"
          | "360p"
          | "480p"
          | "720p"
          | "1080p"
          | "1440p"
          | "2160p",
        { url: selection?.url ?? sourceMediaUrl, sourceUrl: sourceMediaUrl,
          qualityUrl: selection?.usesVariant ? selection.url : null,
          streamId: post.cloudflare_stream_id ?? post.cloudflare_stream_uid,
          bucket: mediaBucket,
          sourceQualityTier: downloadSourceQualityTier,
        },
      );
      const mediaUrl = offlineSource.url;

      const creatorName = profile.display_name || "YourWorld creator";
      const creatorUsername = profile.username || "creator";
      const title = post.title || post.caption || "YourWorld media";
      const thumbnailUrl = post.thumbnail_url
        ? await resolveMediaUrl(post.thumbnail_url, STORAGE_BUCKETS.videos)
        : null;
      const quality: DownloadedVideoMetadata["quality"] =
        offlineSource.actualQuality as DownloadedVideoMetadata["quality"];
      const metadata = {
        ownerId: userId,
        mediaId: post.id,
        title,
        creatorName,
        creatorUsername,
        views: Number(
          (post as DbPost & { views_count?: number | null; views?: number | null })
            .views ?? (post as DbPost & { views_count?: number | null }).views_count ?? 0,
        ),
        createdAt: post.created_at ?? null,
        durationSeconds: post.duration_seconds ?? null,
        thumbnailUrl,
        posterUrl: thumbnailUrl,
        quality,
      };
      const baseName = sanitizeDownloadName(
        title,
        `yourworld-${post.kind === "reel" ? "reel" : "video"}-${post.id}`,
      );

      if (choice === "mp3") {
        const audioDownload = await downloadAudioOnly(mediaUrl, baseName, reportProgress, lease);
        if (audioDownload === null) return;
      } else {
        const downloadMode = await downloadVideoForOfflineInBackground(
          mediaUrl,
          baseName,
          creatorUsername,
          reportProgress,
          metadata,
          {
            fallbackUrls: offlineSource.fallbackUrls,
            targetQuality:
              choice !== "original" && !selection?.isSourceFallback
                ? choice
                : undefined,
            transcodeSource:
              choice !== "original" &&
              !selection?.usesVariant &&
              !selection?.isSourceFallback,
          },
          lease,
        );
        if (downloadMode === null) return;
        toast.success(
          downloadMode === "native-offline"
            ? post.kind === "reel"
              ? "Saved Reel for offline viewing"
              : "Saved video for offline viewing"
            : post.kind === "reel"
              ? "Saved Reel with YourWorld watermark"
              : "Saved video with YourWorld watermark",
        );
        return;
      }
      toast.success(
        "Download saved",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't download this media");
      throw error;
    }
  };

  const shareManagedMedia = async () => {
    if (!manage) return;
    const post = manage;
    setManage(null);
    const watchKind =
      post.kind === "reel" ? "reel" : post.kind === "video" ? "video" : null;
    const url = watchKind
      ? buildWatchShareUrl(post.id, watchKind)
      : buildPublicAppUrl(`/?post=${encodeURIComponent(post.id)}`);
    const title = post.title || post.caption || "YourWorld media";

    try {
      const result = await sharePublicContent({
        title,
        text: title || "Shared from YourWorld",
        url,
      });
      if (result === "copied") toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't share this media");
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

  if (tab === "downloads") {
    return (
      <main
        data-testid="offline-profile-downloads"
        className="min-h-screen bg-background pb-8 text-foreground"
      >
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button
              type="button"
              aria-label="Back to profile"
              onClick={() => void navigate({ to: "/profile", search: {} })}
              className="inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              Profile
            </button>
            <div>
              <h1 className="font-display text-lg font-bold">Downloads</h1>
              <p className="text-xs text-muted-foreground">Saved on this device</p>
            </div>
          </div>
        </header>
        <section className="mx-auto max-w-3xl pt-2">
          <DownloadedVideoList
            videos={downloads}
            loading={
              downloadsLoading || downloadsLoadedFor !== DOWNLOADS_DEVICE_SCOPE
            }
            onOpen={(record) => void openDownloadedVideo(record)}
            onDelete={deleteDownloadedVideo}
          />
        </section>
      </main>
    );
  }

  if (loading || (userId !== null && profile.id !== userId)) {
    return (
      <main
        className="min-h-screen bg-background px-4 pb-8"
        role="status"
        aria-label="Loading profile"
        aria-busy="true"
        data-testid="profile-loading-skeleton"
      >
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 py-3 backdrop-blur">
          <div className="mx-auto h-6 w-32 animate-pulse rounded bg-secondary" />
        </header>
        <section className="mx-auto max-w-3xl animate-pulse pt-8">
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
      downloads={downloads}
      downloadsLoading={downloadsLoading}
      savedVideos={savedVideosQuery.data ?? []}
      savedVideosLoading={savedVideosQuery.isLoading}
      savedVideosError={savedVideosQuery.isError}
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
      onOpen={openViewer}
      onManage={openManage}
      onOpenDownload={(record) => void openDownloadedVideo(record)}
      onDeleteDownload={deleteDownloadedVideo}
      onOpenSavedVideo={(video) =>
        void navigate({
          to: "/video/$videoId",
          params: { videoId: video.id },
        })
      }
      onRemoveSavedVideo={removeSavedLongVideo}
      onOpenDownloadAthlete={(record) => {
        if (record.creatorId) {
          void navigate({ to: "/u/$userId", params: { userId: record.creatorId } });
        }
      }}
      selectedTab={tab ?? "videos"}
      onTabChange={(nextTab) => {
        void navigate({
          to: "/profile",
           search: { connections: undefined, tab: nextTab === "videos" ? undefined : nextTab },
          replace: true,
        });
      }}
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
                icon={<Download className="h-5 w-5" />}
                label="Download"
                sub="Save a copy of your media."
                busy={isMediaDownloadInProgress}
                onClick={() => {
                  if (isMediaDownloadLocked()) {
                    showMediaDownloadBusyToast();
                    return;
                  }
                  void openManagedDownload();
                }}
              />
              <OptionRow
                icon={<Share2 className="h-5 w-5" />}
                label="Share"
                onClick={() => void shareManagedMedia()}
              />
              <OptionRow
                icon={<Link2 className="h-5 w-5" />}
                label="Copy link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      buildPublicAppUrl(`/?post=${encodeURIComponent(manage.id)}`),
                    );
                    toast.success("Link copied to clipboard");
                  } catch {
                    toast.error("Couldn't copy link");
                  }
                }}
              />
              <OptionRow
                icon={<Trash2 className="h-5 w-5" />}
                label="Delete"
                sub="Permanently remove this post."
                destructive
                onClick={() => setDeleteTarget(manage)}
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <DownloadSheet
        open={downloadOpen && !!downloadTarget}
        onOpenChange={setDownloadOpen}
        title={downloadTarget?.title || downloadTarget?.caption || "YourWorld media"}
        durationSeconds={downloadTarget?.duration_seconds ?? null}
        sourceQualityTier={downloadSourceQualityTier}
        qualityMediaUrls={downloadQualityUrls}
        cloudflareStreamId={
          downloadQualityPost?.cloudflare_stream_id ??
          downloadQualityPost?.cloudflare_stream_uid ??
          null
        }
        sourceMediaUrl={downloadSourceUrl}
        mediaBucket={downloadTarget?.kind === "reel" ? "reels" : "videos"}
        enforceSourceQualityLimit={downloadTarget?.kind !== "reel"}
        onDownload={downloadManagedMedia}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <PostEditDialog
        open={!!manage && editing}
        post={manage}
        userId={userId}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
        onSaved={(next) => {
          patchPost(next);
          setManage(null);
          setEditing(false);
        }}
      />

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        user={avatarUser}
        value={editValue}
        onSave={save}
        sportsProfile={sportsProfile}
        sportsVerificationCountry={sportsVerificationDetails?.country}
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
  busy,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  onClick?: () => void;
  destructive?: boolean;
  busy?: boolean;
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
    <button
      type="button"
      onClick={onClick}
      aria-disabled={busy || undefined}
      className={`w-full transition-colors active:bg-secondary ${busy ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {content}
    </button>
  );
}




