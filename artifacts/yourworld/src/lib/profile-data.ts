import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKETS, uploadWithProgress, type ProgressFn } from "@/lib/storage-upload";
import { resolveMediaUrl, type DbPost } from "@/lib/social-data";
import { normalizePostRow, writeCompat } from "@/lib/supabase-compat";
import {
  isSportsIdentityCategory,
  normalizeNormalProfileCategories,
  resolveNormalProfileCategories,
} from "@/lib/profile-category";

export type MyProfile = {
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

export type MyProfileEdit = {
  name: string;
  username: string;
  category: string;
  normalCategories: string[];
  bio: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  coverUrl?: string;
  avatarFile?: File;
  coverFile?: File;
  verificationRequested?: boolean;
  isVerified?: boolean;
};

export type SportsDocument = {
  path: string;
  name: string;
  mimeType: string;
  size: number | null;
  updatedAt: string | null;
};

export type SportsVerificationEvidenceKind =
  | "sportsCertificate"
  | "passportFirstPage"
  | "passportVisaStampPage"
  | "tournamentPhoto";

export type SportsVerificationEvidence = {
  path: string;
  name: string;
  mimeType: string;
  size: number | null;
  updatedAt: string | null;
};

export type SportsVerificationDetails = {
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  address: string;
  passportNumber: string;
  certificateNumber: string;
  identityDetailsConfirmed: boolean;
  villageTown: string;
  district: string;
  state: string;
  country: string;
  mobileNumber: string;
  email: string;
  reviewStatus?: "not_submitted" | "pending" | "approved" | "rejected" | "correction_requested";
  reviewReason?: string | null;
  submittedAt?: string | null;
  sportsCertificate: SportsVerificationEvidence | null;
  passportFirstPage: SportsVerificationEvidence | null;
  passportVisaStampPage: SportsVerificationEvidence | null;
  tournamentPhoto: SportsVerificationEvidence | null;
};

type StorageDocument = {
  id: string | null;
  name: string;
  metadata?: { mimetype?: string; size?: number };
  updated_at?: string | null;
  created_at?: string | null;
};

const empty: MyProfile = {
  id: "",
  username: "",
  display_name: "",
  bio: "",
  category: "",
  normal_categories: [],
  location: "",
  website: "",
  avatar_url: null,
  cover_url: null,
  is_verified: false,
  verification_requested: false,
};

async function signedIfNeeded(url: string | null) {
  if (!url) return null;
  return resolveMediaUrl(url, "avatars");
}

async function requireDocumentOwner(ownerId: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (data.session?.user.id !== ownerId) {
    throw new Error("Only the document owner can access sports documents.");
  }
}

const lockedSportsVerificationStatuses = new Set(["pending", "approved"]);

async function requireMutableSportsVerification(ownerId: string) {
  await requireDocumentOwner(ownerId);

  const [{ data: profile, error: profileError }, { data: details, error: detailsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("is_verified,verification_requested")
        .eq("id", ownerId)
        .maybeSingle(),
      supabase
        .from("sports_verification_details")
        .select("review_status")
        .eq("user_id", ownerId)
        .maybeSingle(),
    ]);

  if (profileError) throw new Error(profileError.message);
  if (detailsError) throw new Error(detailsError.message);
  const status = String(details?.review_status ?? "not_submitted");
  if (
    profile?.is_verified === true ||
    profile?.verification_requested === true ||
    lockedSportsVerificationStatuses.has(status)
  ) {
    throw new Error("Sports Verification files are locked while this request is under review or approved.");
  }
}

function evidenceFromPath(
  path: string | null,
  kind: SportsVerificationEvidenceKind,
): SportsVerificationEvidence | null {
  if (!path) return null;
  return {
    path,
    name: path.split("/").at(-1) || kind,
    mimeType: "application/octet-stream",
    size: null,
    updatedAt: null,
  };
}

function emptySportsVerificationDetails(email = "", mobileNumber = ""): SportsVerificationDetails {
  return {
    fullName: "",
    fatherName: "",
    dateOfBirth: "",
    address: "",
    passportNumber: "",
    certificateNumber: "",
    identityDetailsConfirmed: false,
    villageTown: "",
    district: "",
    state: "",
    country: "India",
    mobileNumber,
    email,
    reviewStatus: "not_submitted",
    reviewReason: null,
    submittedAt: null,
    sportsCertificate: null,
    passportFirstPage: null,
    passportVisaStampPage: null,
    tournamentPhoto: null,
  };
}

export async function getSportsVerificationDetails(ownerId: string): Promise<SportsVerificationDetails> {
  await requireDocumentOwner(ownerId);
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionEmail = sessionData.session?.user.email ?? "";
  const sessionMobile = sessionData.session?.user.phone ?? "";
  const { data, error } = await supabase
    .from("sports_verification_details")
    .select("*")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return emptySportsVerificationDetails(sessionEmail, sessionMobile);

  return {
    fullName: data.full_name ?? "",
    fatherName: data.father_name ?? "",
    dateOfBirth: data.date_of_birth ?? "",
    address: data.address ?? "",
    passportNumber: data.passport_number ?? "",
    certificateNumber: data.certificate_number ?? "",
    identityDetailsConfirmed: data.identity_details_confirmed === true,
    villageTown: data.village_town ?? "",
    district: data.district ?? "",
    state: data.state ?? "",
    country: data.country || "India",
    mobileNumber: data.mobile_number || sessionMobile,
    email: data.email || sessionEmail,
    reviewStatus:
      data.review_status === "pending" ||
      data.review_status === "approved" ||
      data.review_status === "rejected" ||
      data.review_status === "correction_requested"
        ? data.review_status
        : "not_submitted",
    reviewReason: data.review_reason ?? null,
    submittedAt: data.submitted_at ?? null,
    sportsCertificate: evidenceFromPath(data.sports_certificate_path, "sportsCertificate"),
    passportFirstPage: evidenceFromPath(data.passport_first_page_path, "passportFirstPage"),
    passportVisaStampPage: evidenceFromPath(
      data.passport_visa_stamp_page_path,
      "passportVisaStampPage",
    ),
    tournamentPhoto: evidenceFromPath(data.tournament_photo_path, "tournamentPhoto"),
  };
}

export async function saveSportsVerificationDetails(
  ownerId: string,
  details: SportsVerificationDetails,
): Promise<SportsVerificationDetails> {
  await requireMutableSportsVerification(ownerId);
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionEmail = sessionData.session?.user.email ?? "";
  const sessionMobile = sessionData.session?.user.phone ?? "";
  const payload = {
    user_id: ownerId,
    full_name: details.fullName.trim(),
    father_name: details.fatherName.trim(),
    date_of_birth: details.dateOfBirth || null,
    address: details.address.trim(),
    passport_number: details.passportNumber.trim(),
    certificate_number: details.certificateNumber.trim(),
    identity_details_confirmed: details.identityDetailsConfirmed === true,
    village_town: details.villageTown.trim(),
    district: details.district.trim(),
    state: details.state.trim(),
    country: details.country.trim() || "India",
    mobile_number: details.mobileNumber.trim(),
    email: details.email.trim(),
    sports_certificate_path: details.sportsCertificate?.path ?? null,
    passport_first_page_path: details.passportFirstPage?.path ?? null,
    passport_visa_stamp_page_path: details.passportVisaStampPage?.path ?? null,
    tournament_photo_path: details.tournamentPhoto?.path ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("sports_verification_details")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return {
    fullName: data.full_name ?? "",
    fatherName: data.father_name ?? "",
    dateOfBirth: data.date_of_birth ?? "",
    address: data.address ?? "",
    passportNumber: data.passport_number ?? "",
    certificateNumber: data.certificate_number ?? "",
    identityDetailsConfirmed: data.identity_details_confirmed === true,
    villageTown: data.village_town,
    district: data.district,
    state: data.state,
    country: data.country || "India",
    mobileNumber: data.mobile_number || sessionMobile,
    email: data.email || sessionEmail,
    reviewStatus:
      data.review_status === "pending" ||
      data.review_status === "approved" ||
      data.review_status === "rejected" ||
      data.review_status === "correction_requested"
        ? data.review_status
        : "not_submitted",
    reviewReason: data.review_reason ?? null,
    submittedAt: data.submitted_at ?? null,
    sportsCertificate: evidenceFromPath(data.sports_certificate_path, "sportsCertificate"),
    passportFirstPage: evidenceFromPath(data.passport_first_page_path, "passportFirstPage"),
    passportVisaStampPage: evidenceFromPath(
      data.passport_visa_stamp_page_path,
      "passportVisaStampPage",
    ),
    tournamentPhoto: evidenceFromPath(data.tournament_photo_path, "tournamentPhoto"),
  };
}

const verificationEvidenceRules: Record<
  SportsVerificationEvidenceKind,
  { allowedTypes: Set<string>; maxBytes: number; message: string }
> = {
  sportsCertificate: {
    allowedTypes: new Set(["application/pdf", "image/jpeg", "image/png"]),
    maxBytes: 15 * 1024 * 1024,
    message: "Upload a PDF, JPG, or PNG sports certificate up to 15 MB.",
  },
  passportFirstPage: {
    allowedTypes: new Set(["application/pdf", "image/jpeg", "image/png"]),
    maxBytes: 15 * 1024 * 1024,
    message: "Upload a PDF, JPG, or PNG passport page up to 15 MB.",
  },
  passportVisaStampPage: {
    allowedTypes: new Set(["application/pdf", "image/jpeg", "image/png"]),
    maxBytes: 15 * 1024 * 1024,
    message: "Upload a PDF, JPG, or PNG visa/stamp page up to 15 MB.",
  },
  tournamentPhoto: {
    allowedTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxBytes: 15 * 1024 * 1024,
    message: "Upload a JPG, PNG, or WebP tournament photo up to 15 MB.",
  },
};

export async function uploadSportsVerificationEvidence(
  ownerId: string,
  kind: SportsVerificationEvidenceKind,
  file: File,
): Promise<SportsVerificationEvidence> {
  await requireMutableSportsVerification(ownerId);
  const rule = verificationEvidenceRules[kind];
  if (!rule.allowedTypes.has(file.type) || file.size > rule.maxBytes) {
    throw new Error(rule.message);
  }

  const name = safeDocumentFileName(file.name);
  const path = `${ownerId}/sports-verification/${kind}/${Date.now()}-${name}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    path,
    name,
    mimeType: file.type,
    size: file.size,
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteSportsVerificationEvidence(ownerId: string, path: string) {
  await requireMutableSportsVerification(ownerId);
  if (!path.startsWith(`${ownerId}/sports-verification/`) || path.includes("..")) {
    throw new Error("Invalid Sports Verification evidence path.");
  }
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).remove([path]);
  if (error) throw new Error(error.message);
}

export async function listSportsDocuments(ownerId: string): Promise<SportsDocument[]> {
  await requireDocumentOwner(ownerId);
  const files = await listSportsDocumentFiles(ownerId);

  return files
    .filter((file) => Boolean(file.id && file.name))
    .map((file) => ({
      path: `${ownerId}/${file.name}`,
      name: file.name,
      mimeType: file.metadata?.mimetype ?? "application/octet-stream",
      size: typeof file.metadata?.size === "number" ? file.metadata.size : null,
      updatedAt: file.updated_at ?? file.created_at ?? null,
    }));
}

async function listSportsDocumentFiles(ownerId: string): Promise<StorageDocument[]> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.documents)
    .list(ownerId, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
  if (error) throw new Error(error.message);
  return (data ?? []) as StorageDocument[];
}

function safeDocumentFileName(name: string) {
  const baseName = name.split(/[\\/]/).at(-1)?.trim() || "certificate";
  return (
    baseName
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "certificate"
  );
}

export async function uploadSportsDocument(ownerId: string, file: File): Promise<SportsDocument> {
  await requireDocumentOwner(ownerId);
  const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
  if (!allowedTypes.has(file.type)) {
    throw new Error("Upload a PDF, JPG, or PNG certificate.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Certificates must be 15 MB or smaller.");
  }

  const name = safeDocumentFileName(file.name);
  const path = `${ownerId}/${Date.now()}-${name}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    path,
    name,
    mimeType: file.type,
    size: file.size,
    updatedAt: new Date().toISOString(),
  };
}

export async function createSportsDocumentSignedUrl(ownerId: string, path: string) {
  await requireDocumentOwner(ownerId);
  if (!path.startsWith(`${ownerId}/`) || path.includes("..")) {
    throw new Error("Invalid sports document path.");
  }
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.documents)
    .createSignedUrl(path, 60 * 5);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "This document is unavailable.");
  }
  return data.signedUrl;
}

