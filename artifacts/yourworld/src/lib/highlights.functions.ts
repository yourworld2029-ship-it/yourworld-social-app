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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rpc: (functionName: string, args: Record<string, unknown>) => any;
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

      // The request is already authenticated by requireSupabaseAuth. Delete
      // through the server-only service-role client with the authenticated
      // owner in the predicate. This avoids depending on a browser session
      // lookup or a client-side RLS policy for the destructive mutation.
      const optionalTables = ["highlight_stories", "highlight_items", "highlight_media"];
      for (const table of optionalTables) {
        const { error: childError } = await db
          .from(table)
          .delete()
          .eq("highlight_id", data.highlightId);
        const missingOptionalTable =
          childError?.code === "PGRST205" ||
          /could not find the table|relation .* does not exist/i.test(childError?.message ?? "");
        if (childError && !missingOptionalTable) throw childError;
      }

      const { data: deletedRows, error: directDeleteError } = await db
        .from("highlights")
        .delete()
        .eq("id", data.highlightId)
        .eq("user_id", userId)
        .select("id");
      if (directDeleteError) {
        console.error("HIGHLIGHT DELETE FAILED:", directDeleteError);
        throw new Error(directDeleteError.message || "Failed to delete highlight");
      }
      const deletedId =
        (deletedRows?.[0] as { id?: string } | undefined)?.id ?? null;
      console.log("[highlights] hard delete result", {
        highlightId: data.highlightId,
        requestedBy: userId,
        deletedId: deletedId ?? null,
        ownerPredicate: userId,
      });
      if (deletedId !== data.highlightId) {
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