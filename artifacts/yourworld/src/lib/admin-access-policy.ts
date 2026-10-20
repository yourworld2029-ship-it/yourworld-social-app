export const ADMIN_OWNER_EMAIL = "yourworld2029@gmail.com";

export function hasAdminConsoleAccess(
  email: string | null | undefined,
  role: string | null | undefined,
) {
  return email?.trim().toLowerCase() === ADMIN_OWNER_EMAIL || role === "admin";
}