export async function deleteSportsDocument(ownerId: string, path: string) {
  await requireDocumentOwner(ownerId);
  if (!path.startsWith(`${ownerId}/`) || path.includes("..")) {
    throw new Error("Invalid sports document path.");
  }
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).remove([path]);
  if (error) throw new Error(error.message);
}

function safeSportsIntroductionFileName(name: string) {
  const baseName = name.split(/[\\/]/).at(-1)?.trim() || "sports-introduction";
  return (
    baseName
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "sports-introduction"
  );
}

export async function validateSportsIntroductionVideo(file: File) {
  if (!file.type.startsWith("video/")) {
    throw new Error("Upload a video for your Sports Introduction.");
  }
  if (file.size > 100 * 1024 * 1024) {
    throw new Error("Sports Introduction videos must be 100 MB or smaller.");
  }

  const previewUrl = URL.createObjectURL(file);
  try {
    const metadata = await new Promise<{ duration: number; width: number; height: number }>(
      (resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () =>
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        video.onerror = () => reject(new Error("This video could not be read."));
        video.src = previewUrl;
      },
    );
    if (!Number.isFinite(metadata.duration) || metadata.duration <= 0) {
      throw new Error("This video duration could not be read.");
    }
    if (metadata.duration > 90) {
      throw new Error("Sports Introduction videos must be 90 seconds or shorter.");
    }
    if (metadata.width <= 0 || metadata.height <= 0 || metadata.height <= metadata.width) {
      throw new Error("Sports Introduction videos must be vertical.");
    }
  } finally {
    URL.revokeObjectURL(previewUrl);
  }
}

