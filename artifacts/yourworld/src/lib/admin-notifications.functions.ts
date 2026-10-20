import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendAdminNotificationEmail } from "@/lib/admin-notifications.server";
import { SUPPORT_ADMIN_EMAIL } from "@/lib/admin-routing";

const reportNotificationSchema = z.object({
  kind: z.enum(["user", "copyright"]),
  reportId: z.string().uuid(),
});

export const notifyAdminOfReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => reportNotificationSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    let submittedAt: string | null = null;
    let reportSurface = "Copyright / DMCA";

    if (data.kind === "copyright") {
      const { data: report, error } = await supabaseAdmin
        .from("copyright_reports")
        .select("reporter_user_id,created_at")
        .eq("id", data.reportId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!report || report.reporter_user_id !== context.userId) {
        throw new Error("This report could not be verified.");
      }
      submittedAt = report.created_at;
    } else {
      const { data: report, error } = await supabaseAdmin
        .from("user_reports")
        .select("reporter_id,surface,created_at")
        .eq("id", data.reportId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!report || report.reporter_id !== context.userId) {
        throw new Error("This report could not be verified.");
      }
      reportSurface = `Community report · ${report.surface || "user report"}`;
      submittedAt = report.created_at;
    }

    const sent = await sendAdminNotificationEmail(
      "support",
      `New ${data.kind === "copyright" ? "Copyright / DMCA" : "Community"} report`,
      [
        "<p>A new report is waiting for review in YourWorld.</p>",
        `<p>Type: ${reportSurface}</p>`,
        `<p>Submitted: ${submittedAt ? new Date(submittedAt).toISOString() : "just now"}</p>`,
        "<p>Open YourWorld → Settings → Admin Console to review it.</p>",
        `<p>Notification recipient: ${SUPPORT_ADMIN_EMAIL}</p>`,
      ].join(""),
    );

    return { sent };
  });
