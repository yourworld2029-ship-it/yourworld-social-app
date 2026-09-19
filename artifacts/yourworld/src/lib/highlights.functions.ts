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
    const { userId } = context;
    console.log("===> ATTEMPTING TO DELETE HIGHLIGHT ID:", data.highlightId, "USER:", userId);

    try {
      // The caller is authenticated by requireSupabaseAuth. Use the server-only
      // client for the final owner-scoped mutation so a stale/missing RLS
      // policy cannot make the UI report success while leaving the row behind.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = supabaseAdmin as unknown as {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        from: (table: string) => any;
      };

      const { data: highlight, error: lookupError } = await db
        .from("highlights")
        .select("id,user_id")
        .eq("id", data.highlightId)
        .maybeSingle();
      console.log("[highlights] delete lookup result", {
        highlightId: data.highlightId,
        requestedBy: userId,
        found: Boolean(highlight),
        ownerId: highlight?.user_id ?? null,
        error: lookupError
          ? {
              code: lookupError.code,
              message: lookupError.message,
              details: lookupError.details,
              hint: lookupError.hint,
            }
          : null,
      });
      if (lookupError) throw new Error(`Highlight lookup failed: ${lookupError.message}`);
      if (!highlight) throw new Error("Highlight not found");
      if (highlight.user_id !== userId) {
        throw new Error("You can only delete your own highlights");
      }

      // The live schema stores all Highlight items in one JSONB column. There
      // are no highlight_items/highlight_stories child rows to delete first.
      console.log("[highlights] child cleanup skipped: items are JSONB on highlights", {
        highlightId: data.highlightId,
        childTables: [],
      });

      const { data: deletedRows, error: deleteError } = await db
        .from("highlights")
        .delete()
        .eq("id", data.highlightId)
        .eq("user_id", userId)
        .select("id");
      console.log("[highlights] database delete result", {
        highlightId: data.highlightId,
        requestedBy: userId,
        deletedCount: deletedRows?.length ?? 0,
        deletedIds: deletedRows?.map((row: { id: string }) => row.id) ?? [],
        error: deleteError
          ? {
              code: deleteError.code,
              message: deleteError.message,
              details: deleteError.details,
              hint: deleteError.hint,
            }
          : null,
      });
      if (deleteError) throw new Error(`Highlight delete failed: ${deleteError.message}`);
      if (!deletedRows?.some((row: { id: string }) => row.id === data.highlightId)) {
        throw new Error("Highlight delete affected no row");
      }

      const { data: remaining, error: verifyError } = await db
        .from("highlights")
        .select("id")
        .eq("id", data.highlightId)
        .eq("user_id", userId)
        .maybeSingle();
      console.log("[highlights] delete verification result", {
        highlightId: data.highlightId,
        remaining: Boolean(remaining),
        error: verifyError
          ? {
              code: verifyError.code,
              message: verifyError.message,
              details: verifyError.details,
              hint: verifyError.hint,
            }
          : null,
      });
      if (verifyError) throw new Error(`Highlight delete verification failed: ${verifyError.message}`);
      if (remaining) throw new Error("Highlight still exists after delete");

      console.log("[highlights] delete completed", {
        highlightId: data.highlightId,
        userId,
        sourceMediaDeleted: false,
      });
      return { deleted: true as const };
    } catch (error) {
      console.error("===> HIGHLIGHT DELETE ERROR:", {
        highlightId: data.highlightId,
        userId,
        error,
      });
      throw error instanceof Error ? error : new Error("Failed to delete highlight");
    }
  });