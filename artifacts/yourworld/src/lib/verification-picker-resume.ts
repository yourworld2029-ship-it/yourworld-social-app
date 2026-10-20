export type VerificationPickerResumeForm = "sports" | "national-award";

const RESUME_TTL_MS = 10 * 60 * 1000;

function resumeKey(userId: string, form: VerificationPickerResumeForm) {
  return `yourworld:verification-picker-resume:${form}:${userId}`;
}

export function markVerificationPickerResume(
  userId: string,
  form: VerificationPickerResumeForm,
) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(resumeKey(userId, form), String(Date.now()));
  } catch {
    // Keep the in-memory upload flow working if browser storage is unavailable.
  }
}

export function hasVerificationPickerResume(
  userId: string,
  form: VerificationPickerResumeForm,
) {
  if (!userId || typeof window === "undefined") return false;
  const key = resumeKey(userId, form);
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return false;
    const createdAt = Number(value);
    if (
      !Number.isFinite(createdAt) ||
      createdAt <= 0 ||
      createdAt > Date.now() + 60_000 ||
      Date.now() - createdAt > RESUME_TTL_MS
    ) {
      window.localStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearVerificationPickerResume(
  userId: string,
  form: VerificationPickerResumeForm,
) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(resumeKey(userId, form));
  } catch {
    // Ignore storage cleanup failures; the marker expires automatically.
  }
}
