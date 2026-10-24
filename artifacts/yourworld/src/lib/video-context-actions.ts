import { supabase } from "@/integrations/supabase/client";

export const VIDEO_FEED_SUPPRESSION_EVENT = "yw:video-feed-suppression";

export type VideoFeedSuppressionDetail = {
  postId?: string;
  creatorId?: string;
  restoredPostId?: string;
  restoredCreatorId?: string;
};

export function announceVideoPostSuppressed(postId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<VideoFeedSuppressionDetail>(VIDEO_FEED_SUPPRESSION_EVENT, {
      detail: { postId },
    }),
  );
}

export function announceVideoCreatorMuted(creatorId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<VideoFeedSuppressionDetail>(VIDEO_FEED_SUPPRESSION_EVENT, {
      detail: { creatorId },
    }),
  );
}

export function announceVideoPostRestored(postId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<VideoFeedSuppressionDetail>(VIDEO_FEED_SUPPRESSION_EVENT, {
      detail: { restoredPostId: postId },
    }),
  );
}

export function announceVideoCreatorRestored(creatorId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<VideoFeedSuppressionDetail>(VIDEO_FEED_SUPPRESSION_EVENT, {
      detail: { restoredCreatorId: creatorId },
    }),
  );
}

export async function copyShareLink(url: string) {
  if (!url) throw new Error("This video link is unavailable");
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return;
    } catch {
      // Capacitor WebViews may deny Clipboard API access; try the legacy path.
    }
  }

  const input = document.createElement("textarea");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Could not copy link");
}

export async function getPostFavoriteState(userId: string, postId: string) {
  const { data, error } = await supabase
    .from("post_saves")
    .select("post_id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function togglePostFavorite(
  userId: string,
  postId: string,
  isFavorite: boolean,
) {
  const result = isFavorite
    ? await supabase.from("post_saves").delete().eq("user_id", userId).eq("post_id", postId)
    : await supabase.from("post_saves").upsert(
        { user_id: userId, post_id: postId },
        { onConflict: "post_id,user_id", ignoreDuplicates: true },
      );
  if (result.error) throw result.error;
  return !isFavorite;
}

export async function markPostNotInterested(userId: string, postId: string) {
  const { error } = await supabase.from("user_post_preferences").upsert(
    { user_id: userId, post_id: postId, preference: "not_interested" },
    { onConflict: "user_id,post_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function removePostNotInterested(userId: string, postId: string) {
  const { error } = await supabase
    .from("user_post_preferences")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);
  if (error) throw error;
}

export async function muteVideoCreator(userId: string, creatorId: string) {
  if (userId === creatorId) throw new Error("You can't mute yourself");
  const { error } = await supabase.from("user_muted_creators").upsert(
    { user_id: userId, creator_id: creatorId },
    { onConflict: "user_id,creator_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function submitVideoReport(input: {
  reporterId: string;
  creatorId: string;
  postId: string;
  contentType: "video" | "reel";
  reason: string;
  description?: string;
}) {
  const values = {
    reporter_id: input.reporterId,
    reported_user_id: input.creatorId,
    reported_post_id: input.postId,
    reported_content_id: input.postId,
    content_type: input.contentType,
    description: input.description?.trim() || null,
    surface: "social",
    reason: input.reason,
  };
  const { data: existing, error: lookupError } = await supabase
    .from("user_reports")
    .select("id")
    .eq("reporter_id", input.reporterId)
    .eq("reported_content_id", input.postId)
    .eq("surface", "social")
    .maybeSingle();
  if (lookupError) throw lookupError;

  const { error } = existing
    ? await supabase
        .from("user_reports")
        .update(values)
        .eq("id", existing.id)
        .eq("reporter_id", input.reporterId)
    : await supabase.from("user_reports").insert(values);
  if (error) throw error;
}
