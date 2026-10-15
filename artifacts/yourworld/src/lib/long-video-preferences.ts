import { supabase } from "@/integrations/supabase/client";

export const LONG_VIDEO_CREATOR_VISIBILITY_EVENT =
  "yw:long-video-creator-visibility-change";

export type LongVideoCreatorVisibilityDetail = {
  creatorId: string;
  hidden: boolean;
};

export function announceLongVideoCreatorVisibilityChange(
  creatorId: string,
  hidden: boolean,
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LongVideoCreatorVisibilityDetail>(
      LONG_VIDEO_CREATOR_VISIBILITY_EVENT,
      { detail: { creatorId, hidden } },
    ),
  );
}

export async function setLongVideoCreatorHidden(
  userId: string,
  creatorId: string,
  hidden: boolean,
) {
  if (userId === creatorId && hidden) {
    throw new Error("You can't hide yourself");
  }
  if (hidden) {
    const { error } = await supabase
      .from("user_hidden_creators")
      .upsert(
        { user_id: userId, creator_id: creatorId },
        { onConflict: "user_id,creator_id", ignoreDuplicates: true },
      );
    if (error) throw error;
  } else {
    const [hiddenResult, mutedResult] = await Promise.all([
      supabase
        .from("user_hidden_creators")
        .delete()
        .eq("user_id", userId)
        .eq("creator_id", creatorId),
      supabase
        .from("user_muted_creators")
        .delete()
        .eq("user_id", userId)
        .eq("creator_id", creatorId),
    ]);
    if (hiddenResult.error) throw hiddenResult.error;
    if (mutedResult.error) throw mutedResult.error;
  }
  announceLongVideoCreatorVisibilityChange(creatorId, hidden);
}
