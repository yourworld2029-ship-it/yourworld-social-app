import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Check, Link2, LoaderCircle, Search, Send, Share2, Sparkles, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ProfileAvatar } from "@/components/yw/ProfileAvatar";
import { useAuth } from "@/lib/auth-store";
import { useNavigate } from "@tanstack/react-router";
import { dmThreadId, useThreadMessages } from "@/lib/social-data";
import { supabase } from "@/integrations/supabase/client";
import { useMoments } from "@/lib/moment-context";
import { useFollowList } from "@/lib/follow-data";
import { hiddenThreadIds, loadHiddenDirectThreads } from "@/lib/chat-delete";
import { buildPublicAppUrl } from "@/lib/public-app-url";
import { sharePublicContent } from "@/lib/share-public";
import { writePendingMomentShare, type SharedMomentKind, type SharedMomentBucket } from "@/lib/moment-share";

interface ShareSheetProps {
  /** Caption or title of the shared item. */
  title?: string;
  /** Optional controlled visibility for external share buttons. */
  open?: boolean;
  /** Called when a controlled share sheet is opened or dismissed. */
  onOpenChange?: (open: boolean) => void;
  /** Absolute or relative link to the item. */
  url?: string;
  /** Media source used by the existing Add to Moment action. */
  media?: string;
  mediaKind?: "photo" | "video";
  /** Content identity for an interactive Reel or video card in chat. */
  contentId?: string;
  contentKind?: "video" | "reel";
  /** Enables the editor-based Watch-full Moment share for public content. */
  momentShare?: {
    kind: SharedMomentKind;
    creatorName: string;
    creatorUsername: string;
    mediaBucket: SharedMomentBucket;
    thumbnailUrl?: string | null;
  };
  /** Stored thumbnail reference; the thread resolves it when rendering the card. */
  thumbnailUrl?: string | null;
  thumbnailBucket?: "reels" | "videos" | "thumbnails";
  children?: React.ReactNode;
}

type SharePerson = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_pic?: string | null;
  profile_image?: string | null;
};

type ShareDeliveryControllerProps = {
  threadId: string;
  contentId?: string;
  contentKind?: "video" | "reel";
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  thumbnailBucket: "reels" | "videos" | "thumbnails";
  onComplete: (error: string | null) => void;
};

async function loadRecentSharePeople(userId: string): Promise<SharePerson[]> {
  let hiddenIds = new Set(hiddenThreadIds());
  try {
    hiddenIds = new Set(await loadHiddenDirectThreads(userId));
  } catch {
    // Keep the device cache of hidden chats if the durable preference read fails.
  }

  const { data, error } = await supabase
    .from("messages" as never)
    .select("sender_id,receiver_id,created_at" as never)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const peerIds: string[] = [];
  const seen = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<
    Record<string, unknown>
  >) {
    if (typeof row.sender_id !== "string" || typeof row.receiver_id !== "string") continue;
    const peerId = row.sender_id === userId ? row.receiver_id : row.sender_id;
    if (!peerId || peerId === userId || seen.has(peerId)) continue;
    if (hiddenIds.has(dmThreadId(userId, peerId))) continue;
    seen.add(peerId);
    peerIds.push(peerId);
    if (peerIds.length >= 30) break;
  }
  if (!peerIds.length) return [];

  const { data: profiles, error: profileError } = await supabase.rpc(
    "get_public_profiles",
    { ids: peerIds },
  );
  if (profileError) throw profileError;

  const profilesById = new Map(
    ((profiles ?? []) as Array<{
      id: string;
      username?: string | null;
      display_name?: string | null;
      avatar_url?: string | null;
      profile_pic?: string | null;
      profile_image?: string | null;
    }>).map((profile) => [profile.id, profile]),
  );
  return peerIds.flatMap((id) => {
    const profile = profilesById.get(id);
    return profile
      ? [{
          id,
          username: profile.username ?? null,
          display_name: profile.display_name ?? profile.username ?? null,
          avatar_url: profile.avatar_url ?? null,
          profile_pic: profile.profile_pic ?? null,
          profile_image: profile.profile_image ?? null,
        }]
      : [];
  });
}

