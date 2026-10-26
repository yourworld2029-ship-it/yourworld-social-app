import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTransactionalEmail } from "@/lib/email.server";
import { buildMonetizationApprovalEmail } from "@/lib/monetization-approval-email";
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

export type InternationalPayoutProfile = {
  country: string;
  legalName: string;
  taxIdentifier: string;
  dateOfBirth: string | null;
  mobileNumber: string | null;
  payoutMethod: "bank" | "paypal";
  routingAba: string | null;
  accountNumber: string | null;
  governmentIdPath: string | null;
  bankStatementPath: string | null;
  iban: string | null;
  swiftBic: string | null;
  bankName: string | null;
  paypalEmail: string | null;
  usTaxResidentDeclaration: boolean;
  nonIndianResidentDeclaration: boolean;
  reviewStatus: "pending" | "verified" | "rejected";
  reviewReason: string | null;
  submittedAt: string;
};

type PayoutRpcClient = {
  rpc: (
    functionName: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const internationalPayoutSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  taxIdentifier: z.string().trim().min(4).max(100),
  dateOfBirth: z.string().max(10).optional().default(""),
  mobileNumber: z.string().max(16).optional().default(""),
  payoutMethod: z.enum(["bank", "paypal"]),
  routingAba: z.string().trim().max(32).optional().default(""),
  accountNumber: z.string().trim().max(64).optional().default(""),
  confirmAccountNumber: z.string().trim().max(64).optional().default(""),
  iban: z.string().trim().max(64).optional().default(""),
  swiftBic: z.string().trim().max(32).optional().default(""),
  bankName: z.string().trim().max(160).optional().default(""),
  paypalEmail: z.string().trim().max(254).optional().default(""),
  governmentIdPath: z.string().max(512).optional().default(""),
  bankStatementPath: z.string().max(512).optional().default(""),
  usTaxResidentDeclaration: z.boolean().default(false),
  nonIndianResidentDeclaration: z.boolean().default(false),
});

/** Returns only the signed-in creator's international payout form and review state. */
export const getInternationalPayoutProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as PayoutRpcClient;
    const { data, error } = await db.rpc("get_my_international_payout_profile");
    if (error) throw new Error(error.message);
    return { profile: (data ?? null) as InternationalPayoutProfile | null };
  });

/** Saves non-Indian payout details; the database derives country from the saved profile. */
export const saveInternationalPayoutProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => internationalPayoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as unknown as PayoutRpcClient;
    const { data: result, error } = await db.rpc("save_international_payout_profile_us_kyc", {
      p_legal_name: data.legalName,
      p_tax_identifier: data.taxIdentifier,
      p_payout_method: data.payoutMethod,
      p_routing_aba: data.routingAba,
      p_account_number: data.accountNumber,
      p_iban: data.iban,
      p_swift_bic: data.swiftBic,
      p_bank_name: data.bankName,
      p_paypal_email: data.paypalEmail,
      p_us_tax_resident_declaration: data.usTaxResidentDeclaration,
      p_non_indian_resident_declaration: data.nonIndianResidentDeclaration,
      p_terms_accepted: true,
      p_us_date_of_birth: data.dateOfBirth,
      p_us_mobile_number: data.mobileNumber,
      p_us_confirm_account_number: data.confirmAccountNumber,
      p_us_government_id_path: data.governmentIdPath,
      p_us_bank_statement_path: data.bankStatementPath,
    });
    if (error) throw new Error(error.message);
    return result as { reviewStatus: "pending" | "verified" | "rejected"; country: string };
  });

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

/** Sends the qualification checklist only after the creator's eligibility is saved. */
export const emailMonetizationChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payoutProfile, error: profileError } = await supabaseAdmin
      .from("creator_payout_profiles")
      .select("monetization_eligible,payout_currency")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!payoutProfile?.monetization_eligible) {
      throw new Error("Save monetization eligibility before sending its checklist.");
    }

    const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (authError) throw new Error("Could not confirm the creator's email address.");
    const creatorEmail = authResult.user?.email;
    if (!creatorEmail || !authResult.user?.email_confirmed_at) {
      return { sent: false, reason: "A confirmed account email is required for the checklist." };
    }

    const template = buildMonetizationApprovalEmail(
      payoutProfile.payout_currency === "USD" ? "USD" : "INR",
    );
    return sendTransactionalEmail({
      to: creatorEmail,
      ...template,
    });
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

    const emailResult = await sendTransactionalEmail({
      to: data.to,
      bcc: ["yourworld2029@gmail.com"],
      subject: `Payout Statement & Tax Invoice — ${data.statementId}`,
      text: `Your payout has been processed. Your Payout Statement & Tax Invoice (${data.statementId}) is attached as a PDF. Form 16A will be available in your Wallet section at the end of the financial quarter.`,
      html: `<p>Hi,</p><p>Your payout has been processed. Your Payout Statement &amp; Tax Invoice (${data.statementId}) is attached as a PDF.</p><p>Form 16A will be available in your Wallet section at the end of the financial quarter.</p><p>— YourWorld</p>`,
      attachments: [
        {
          filename: `${data.statementId}-payout-statement.pdf`,
          content: pdfBytes,
          contentType: "application/pdf",
        },
      ],
    });
    if (!emailResult.sent) return { sent: false, reason: `Invoice saved. ${emailResult.reason}` };

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
