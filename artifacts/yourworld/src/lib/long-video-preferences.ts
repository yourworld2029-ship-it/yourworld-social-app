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
  const result = hidden
    ? await supabase
        .from("user_hidden_creators")
        .upsert(
          { user_id: userId, creator_id: creatorId },
          { onConflict: "user_id,creator_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("user_hidden_creators")
        .delete()
        .eq("user_id", userId)
        .eq("creator_id", creatorId);

  if (result.error) throw result.error;
  announceLongVideoCreatorVisibilityChange(creatorId, hidden);
}
