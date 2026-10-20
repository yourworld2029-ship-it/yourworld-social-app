import {
  OPERATIONS_ADMIN_EMAIL,
  SUPPORT_ADMIN_EMAIL,
} from "@/lib/admin-routing";

type AdminNotificationRecipient = "operations" | "support";

export function escapeAdminEmailHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export async function sendAdminNotificationEmail(
  recipient: AdminNotificationRecipient,
  subject: string,
  html: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const to =
    recipient === "operations" ? OPERATIONS_ADMIN_EMAIL : SUPPORT_ADMIN_EMAIL;
  const from =
    process.env.RESEND_FROM_EMAIL ||
    "YourWorld Notifications <onboarding@resend.dev>";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
