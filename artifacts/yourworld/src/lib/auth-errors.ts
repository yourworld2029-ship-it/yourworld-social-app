export function isAuthSessionMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; message?: string };
  return (
    candidate.name === "AuthSessionMissingError" ||
    candidate.message === "Auth session missing!"
  );
}