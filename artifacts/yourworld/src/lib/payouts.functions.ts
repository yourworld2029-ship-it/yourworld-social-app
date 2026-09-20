import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeBreakdown, type GrossBySource } from "./payout-math";

const emptyGross = (): GrossBySource => ({ ads: 0, course: 0, vip: 0 });

export type PayoutRequestResult = {
  id: string;
  user_id: string;
  amount: number | string;
  net_amount: number | string;
  tds_deducted: number | string;
  status: "processing" | "completed" | "failed" | string;
  schedule_type: "15_days" | "30_days";
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

/** Creates a payout statement from all pending (unpaid) creator earnings. */
export const processPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // These payout tables are an optional legacy path and are not part of the
    // generated live schema contract.
    const db = supabase as unknown as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (table: string) => any;
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payoutHold, error: holdError } = await supabaseAdmin
      .from("admin_payout_holds")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "held")
      .maybeSingle();
    if (holdError) throw new Error(holdError.message);
    if (payoutHold) {
      throw new Error("Payout processing is temporarily held pending an authorized review.");
    }

    const { data: earnings, error } = await db
      .from("creator_earnings")
      .select("id, source, gross_amount")
      .eq("user_id", userId)
      .is("payout_id", null);
    if (error) throw new Error(error.message);

    const bySource = emptyGross();
    for (const row of earnings ?? []) {
      const key = row.source as keyof GrossBySource;
      if (key in bySource) bySource[key] += Number(row.gross_amount ?? 0);
    }
    const breakdown = computeBreakdown(bySource);
    if (breakdown.net < 5000)
      throw new Error("Minimum balance to withdraw instantly is ₹5,000");

    const { data: details } = await db
      .from("creator_payout_details")
      .select("pan_number")
      .eq("user_id", userId)
      .maybeSingle();

    const statementId = `YW-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const { data: payout, error: insErr } = await supabaseAdmin
      .from("creator_payouts")
      .insert({
        user_id: userId,
        statement_id: statementId,
        gross_amount: breakdown.gross,
        gst_amount: breakdown.gst,
        platform_share: breakdown.platformShare,
        tds_amount: breakdown.tds,
        net_amount: breakdown.net,
        ads_gross: bySource.ads,
        course_gross: bySource.course,
        vip_gross: bySource.vip,
        pan_number: details?.pan_number ?? null,
        status: "processing",
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    const ids = (earnings ?? []).map((e: { id: string }) => e.id);
    if (ids.length) {
      await supabaseAdmin
        .from("creator_earnings")
        .update({ payout_id: payout.id })
        .in("id", ids);
    }

    return { payout, breakdown };
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
