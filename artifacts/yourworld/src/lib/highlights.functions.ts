import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const deleteHighlightInput = z.object({
  highlightId: z.string().uuid(),
});

export const deleteHighlight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => deleteHighlightInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Highlights are stored as one row with an items JSONB payload. There is
    // no child highlight_items or junction table to clean up separately.
    const db = supabase as unknown as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (table: string) => any;
    };

    const { data: highlight, error: lookupError } = await db
      .from("highlights")
      .select("id,user_id")
      .eq("id", data.highlightId)
      .maybeSingle();
    if (lookupError) {
      console.error("[highlights] delete lookup failed", {
        userId,
        highlightId: data.highlightId,
        error: lookupError,
      });
      throw new Error("Failed to find the highlight");
    }
    if (!highlight) {
      console.error("[highlights] delete requested for missing highlight", {
        userId,
        highlightId: data.highlightId,
      });
      throw new Error("Highlight not found");
    }
    if (highlight.user_id !== userId) {
      console.error("[highlights] delete ownership check failed", {
        userId,
        highlightId: data.highlightId,
        ownerId: highlight.user_id,
      });
      throw new Error("You can only delete your own highlights");
    }

    const { error: deleteError } = await db
      .from("highlights")
      .delete()
      .eq("id", data.highlightId)
      .eq("user_id", userId);
    if (deleteError) {
      console.error("[highlights] database delete failed", {
        userId,
        highlightId: data.highlightId,
        error: deleteError,
      });
      throw new Error("Failed to delete highlight");
    }

    const { data: remaining, error: verifyError } = await db
      .from("highlights")
      .select("id")
      .eq("id", data.highlightId)
      .eq("user_id", userId)
      .maybeSingle();
    if (verifyError) {
      console.error("[highlights] delete verification failed", {
        userId,
        highlightId: data.highlightId,
        error: verifyError,
      });
      throw new Error("Could not verify highlight deletion");
    }
    if (remaining) {
      console.error("[highlights] database delete affected no row", {
        userId,
        highlightId: data.highlightId,
      });
      throw new Error("Failed to delete highlight");
    }

    return { deleted: true as const };
  });