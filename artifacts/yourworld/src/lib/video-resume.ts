import { useEffect, useState } from "react";

const STORAGE_KEY = "yw:video-resume:v1";
const PENDING_RESUME_KEY = "yw:pending-video-resume:v1";
const RESUME_EVENT = "yw:video-resume-updated";
const MAX_RESUME_ENTRIES = 20;
const ENTRY_MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;
const PENDING_MAX_AGE_MS = 2 * 60 * 1000;

export type VideoResumeEntry = {
  id: string;
  title: string;
  thumbnailUrl: string;
  currentTime: number;
  duration: number;
  progress: number;
  seriesTitle: string | null;
  episodeNumber: number | null;
  watchedSeconds: number;
  updatedAt: number;
};

type PendingResume = {
  id: string;
  currentTime: number;
  requestedAt: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function isValidEntry(value: unknown): value is VideoResumeEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<VideoResumeEntry>;
  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.title === "string" &&
    typeof entry.thumbnailUrl === "string" &&
    typeof entry.currentTime === "number" &&
    Number.isFinite(entry.currentTime) &&
    entry.currentTime >= 0 &&
    typeof entry.duration === "number" &&
    Number.isFinite(entry.duration) &&
    entry.duration >= 0 &&
    typeof entry.updatedAt === "number" &&
    Number.isFinite(entry.updatedAt)
  );
}

function readStoredEntries() {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - ENTRY_MAX_AGE_MS;
    return parsed
      .filter(isValidEntry)
      .filter((entry) => entry.updatedAt >= cutoff)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, MAX_RESUME_ENTRIES);
  } catch (error) {
    console.warn("Unable to read local video resume history", error);
    return [];
  }
}

function writeStoredEntries(entries: VideoResumeEntry[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(RESUME_EVENT));
  } catch (error) {
    console.warn("Unable to save local video resume history", error);
  }
}

function persistentThumbnailUrl(value: string) {
  if (!value || !isBrowser()) return "";
  try {
    const url = new URL(value, window.location.origin);
    const hasExpiringSignature = [...url.searchParams.keys()].some((key) =>
      /^(token|sig|signature|expires|x-amz-)/i.test(key),
    );
    if (hasExpiringSignature || !["http:", "https:"].includes(url.protocol)) return "";
    return value;
  } catch {
    return "";
  }
}

export function getVideoResumeEntries() {
  return readStoredEntries();
}

export function getVideoResumeEntry(id: string) {
  return readStoredEntries().find((entry) => entry.id === id) ?? null;
}

export function saveVideoResumeEntry(entry: VideoResumeEntry) {
  if (!isValidEntry(entry)) return;
  const current = readStoredEntries().filter((item) => item.id !== entry.id);
  writeStoredEntries(
    [{ ...entry, thumbnailUrl: persistentThumbnailUrl(entry.thumbnailUrl) }, ...current]
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, MAX_RESUME_ENTRIES),
  );
}

export function removeVideoResumeEntry(id: string) {
  writeStoredEntries(readStoredEntries().filter((entry) => entry.id !== id));
}

export function requestVideoResume(id: string, currentTime: number) {
  if (!isBrowser() || !Number.isFinite(currentTime) || currentTime < 0) return;
  const pending: PendingResume = { id, currentTime, requestedAt: Date.now() };
  try {
    window.sessionStorage.setItem(PENDING_RESUME_KEY, JSON.stringify(pending));
  } catch (error) {
    console.warn("Unable to prepare video resume position", error);
  }
}

export function consumeVideoResumeRequest(id: string) {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_RESUME_KEY);
    window.sessionStorage.removeItem(PENDING_RESUME_KEY);
    if (!raw) return null;
    const pending: unknown = JSON.parse(raw);
    if (!pending || typeof pending !== "object") return null;
    const request = pending as Partial<PendingResume>;
    if (
      request.id !== id ||
      typeof request.currentTime !== "number" ||
      !Number.isFinite(request.currentTime) ||
      request.currentTime < 0 ||
      typeof request.requestedAt !== "number" ||
      Date.now() - request.requestedAt > PENDING_MAX_AGE_MS
    ) {
      return null;
    }
    return request.currentTime;
  } catch (error) {
    console.warn("Unable to restore requested video position", error);
    return null;
  }
}

export function useVideoResumeEntries() {
  const [entries, setEntries] = useState<VideoResumeEntry[]>([]);

  useEffect(() => {
    const refresh = () => setEntries(readStoredEntries());
    refresh();
    window.addEventListener(RESUME_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RESUME_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return entries;
}