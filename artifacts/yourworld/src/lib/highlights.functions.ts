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

      // Prefer the transactional SECURITY DEFINER RPC. If an older deployment
      // has not received that migration yet, use the same owner-checked
      // service-role client to clear optional legacy mappings and delete the
      // parent row directly.
      let deletedId: string | null = null;
      const deleteDirectly = async () => {
        const optionalTables = ["highlight_stories", "highlight_items"];
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
        if (directDeleteError) throw directDeleteError;
        return (deletedRows?.[0] as { id?: string } | undefined)?.id ?? null;
      };

      const { data: rpcDeletedId, error: rpcError } = await db.rpc("delete_highlight_hard", {
        p_highlight_id: data.highlightId,
        p_user_id: userId,
      });
      if (!rpcError && rpcDeletedId === data.highlightId) {
        deletedId = rpcDeletedId ?? null;
      } else {
        console.warn("[highlights] hard delete RPC did not remove the row; using direct cleanup", {
          highlightId: data.highlightId,
          code: rpcError?.code ?? null,
          message: rpcError?.message ?? null,
        });
        deletedId = await deleteDirectly();
      }
      console.log("[highlights] hard delete result", {
        highlightId: data.highlightId,
        requestedBy: userId,
        deletedId: deletedId ?? null,
        error: rpcError
          ? {
              code: rpcError.code,
              message: rpcError.message,
              details: rpcError.details,
              hint: rpcError.hint,
            }
          : null,
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