export async function uploadSportsIntroduction(
  ownerId: string,
  file: File,
  onProgress?: ProgressFn,
) {
  await requireMutableSportsVerification(ownerId);
  await validateSportsIntroductionVideo(file);
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const path = `${ownerId}/sports-introduction/${Date.now()}-${safeSportsIntroductionFileName(
    file.name.replace(/\.[^.]+$/, ""),
  )}.${extension}`;
  const result = await uploadWithProgress(
    STORAGE_BUCKETS.videos,
    path,
    file,
    file.type,
    onProgress,
    "86400",
  );
  if (result.error) throw new Error(result.error);
  return path;
}

export async function deleteSportsIntroduction(ownerId: string, path: string) {
  await requireMutableSportsVerification(ownerId);
  if (!path.startsWith(`${ownerId}/sports-introduction/`) || path.includes("..")) {
    throw new Error("Invalid Sports Introduction path.");
  }
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.videos).remove([path]);
  if (error) throw new Error(error.message);
}

/** Real signed-in profile: row from the database plus the user's own media. */
export function useMyProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MyProfile>(empty);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const loadInFlight = useRef<Promise<void> | null>(null);
  const pendingForce = useRef(false);
  const loadRef = useRef<(force?: boolean) => Promise<void>>(() => Promise.resolve());
  const loadedUserId = useRef<string | null>(null);
  const loadGeneration = useRef(0);

  const load = useCallback(async (force = false) => {
    if (force) pendingForce.current = true;
    if (loadInFlight.current) return loadInFlight.current;
    const forceThisRequest = pendingForce.current;
    pendingForce.current = false;
    const generation = ++loadGeneration.current;

    const request = (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id ?? null;
      if (generation !== loadGeneration.current) return;
      if (!forceThisRequest && loadedUserId.current !== null && uid === loadedUserId.current) return;

      setLoading(true);
      setUserId(uid);
      if (!uid) {
        loadedUserId.current = null;
        setProfile(empty);
        setAvatarSrc(null);
        setCoverSrc(null);
        setPosts([]);
        setMediaLoading(false);
        setLoading(false);
        return;
      }

      // The profile row is the critical path. Posts and media
      // URLs are independent secondary data and must not delay the shell.
      const { data: row } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (generation !== loadGeneration.current) return;

      const email = sessionData.session?.user.email ?? "";
      const next: MyProfile = {
        id: uid,
        username: row?.username ?? email.split("@")[0] ?? `user${uid.slice(0, 4)}`,
        display_name: row?.display_name ?? row?.username ?? "YourWorld user",
        bio: row?.bio ?? "",
        category: row?.category ?? "",
        normal_categories: resolveNormalProfileCategories(row?.normal_categories, row?.category ?? ""),
        location: row?.location ?? "",
        website: row?.website ?? "",
        avatar_url: row?.avatar_url ?? null,
        cover_url: row?.cover_url ?? null,
        is_verified: row?.is_verified === true,
        verification_requested: row?.verification_requested === true,
      };

      loadedUserId.current = uid;
      setProfile(next);
      setLoading(false);
      setMediaLoading(true);

      void Promise.all([signedIfNeeded(next.avatar_url), signedIfNeeded(next.cover_url)]).then(
        ([nextAvatarSrc, nextCoverSrc]) => {
          if (generation !== loadGeneration.current) return;
          setAvatarSrc(nextAvatarSrc);
          setCoverSrc(nextCoverSrc);
        },
      );

      const loadSecondary = async () => {
        try {
          const { data: myPosts } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(12);
          if (generation !== loadGeneration.current) return;

          setPosts((myPosts ?? []).map(normalizePostRow) as DbPost[]);
        } finally {
          if (generation === loadGeneration.current) setMediaLoading(false);
        }
      };

      void loadSecondary();
    })();

    loadInFlight.current = request;
    try {
      await request;
    } finally {
      if (loadInFlight.current === request) loadInFlight.current = null;
      if (loadInFlight.current === null && pendingForce.current) {
        void loadRef.current(true);
      }
    }
  }, []);
  loadRef.current = load;

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadGeneration.current += 1;
        loadInFlight.current = null;
        loadedUserId.current = null;
        setUserId(null);
        setProfile(empty);
        setAvatarSrc(null);
        setCoverSrc(null);
        setPosts([]);
        setLoading(true);
        setMediaLoading(false);
        void load();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const uploadImage = useCallback(
    async (file: File, kind: "avatar" | "cover", uid: string) => {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${uid}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
      if (error) {
        console.error("Profile image upload failed", error);
        throw new Error(error.message);
      }
      return path;
    },
    [],
  );

  const save = useCallback(
    async (edit: MyProfileEdit) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) throw new Error("Sign in to update your profile");

      let avatarPath = profile.avatar_url;
      let coverPath = profile.cover_url;
      if (edit.avatarFile) avatarPath = await uploadImage(edit.avatarFile, "avatar", uid);
      if (edit.coverFile) coverPath = await uploadImage(edit.coverFile, "cover", uid);

      const { error } = await writeCompat(
        (payload) => supabase.from("profiles").upsert(payload as never, { onConflict: "id" }),
        {
          id: uid,
          username: edit.username || null,
          display_name: edit.name || null,
          bio: edit.bio || null,
           category: isSportsIdentityCategory(edit.category) ? edit.category.trim() || null : null,
           normal_categories: normalizeNormalProfileCategories(edit.normalCategories),
          location: edit.location || null,
          website: edit.website || null,
          avatar_url: avatarPath,
          cover_url: coverPath,
          is_verified: edit.isVerified ?? profile.is_verified,
          verification_requested: edit.verificationRequested ?? profile.verification_requested,
        },
      );
      if (error) {
        console.error("Profile update failed", error);
        throw new Error(error.message);
      }
      await load(true);
    },
    [profile.avatar_url, profile.cover_url, profile.is_verified, profile.verification_requested, uploadImage, load],
  );

  const visiblePosts = useMemo(() => posts.filter((p) => p.archived !== true), [posts]);
  const grid = useMemo(
    () =>
      visiblePosts.filter(
        (p) =>
          p.kind === "video" ||
          (p.kind !== "reel" && p.media_type?.startsWith("video")),
      ),
    [visiblePosts],
  );
  const reels = useMemo(() => visiblePosts.filter((p) => p.kind === "reel"), [visiblePosts]);
  const archived = useMemo(() => posts.filter((p) => p.archived === true), [posts]);

  return {
    userId,
    profile,
    avatarSrc,
    coverSrc,
    posts: visiblePosts,
    grid,
    reels,
    archived,
    loading,
    mediaLoading,
    save,
    reload: () => load(true),
    removePost: (postId: string) =>
      setPosts((current) => current.filter((post) => post.id !== postId)),
    patchPost: (next: DbPost) =>
      setPosts((current) => current.map((post) => (post.id === next.id ? { ...post, ...next } : post))),
  };
}