const glyph = (path: string) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[21px] w-[21px]" aria-hidden="true">
    <path d={path} />
  </svg>
);

const WHATSAPP =
  "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.18 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z";
const INSTAGRAM =
  "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9a3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38a3.7 3.7 0 0 1 1.38-.9c.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.02a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z";
const SNAPCHAT =
  "M12.02 2c2.6.02 4.62 1.9 4.76 4.5.05.9-.02 1.8.02 2.34.36.12.86-.2 1.32-.2.5 0 1.06.28 1.06.82 0 .6-.86.86-1.4 1.06-.4.15-.72.28-.72.6 0 .5 1.5 2.9 3.63 3.42.3.08.44.28.4.56-.08.53-1.2.86-2.03 1.01-.28.05-.36.2-.42.5-.06.28-.13.66-.42.66-.42 0-.96-.2-1.86-.05-.9.16-1.72 1.36-3.36 1.36s-2.42-1.2-3.34-1.36c-.9-.15-1.44.05-1.86.05-.3 0-.36-.38-.42-.66-.06-.3-.14-.45-.42-.5-.83-.15-1.95-.48-2.03-1.01-.04-.28.1-.48.4-.56 2.13-.52 3.63-2.92 3.63-3.42 0-.32-.32-.45-.72-.6-.54-.2-1.4-.46-1.4-1.06 0-.54.56-.82 1.06-.82.46 0 .96.32 1.32.2.04-.54-.03-1.44.02-2.34C7.4 3.9 9.42 2.02 12.02 2Z";

const SOCIAL_ACTIONS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    className:
      "bg-gradient-to-br from-[#49eb83] to-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.25)]",
    icon: glyph(WHATSAPP),
  },
  {
    id: "instagram",
    label: "Instagram",
    className:
      "bg-gradient-to-br from-[#6536d8] via-[#e1306c] to-[#ff9c32] text-white shadow-[0_8px_24px_rgba(225,48,108,0.24)]",
    icon: glyph(INSTAGRAM),
  },
  {
    id: "snapchat",
    label: "Snapchat",
    className: "bg-[#FFFC00] text-black shadow-[0_8px_24px_rgba(255,252,0,0.12)]",
    icon: glyph(SNAPCHAT),
  },
  {
    id: "share",
    label: "Share",
    className:
      "border border-white/10 bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl",
    icon: <Share2 className="h-[21px] w-[21px]" strokeWidth={1.8} />,
  },
  {
    id: "copy",
    label: "Copy link",
    className:
      "border border-white/10 bg-white/[0.07] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl",
    icon: <Link2 className="h-[21px] w-[21px]" strokeWidth={1.8} />,
  },
] as const;

