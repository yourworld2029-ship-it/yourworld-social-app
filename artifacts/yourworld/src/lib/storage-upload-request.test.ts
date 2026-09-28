import assert from "node:assert/strict";
import test from "node:test";
import { runDirectUploadRequest } from "./storage-upload-request";

test("direct upload reports completion only after the Storage response", async () => {
  const progress: Array<[number, string | undefined]> = [];
  let finishRequest!: (result: { error: unknown | null }) => void;
  const response = new Promise<{ error: unknown | null }>((resolve) => {
    finishRequest = resolve;
  });

  const upload = runDirectUploadRequest(() => response, (percent, detail) => {
    progress.push([percent, detail]);
  });

  assert.deepEqual(progress, [[0, "Uploading"]]);
  finishRequest({ error: null });
  assert.deepEqual(await upload, { error: null });
  assert.deepEqual(progress, [
    [0, "Uploading"],
    [100, "Upload complete"],
  ]);
});

test("direct upload returns the exact Storage error without reporting completion", async () => {
  const progress: number[] = [];
  const result = await runDirectUploadRequest(
    async () => ({ error: { message: "The object already exists" } }),
    (percent) => progress.push(percent),
  );

  assert.deepEqual(result, { error: "The object already exists" });
  assert.deepEqual(progress, [0]);
});

test("direct upload preserves thrown network error messages", async () => {
  const result = await runDirectUploadRequest(async () => {
    throw new Error("Failed to fetch");
  });

  assert.deepEqual(result, { error: "Failed to fetch" });
});