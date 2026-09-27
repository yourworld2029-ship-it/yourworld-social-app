import assert from "node:assert/strict";
import { test } from "node:test";
import {
  consumeVideoResumeRequest,
  getVideoResumeEntries,
  requestVideoResume,
  saveVideoResumeEntry,
} from "./video-resume";

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
      currentTime: 42,
      duration: 120,
      progress: 0.35,
      seriesTitle: "Series",
      episodeNumber: 2,
      watchedSeconds: 10,
      updatedAt: now,
    });

    const [entry] = getVideoResumeEntries();
    assert.equal(entry?.currentTime, 42);
    assert.equal(entry?.thumbnailUrl, "");

    requestVideoResume(entry!.id, entry!.currentTime);
    assert.equal(consumeVideoResumeRequest(entry!.id), 42);
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