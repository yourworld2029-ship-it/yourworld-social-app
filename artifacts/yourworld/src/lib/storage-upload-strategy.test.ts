import assert from "node:assert/strict";
import test from "node:test";
import {
  getTusParallelUploadCount,
  TUS_CHUNK_SIZE_BYTES,
} from "./storage-upload-strategy";

test("uses Supabase's documented 6 MiB TUS PATCH size", () => {
  assert.equal(TUS_CHUNK_SIZE_BYTES, 6 * 1024 * 1024);
});

test("keeps small or unsupported uploads on one resumable stream", () => {
  assert.equal(getTusParallelUploadCount(14 * 1024 * 1024, true), 1);
  assert.equal(getTusParallelUploadCount(40 * 1024 * 1024, false), 1);
});

test("uses three parallel parts when the confirmed file supports three 5 MiB parts", () => {
  assert.equal(getTusParallelUploadCount(15 * 1024 * 1024, true), 3);
  assert.equal(getTusParallelUploadCount(20 * 1024 * 1024, true), 3);
});

test("caps large uploads at four parallel parts", () => {
  assert.equal(getTusParallelUploadCount(24 * 1024 * 1024, true), 4);
  assert.equal(getTusParallelUploadCount(100 * 1024 * 1024, true), 4);
});

test("rejects invalid file sizes for parallel uploads", () => {
  assert.equal(getTusParallelUploadCount(Number.NaN, true), 1);
  assert.equal(getTusParallelUploadCount(-1, true), 1);
});