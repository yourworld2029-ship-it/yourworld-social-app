import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Deletes the authenticated user's account through the transactional
 * SECURITY DEFINER function in Supabase. The bearer token is attached by the
 * auth middleware, so the database function can resolve auth.uid() itself.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const db = supabase as unknown as {
      rpc: (name: string) => Promise<{ error: { message?: string } | null }>;
    };
    const { error } = await db.rpc("delete_my_account");
    if (error) {
      console.error("[account] deletion failed", {
        userId,
        message: error.message,
      });
      throw new Error(error.message || "Could not delete your account");
    }
    return { deleted: true as const };
  });