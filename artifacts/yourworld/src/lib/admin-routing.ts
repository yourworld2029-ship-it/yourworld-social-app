export const SUPPORT_ADMIN_EMAIL = "yourworld2029@gmail.com";
export const OPERATIONS_ADMIN_EMAIL = "yourworldadmin3@gmail.com";

export function isOwnerAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === SUPPORT_ADMIN_EMAIL;
}