/** Update a post/reel you own (caption, hashtags, location, download flag). */
export async function updateMyPost(
  postId: string,
  patch: {
    title?: string;
    caption?: string;
    location?: string | null;
    allow_download?: boolean;
    hide_like_count?: boolean;
    hide_share_count?: boolean;
    comments_off?: boolean;
    pinned?: boolean;
    archived?: boolean;
    mentions?: string[];
    category?: string | null;
    sports_tag?: string | null;
    thumbnail_url?: string | null;
  },
) {
  const next: {
    title?: string;
    caption?: string;
    hashtags?: string[];
    location?: string | null;
    allow_download?: boolean;
    hide_like_count?: boolean;
    hide_share_count?: boolean;
    comments_off?: boolean;
    pinned?: boolean;
    archived?: boolean;
    mentions?: string[];
    category?: string | null;
    sports_tag?: string | null;
    thumbnail_url?: string | null;
  } = {};

  if (patch.title !== undefined) next.title = patch.title.trim();
  if (patch.caption !== undefined) {
    next.caption = patch.caption;
    next.hashtags = Array.from(
      new Set((patch.caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.slice(1))),
    );
  }
  if (patch.location !== undefined) next.location = patch.location;
  if (patch.allow_download !== undefined) next.allow_download = patch.allow_download;
  if (patch.hide_like_count !== undefined) next.hide_like_count = patch.hide_like_count;
  if (patch.hide_share_count !== undefined) next.hide_share_count = patch.hide_share_count;
  if (patch.comments_off !== undefined) next.comments_off = patch.comments_off;
  if (patch.pinned !== undefined) next.pinned = patch.pinned;
  if (patch.archived !== undefined) next.archived = patch.archived;
  if (patch.mentions !== undefined) next.mentions = patch.mentions;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.sports_tag !== undefined) next.sports_tag = patch.sports_tag;
  if (patch.thumbnail_url !== undefined) next.thumbnail_url = patch.thumbnail_url;

  const result = await writeCompat(
    (payload) =>
      supabase
        .from("posts")
        .update(payload as never)
        .eq("id", postId),
    next,
  );
  if (result.error) {
    console.error("Post update failed", result.error);
    throw new Error(result.error.message);
  }
}

