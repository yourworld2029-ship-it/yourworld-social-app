import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PayoutRequestResult = {
  id: string;
  user_id: string;
  amount: number | string;
  net_amount: number | string;
  tds_deducted: number | string;
  status: "processing" | "approved" | "completed" | "failed" | string;
  schedule_type: "monthly_1_5" | "15_days" | "30_days";
  currency: "INR" | "USD";
  payout_window_start: string | null;
  form_16a_url: string | null;
  failure_reason: string | null;
  completed_at: string | null;
  created_at: string;
};

/** Submits the authenticated creator's active wallet balance for payout. */
export const submitPayoutRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as {
      rpc: (
        functionName: string,
      ) => Promise<{ data: PayoutRequestResult | PayoutRequestResult[] | null; error: { message: string } | null }>;
    };
    const { data, error } = await db.rpc("submit_payout_request");
    if (error) throw new Error(error.message);
    const payoutRequest = Array.isArray(data) ? data[0] : data;
    if (!payoutRequest) throw new Error("Payout request could not be created");
    return { payoutRequest };
  });

/** The older automatic payout path is disabled; payouts now use the monthly review request. */
export const processPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    throw new Error("This legacy payout path is disabled. Submit a request from the Monetization Wallet.");
  });

/** Emails the generated payout PDF to the creator's registered address. */
export const emailPayoutInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        payoutId: z.string().uuid(),
        to: z.string().email(),
        statementId: z.string().min(3).max(64),
        pdfBase64: z.string().min(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pdfBytes = Buffer.from(data.pdfBase64, "base64");
    const { error: uploadError } = await supabaseAdmin.storage
      .from("monetization")
      .upload(
        `${context.userId}/${data.statementId}-payout-statement.pdf`,
        pdfBytes,
        { contentType: "application/pdf", upsert: true },
      );
    if (uploadError) {
      return { sent: false, reason: `Invoice storage failed: ${uploadError.message}` };
    }

    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      return { sent: false, reason: "Invoice saved. Email service is not connected yet." };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: "YourWorld Payouts <onboarding@resend.dev>",
        to: [data.to],
        bcc: ["yourworld2029@gmail.com"],
        subject: `Payout Statement & Tax Invoice — ${data.statementId}`,
        html: `<p>Hi,</p><p>Your payout has been processed. Your Payout Statement &amp; Tax Invoice (${data.statementId}) is attached as a PDF.</p><p>Form 16A will be available in your Wallet section at the end of the financial quarter.</p><p>— YourWorld</p>`,
        attachments: [
          { filename: `${data.statementId}-payout-statement.pdf`, content: data.pdfBase64 },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Resend email failed", res.status, await res.text());
      return { sent: false, reason: "Could not send the invoice email." };
    }

    const { error: statusError } = await supabaseAdmin
      .from("creator_payouts")
      .update({ email_sent: true, status: "paid" })
      .eq("id", data.payoutId)
      .eq("user_id", context.userId);
    if (statusError) {
      return { sent: false, reason: `Invoice sent, but payout status update failed: ${statusError.message}` };
    }

    return { sent: true };
  });
