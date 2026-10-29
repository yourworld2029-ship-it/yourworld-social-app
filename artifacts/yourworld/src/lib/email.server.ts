import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";

type TransactionalEmail = Pick<
  SendMailOptions,
  "to" | "bcc" | "subject" | "html" | "text" | "attachments" | "replyTo"
>;

export type TransactionalEmailResult =
  | { sent: true }
  | { sent: false; reason: string };

export function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTransactionalEmail(
  message: TransactionalEmail,
): Promise<TransactionalEmailResult> {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const senderName = process.env.SENDER_NAME?.trim() || "YourWorld Creator Admin";

  if (!user || !password) {
    return {
      sent: false,
      reason: "SMTP sender credentials are not configured.",
    };
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { sent: false, reason: "SMTP port is invalid." };
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
  });

  try {
    await transport.sendMail({
      ...message,
      from: { name: senderName, address: user },
    });
    return { sent: true };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code ?? "SMTP_ERROR")
        : "SMTP_ERROR";
    console.error("[transactional-email] SMTP delivery failed", { code });
    return { sent: false, reason: "Email delivery failed. Check the SMTP configuration." };
  } finally {
    transport.close();
  }
}