export async function countPinnedPosts(userId: string) {
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("pinned", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function uploadPostThumbnail(
  userId: string,
  source: Blob,
  onProgress?: ProgressFn,
) {
  const extension = source.type.includes("png")
    ? "png"
    : source.type.includes("jpeg") || source.type.includes("jpg")
      ? "jpg"
      : "webp";
  const path = `${userId}/post-thumbnails/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;
  const result = await uploadWithProgress(
    STORAGE_BUCKETS.videos,
    path,
    source,
    source.type || "image/webp",
    onProgress,
    "31536000, immutable",
  );
  if (result.error || !result.url) throw new Error(result.error ?? "Could not upload the thumbnail.");
  return { path, url: result.url };
}


/** Permanently delete a post/reel you own, plus its stored media files. */
export async function deleteMyPost(post: {
  id: string;
  user_id: string;
  media_url: string;
  thumbnail_url?: string | null;
  kind: string;
}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const sessionUserId = userData.user?.id;
  if (!sessionUserId || sessionUserId !== post.user_id) {
    throw new Error("You can only delete your own media");
  }

  const { data: deletedRows, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", post.id)
    .eq("user_id", sessionUserId)
    .select("id");
  if (error) {
    console.error("Post deletion failed", error);
    throw new Error(error.message);
  }
  if (!deletedRows?.length) {
    throw new Error("This media is no longer available or you do not own it");
  }

  const mediaBucket =
    post.kind === "reel" ? STORAGE_BUCKETS.reels : STORAGE_BUCKETS.videos;
  const references: Array<{ reference: string | null | undefined; bucket: string }> = [
    { reference: post.media_url, bucket: mediaBucket },
    { reference: post.thumbnail_url, bucket: STORAGE_BUCKETS.videos },
  ];
  const removed = new Set<string>();
  for (const { reference, bucket } of references) {
    if (!reference || /^(blob:|data:)/.test(reference)) continue;
    const path = /^https?:/.test(reference)
      ? reference.match(new RegExp(`/storage/v1/object/(?:sign|public)/${bucket}/([^?]+)`))?.[1]
      : reference.replace(/^\/+/, "");
    if (!path) continue;
    const key = `${bucket}:${path}`;
    if (removed.has(key)) continue;
    removed.add(key);
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([decodeURIComponent(path)]);
    if (storageError) {
      console.error(`Failed to remove media from ${bucket}`, storageError);
    }
  }
}

/** Resolves a stored media reference to something an <img> can render. */

export function useResolvedMedia(urls: string[], bucket = "reels") {
  const [map, setMap] = useState<Record<string, string>>({});
  const key = urls.join("|");

  useEffect(() => {
    let alive = true;
    void Promise.all(
      urls.map(async (u) => [u, await resolveMediaUrl(u, bucket)] as const),
    ).then((pairs) => {
      if (alive) setMap(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bucket]);

  return map;
}