function ShareDeliveryController({
  threadId,
  contentId,
  contentKind,
  title,
  url,
  thumbnailUrl,
  thumbnailBucket,
  onComplete,
}: ShareDeliveryControllerProps) {
  const { conversationId, currentUserId, loading, error, send } = useThreadMessages(threadId);
  const attempted = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const payload = useMemo(() => {
    if (contentId && contentKind) {
      const sharedMedia = {
        id: contentId,
        kind: contentKind,
        title: title.trim() || (contentKind === "reel" ? "YourWorld Reel" : "YourWorld video"),
        thumbnail_url: thumbnailUrl ?? null,
        thumbnail_bucket: thumbnailBucket,
      };
      return {
        content: `Shared a ${contentKind === "reel" ? "reel" : "video"}: ${sharedMedia.title}`,
        metadata: { shared_media: sharedMedia },
      };
    }
    return { content: title ? `${title} — ${url}` : url };
  }, [contentId, contentKind, thumbnailBucket, thumbnailUrl, title, url]);

  useEffect(() => {
    if (attempted.current) return;
    if (!conversationId && !loading && error) {
      attempted.current = true;
      onCompleteRef.current(error);
      return;
    }
    if (!conversationId || loading) return;
    if (!currentUserId) {
      attempted.current = true;
      onCompleteRef.current("Sign in to send this in a chat.");
      return;
    }

    attempted.current = true;
    void send(payload)
      .then((result) => onCompleteRef.current(result.error ?? null))
      .catch((cause: unknown) =>
        onCompleteRef.current(
          cause instanceof Error ? cause.message : "Could not send this item.",
        ),
      );
  }, [conversationId, currentUserId, error, loading, payload, send]);

  return null;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  title = "",
  open: controlledOpen,
  onOpenChange,
  url,
  media,
  mediaKind = "photo",
  contentId,
  contentKind,
  momentShare,
  thumbnailUrl,
  thumbnailBucket = "thumbnails",
  children,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const [search, setSearch] = useState("");
  const [searchPeople, setSearchPeople] = useState<SharePerson[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentPeople, setRecentPeople] = useState<SharePerson[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [defaultLoaded, setDefaultLoaded] = useState(false);
  const [delivery, setDelivery] = useState<{ person: SharePerson; threadId: string } | null>(null);
  const [deliveryQueue, setDeliveryQueue] = useState<SharePerson[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<
    Record<string, "sending" | "sent">
  >({});
  const [selectedPeople, setSelectedPeople] = useState<SharePerson[]>([]);
  const [momentSelected, setMomentSelected] = useState(false);
  const deliverySequence = useRef(0);
  const pendingMomentAfterDelivery = useRef(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addMoment } = useMoments();
  const hasSearchTerm = Boolean(search.trim().replace(/^@+/, ""));
  const {
    users: followedUsers,
    loading: followingLoading,
    error: followingError,
  } = useFollowList(user?.id ?? null, "following", open && !hasSearchTerm);

  const currentPath =
    typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const link = buildPublicAppUrl(url ?? currentPath);
  const followPeople = useMemo(
    () =>
      followedUsers.map((person) => ({
        id: person.id,
        username: person.username || null,
        display_name: person.display_name || null,
        avatar_url: person.avatar_url,
      })),
    [followedUsers],
  );
  const people = useMemo(() => {
    if (hasSearchTerm) return searchPeople;
    const unique = new Map<string, SharePerson>();
    for (const person of [...recentPeople, ...followPeople]) {
      if (!unique.has(person.id)) unique.set(person.id, person);
    }
    return Array.from(unique.values()).slice(0, 30);
  }, [followPeople, hasSearchTerm, recentPeople, searchPeople]);
  const peopleLoading = hasSearchTerm
    ? searchLoading
    : !defaultLoaded || recentLoading || followingLoading;
  const peopleError = hasSearchTerm
    ? searchError
    : recentError || followingError;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const term = search.trim().replace(/^@+/, "");
    if (!term) {
      setSearchPeople([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    const timer = window.setTimeout(async () => {
      try {
        if (!user?.id) {
          setSearchPeople([]);
          return;
        }
        const { data, error } = await supabase.rpc("search_profiles", { search: term });
        if (!alive) return;
        if (error) throw error;
        const results = ((data ?? []) as SharePerson[])
          .filter((person) => person.id && person.id !== user.id)
          .slice(0, 30);
        setSearchPeople(results);
      } catch (cause) {
        if (!alive) return;
        setSearchPeople([]);
        setSearchError(cause instanceof Error ? cause.message : "Couldn't search people.");
      } finally {
        if (alive) setSearchLoading(false);
      }
    }, 220);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [open, search, user?.id]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    if (!user?.id) {
      setRecentPeople([]);
      setRecentError(null);
      setRecentLoading(false);
      return;
    }
    setRecentLoading(true);
    setRecentError(null);
    void loadRecentSharePeople(user.id)
      .then((results) => {
        if (alive) setRecentPeople(results);
      })
      .catch((cause: unknown) => {
        if (!alive) return;
        setRecentPeople([]);
        setRecentError(
          cause instanceof Error ? cause.message : "Couldn't load recent chats.",
        );
      })
      .finally(() => {
        if (alive) setRecentLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) {
      setDefaultLoaded(false);
      return;
    }
    if (!hasSearchTerm && !recentLoading && !followingLoading) {
      setDefaultLoaded(true);
    }
  }, [followingLoading, hasSearchTerm, open, recentLoading]);

  useEffect(() => {
    if (open) return;
    setSearch("");
    setSearchPeople([]);
    setSearchError(null);
    setRecentPeople([]);
    setRecentError(null);
    setRecentLoading(false);
    setSelectedPeople([]);
    setMomentSelected(false);
    if (!delivery) {
      setDeliveryQueue([]);
      setDeliveryStatus({});
    }
  }, [delivery, open]);

  const copyText = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    if (!copied) throw new Error("Clipboard access is unavailable.");
  };

  const copy = async () => {
    try {
      await copyText(link);
      toast.success("Link copied");
      setOpen(false);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const nativeShare = async () => {
    try {
      const result = await sharePublicContent({
        title: title || "YourWorld",
        text: title || "Shared from YourWorld",
        url: link,
        dialogTitle: "Share with",
      });
      if (result === "copied") toast.success("Link copied");
    } catch {
      toast.error("Could not share link");
    }
    setOpen(false);
  };

  const toMoment = () => {
    if (!media) {
      toast.error("Nothing to add");
      return;
    }
    if (contentId && contentKind) {
      if (!momentShare || !user?.id) {
        toast.error(
          user?.id
            ? "This video cannot be shared to a Moment."
            : "Sign in to share a video to your Moment.",
        );
        return;
      }
      try {
        writePendingMomentShare({
          kind: momentShare.kind,
          id: contentId,
          title: title || (momentShare.kind === "reel" ? "Reel" : "Video"),
          creatorName: momentShare.creatorName,
          creatorUsername: momentShare.creatorUsername,
          mediaUrl: media,
          mediaBucket: momentShare.mediaBucket,
          thumbnailUrl: momentShare.thumbnailUrl ?? thumbnailUrl ?? null,
        });
        setOpen(false);
        void navigate({ to: "/moment/create" });
      } catch (error) {
        console.error("Could not open Moment editor for shared video", error);
        toast.error("Could not open the Moment editor.");
      }
      return;
    }
    void addMoment({
      kind: mediaKind === "video" ? "video" : "photo",
      media,
      text: title,
      textBg: "",
      stickers: [],
      mentions: [],
      privacy: "everyone",
      duration: 24,
      effect: "none",
      ai: {},
      allowDownload: true,
      screenshotAlert: false,
      poll: null,
    }).then(({ error }) => {
      if (error) toast.error(error);
      else toast.success("Added to your Moment");
    });
    setOpen(false);
  };

  const togglePersonSelection = (person: SharePerson) => {
    if (!user?.id) {
      toast.error("Sign in to send this in a chat.");
      return;
    }
    if (delivery || deliveryQueue.length) return;
    setSelectedPeople((current) =>
      current.some((selected) => selected.id === person.id)
        ? current.filter((selected) => selected.id !== person.id)
        : [...current, person],
    );
  };

  const confirmSelection = () => {
    const recipients = [...selectedPeople];
    const includeMoment = momentSelected;
    if (!recipients.length && !includeMoment) return;
    if (!user?.id) {
      toast.error("Sign in to send this in a chat.");
      return;
    }

    setOpen(false);
    setSelectedPeople([]);
    setMomentSelected(false);

    if (recipients.length) {
      pendingMomentAfterDelivery.current = includeMoment;
      setDeliveryQueue(recipients.slice(1));
      setDeliveryStatus(
        Object.fromEntries(recipients.map((person) => [person.id, "sending"])),
      );
      deliverySequence.current += 1;
      setDelivery({
        person: recipients[0],
        threadId: dmThreadId(user.id, recipients[0].id),
      });
      return;
    }

    pendingMomentAfterDelivery.current = false;
    toast.success("Opening Moment editor");
    toMoment();
  };

  const completeDelivery = (error: string | null) => {
    if (!delivery) return;
    const recipientId = delivery.person.id;
    if (error) {
      setDeliveryStatus((current) => {
        const next = { ...current };
        delete next[recipientId];
        return next;
      });
      toast.error(error);
    } else {
      setDeliveryStatus((current) => ({ ...current, [recipientId]: "sent" }));
      toast.success(
        `Sent to @${delivery.person.username || delivery.person.display_name || "user"}`,
      );
    }

    const nextPerson = deliveryQueue[0];
    if (nextPerson && user?.id) {
      setDeliveryQueue((current) => current.slice(1));
      deliverySequence.current += 1;
      setDelivery({
        person: nextPerson,
        threadId: dmThreadId(user.id, nextPerson.id),
      });
      return;
    }

    setDelivery(null);
    setDeliveryQueue([]);
    if (pendingMomentAfterDelivery.current) {
      pendingMomentAfterDelivery.current = false;
      toast.success("Opening Moment editor");
      toMoment();
    }
  };

  return (
    <>
      <span
        onClick={() => {
          if (delivery || deliveryQueue.length) {
            toast.info("Your share is still being sent.");
            return;
          }
          setDefaultLoaded(false);
          setRecentLoading(true);
          setSelectedPeople([]);
          setMomentSelected(false);
          setDeliveryStatus({});
          setOpen(true);
        }}
        className="contents"
      >
        {children}
      </span>

      {open && typeof document !== "undefined"
        ? createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <button
            type="button"
            aria-label="Close share"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-sheet-title"
            data-testid="share-sheet"
            onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
            className="relative max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#08090d]/95 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-white shadow-[0_-20px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />

            <div className="flex items-center justify-between px-5 pb-3 pt-3.5">
              <div className="min-w-0">
                <h3 id="share-sheet-title" className="text-base font-bold tracking-tight">
                  Share
                </h3>
                <p className="mt-0.5 truncate text-xs text-white/45">
                  {title || "Send this to someone"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/75 transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4">
              <label className="flex h-11 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors focus-within:border-fuchsia-300/45 focus-within:bg-white/[0.07]">
                <Search className="h-4 w-4 shrink-0 text-white/40" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search people"
                  placeholder="Search people"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
            </div>

            <div className="mt-4 px-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white/80">Send to</h4>
                {peopleLoading ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-white/40" />
                ) : null}
              </div>

              {!user?.id ? (
                <p className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-5 text-center text-xs text-white/45">
                  Sign in to send videos and Reels in a chat.
                </p>
              ) : peopleError && people.length === 0 ? (
                <p
                  role="status"
                  className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-5 text-center text-xs text-rose-200/80"
                >
                  {peopleError}
                </p>
              ) : peopleLoading && people.length === 0 ? (
                <div className="grid grid-cols-5 gap-x-1 gap-y-4 py-2" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <span className="h-12 w-12 animate-pulse rounded-full bg-white/[0.07]" />
                      <span className="h-2.5 w-12 animate-pulse rounded bg-white/[0.06]" />
                    </div>
                  ))}
                </div>
              ) : people.length ? (
                <>
                {peopleError ? (
                  <p role="status" className="mb-2 text-center text-[10px] text-amber-100/70">
                    Some people couldn’t be loaded. Search still works.
                  </p>
                ) : null}
                <div className="grid max-h-56 grid-cols-5 gap-x-1 gap-y-4 overflow-y-auto overscroll-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {people.map((person) => {
                    const status = deliveryStatus[person.id];
                    const selected = selectedPeople.some(
                      (selectedPerson) => selectedPerson.id === person.id,
                    );
                    const handle = person.username
                      ? `@${person.username.replace(/^@/, "")}`
                      : person.display_name || "YourWorld user";
                    return (
                      <button
                        key={person.id}
                        type="button"
                        data-testid={`share-recipient-${person.id}`}
                        aria-label={`${selected ? "Deselect" : "Select"} ${handle}`}
                        aria-pressed={selected}
                        disabled={Boolean(delivery) || deliveryQueue.length > 0 || status === "sent"}
                        onClick={() => togglePersonSelection(person)}
                        className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-0.5 py-1 transition-colors hover:bg-white/[0.035] disabled:cursor-default"
                      >
                        <span className="relative block">
                          <Avatar
                             className={`h-12 w-12 border border-white/10 bg-gradient-to-br from-violet-500/70 to-fuchsia-500/70 ring-2 ring-offset-2 ring-offset-[#08090d] transition-all group-hover:ring-fuchsia-300/50 ${
                                selected || status ? "ring-fuchsia-300/75" : "ring-transparent"
                            }`}
                          >
                            <ProfileAvatar
                              user={{
                                username: person.username,
                                full_name: person.display_name,
                                avatar_url: person.avatar_url,
                                profile_pic: person.profile_pic,
                                profile_image: person.profile_image,
                              }}
                            />
                          </Avatar>
                          {selected || status ? (
                            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#08090d] bg-fuchsia-300 text-[#140b18] shadow-lg">
                              {status === "sending" ? (
                                <LoaderCircle className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" strokeWidth={3} />
                              )}
                            </span>
                          ) : null}
                        </span>
                        <span
                          title={handle}
                          className="w-full truncate text-center text-[10px] font-medium leading-tight text-white/70"
                        >
                          {handle}
                        </span>
                      </button>
                    );
                  })}
                </div>
                </>
              ) : (
                <p className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-5 text-center text-xs text-white/45">
                  {hasSearchTerm
                    ? "No people found. Try another name or username."
                    : "No recent chats or followed people yet. Search by name or username."}
                </p>
              )}
            </div>

            {media && (!contentId || !contentKind || momentShare) ? (
              <div className="mx-4 mt-4">
                <button
                  type="button"
                  data-testid="share-to-moment-option"
                  aria-pressed={momentShare ? momentSelected : undefined}
                  onClick={() =>
                    momentShare
                      ? setMomentSelected((selected) => !selected)
                      : toMoment()
                  }
                  className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-2.5 text-left transition-colors active:scale-[0.99] ${
                    momentShare && momentSelected
                      ? "border-fuchsia-300/70 bg-fuchsia-400/10"
                      : "border-white/[0.08] bg-white/[0.035] hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-orange-400/20 to-pink-500/20 text-pink-200">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold text-white/90">
                        {momentShare ? "Share to Moment" : "Add to Moment"}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-white/40">
                        {momentShare
                          ? "Preview it with a link to the full video"
                          : "Share it with your audience"}
                      </span>
                    </span>
                  </span>
                  {momentShare && momentSelected ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-fuchsia-300 text-[#140b18]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="text-lg leading-none text-white/35">›</span>
                  )}
                </button>
              </div>
            ) : null}

            <div className="mt-4 border-t border-white/[0.07] px-2 pt-3">
              <div className="grid grid-cols-5 gap-1">
                {SOCIAL_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`share-action-${action.id}`}
                    onClick={() => {
                      if (action.id === "copy") void copy();
                      else void nativeShare();
                    }}
                    className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-1 transition-transform active:scale-95"
                  >
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-full ${action.className}`}
                    >
                      {action.icon}
                    </span>
                    <span className="w-full truncate text-center text-[9px] font-medium leading-tight text-white/65 min-[360px]:text-[10px]">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedPeople.length || momentSelected ? (
              <div className="sticky bottom-0 z-20 mt-3 border-t border-white/[0.08] bg-[#08090d]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
                <button
                  type="button"
                  data-testid="share-confirm-send"
                  aria-label={`Send to ${selectedPeople.length} people${momentSelected ? " and share to Moment" : ""}`}
                  onClick={confirmSelection}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-sm font-bold text-white shadow-lg shadow-fuchsia-950/35 transition active:scale-[0.99]"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                  <span className="rounded-full bg-black/15 px-2 py-0.5 text-[11px] font-semibold">
                    {selectedPeople.length + (momentSelected ? 1 : 0)}
                  </span>
                </button>
              </div>
            ) : null}
          </section>
        </div>,
          document.body,
        )
        : null}

      {delivery && user?.id ? (
        <ShareDeliveryController
          key={`${delivery.threadId}-${deliverySequence.current}`}
          threadId={delivery.threadId}
          contentId={contentId}
          contentKind={contentKind}
          title={title}
          url={link}
          thumbnailUrl={thumbnailUrl}
          thumbnailBucket={thumbnailBucket}
          onComplete={completeDelivery}
        />
      ) : null}
    </>
  );
};

export default ShareSheet;