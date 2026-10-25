export const ADMIN_OWNER_EMAIL = "yourworld2029@gmail.com";

export function isAdminConsoleOwner(email: string | null | undefined) {
  return email?.trim().toLowerCase() === ADMIN_OWNER_EMAIL;
}

export function canReadSportsVerificationWithoutStepUp(email: string | null | undefined) {
  return isAdminConsoleOwner(email);
}

export function hasAdminConsoleAccess(
  email: string | null | undefined,
  role: string | null | undefined,
) {
  return isAdminConsoleOwner(email) || role === "admin";
}
