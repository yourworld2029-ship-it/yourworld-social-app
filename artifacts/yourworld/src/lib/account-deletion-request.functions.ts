import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { escapeEmailHtml, sendTransactionalEmail } from "@/lib/email.server";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  username: z.string().trim().max(80).default(""),
  website: z.string().max(200).default(""),
});

const lastAcceptedRequestByEmail = new Map<string, number>();
const REQUEST_COOLDOWN_MS = 5 * 60_000;

export const submitPublicAccountDeletionRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    // Hidden honeypot field; bots are acknowledged without sending email.
    if (data.website.trim()) return { sent: true as const };

    const email = data.email.trim().toLowerCase();
    const now = Date.now();
    for (const [address, timestamp] of lastAcceptedRequestByEmail) {
      if (now - timestamp > REQUEST_COOLDOWN_MS) {
        lastAcceptedRequestByEmail.delete(address);
      }
    }
    const previousRequestAt = lastAcceptedRequestByEmail.get(email);
    if (previousRequestAt && now - previousRequestAt < REQUEST_COOLDOWN_MS) {
      return {
        sent: false as const,
        message: "A request from this email was recently submitted. Please wait a few minutes or email us directly.",
      };
    }

    const safeEmail = escapeEmailHtml(data.email.trim());
    const safeUsername = escapeEmailHtml(data.username.trim() || "Not provided");
    const result = await sendTransactionalEmail({
      to: "Yourworld2029@gmail.com",
      replyTo: data.email.trim(),
      subject: "YourWorld account deletion request",
      text: [
        "A public account deletion request was submitted.",
        `Contact email: ${data.email.trim()}`,
        `YourWorld username: ${data.username.trim() || "Not provided"}`,
        "",
        "Please verify ownership with the requester before taking account action.",
        "This request does not delete an account automatically.",
      ].join("\n"),
      html: `<h2>YourWorld account deletion request</h2>
        <p><strong>Contact email:</strong> ${safeEmail}</p>
        <p><strong>YourWorld username:</strong> ${safeUsername}</p>
        <p>Please verify ownership with the requester before taking account action.</p>
        <p>This request does not delete an account automatically.</p>`,
    });

    if (!result.sent) {
      console.error("[account-deletion-request] delivery failed", {
        reason: result.reason,
      });
      return {
        sent: false as const,
        message: "We couldn't send your request right now. Please email Yourworld2029@gmail.com directly.",
      };
    }

    lastAcceptedRequestByEmail.set(email, now);
    return { sent: true as const };
  });
