import assert from "node:assert/strict";
import { test } from "node:test";
import {
  consumeVideoResumeRequest,
  getLatestUnfinishedVideoResume,
  getUnfinishedVideoResumes,
  getVideoResumeEntries,
  requestVideoResume,
  saveVideoResumeEntry,
} from "./video-resume";

test("latest unfinished resume skips completed videos", () => {
  const olderUnfinished = {
    id: "older",
    title: "Older",
    thumbnailUrl: "",
    currentTime: 40,
    duration: 120,
    progress: 1 / 3,
    seriesTitle: null,
    episodeNumber: null,
    watchedSeconds: 40,
    updatedAt: 100,
  };
  const latestUnfinished = {
    ...olderUnfinished,
    id: "latest",
    currentTime: 75,
    progress: 0.625,
    updatedAt: 300,
  };
  const completed = {
    ...olderUnfinished,
    id: "completed",
    currentTime: 116,
    progress: 116 / 120,
    updatedAt: 400,
  };

  assert.equal(
    getLatestUnfinishedVideoResume([olderUnfinished, completed, latestUnfinished])?.id,
    "latest",
  );
  assert.equal(getLatestUnfinishedVideoResume([completed]), null);
  assert.deepEqual(
    getUnfinishedVideoResumes([olderUnfinished, completed, latestUnfinished]).map((entry) => entry.id),
    ["latest", "older"],
  );
});

test("resume entries stay local and discard signed thumbnail URLs", () => {
  const originalWindow = globalThis.window;
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const storage = (data: Map<string, string>) => ({
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  });
  const fakeWindow = {
    location: { origin: "https://yourworld.example" },
    localStorage: storage(local),
    sessionStorage: storage(session),
    dispatchEvent: () => true,
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: fakeWindow as unknown as Window,
  });

  try {
    const now = Date.now();
    saveVideoResumeEntry({
      id: "8d07ab4e-98d9-4c71-bba7-772313481aea",
      title: "Episode 2",
      thumbnailUrl: "https://cdn.example/thumb.jpg?token=temporary",
      currentTime: 42.375,
      duration: 120,
      progress: 0.353125,
      seriesTitle: "Series",
      episodeNumber: 2,
      watchedSeconds: 10,
      updatedAt: now,
    });

    const [entry] = getVideoResumeEntries();
    assert.equal(entry?.currentTime, 42.375);
    assert.equal(entry?.thumbnailUrl, "");

    requestVideoResume(entry!.id, entry!.currentTime);
    assert.equal(consumeVideoResumeRequest(entry!.id), 42.375);
    assert.equal(consumeVideoResumeRequest(entry!.id), null);
  } finally {
    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  }
});