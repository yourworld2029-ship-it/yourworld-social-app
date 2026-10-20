import assert from "node:assert/strict";
import test from "node:test";
import {
  VERIFICATION_DOCUMENT_MAX_BYTES,
  VERIFICATION_VIDEO_MAX_BYTES,
  VERIFICATION_DOCUMENT_SIZE_ERROR,
  VERIFICATION_VIDEO_SIZE_ERROR,
  validateVerificationDocumentFile,
  validateVerificationVideoSize,
} from "./verification-upload-rules";

function file(name: string, type: string, size: number) {
  return { name, type, size } as unknown as File;
}

test("verification documents accept JPG, PNG, and PDF at the 10 MB limit", () => {
  assert.equal(
    validateVerificationDocumentFile(file("identity.jpg", "image/jpeg", VERIFICATION_DOCUMENT_MAX_BYTES)),
    "image/jpeg",
  );
  assert.equal(
    validateVerificationDocumentFile(file("passport.png", "image/png", 1024)),
    "image/png",
  );
  assert.equal(
    validateVerificationDocumentFile(file("certificate.pdf", "application/pdf", 1024)),
    "application/pdf",
  );
});

test("verification documents reject unsupported formats and files over 10 MB", () => {
  assert.throws(
    () => validateVerificationDocumentFile(file("identity.webp", "image/webp", 1024)),
    /Choose a JPG, JPEG, PNG, or PDF document/,
  );
  assert.throws(
    () =>
      validateVerificationDocumentFile(
        file("large.pdf", "application/pdf", VERIFICATION_DOCUMENT_MAX_BYTES + 1),
      ),
    new RegExp(VERIFICATION_DOCUMENT_SIZE_ERROR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});

test("introduction videos are limited to 50 MB", () => {
  assert.doesNotThrow(() =>
    validateVerificationVideoSize(file("intro.mp4", "video/mp4", VERIFICATION_VIDEO_MAX_BYTES)),
  );
  assert.throws(
    () => validateVerificationVideoSize(file("large.mp4", "video/mp4", VERIFICATION_VIDEO_MAX_BYTES + 1)),
    new RegExp(VERIFICATION_VIDEO_SIZE_ERROR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});
