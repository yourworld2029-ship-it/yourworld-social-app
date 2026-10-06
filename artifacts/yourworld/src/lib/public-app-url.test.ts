import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_PUBLIC_APP_URL,
  buildPublicAppUrl,
  normalizePublicAppBaseUrl,
} from "./public-app-url";

test("public app links use the configured production origin", () => {
  const baseUrl = "https://yourworld.example";
  assert.equal(normalizePublicAppBaseUrl(`${baseUrl}/some/path`), baseUrl);
  assert.equal(
    buildPublicAppUrl("/watch/abc?type=video", baseUrl, "localhost"),
    `${baseUrl}/watch/abc?type=video`,
  );
});

test("localhost and development-host share URLs are rewritten to production", () => {
  assert.equal(
    buildPublicAppUrl("https://localhost/watch/abc?type=reel", DEFAULT_PUBLIC_APP_URL),
    `${DEFAULT_PUBLIC_APP_URL}/watch/abc?type=reel`,
  );
  assert.equal(
    buildPublicAppUrl("https://preview.replit.dev/u/abc", DEFAULT_PUBLIC_APP_URL),
    `${DEFAULT_PUBLIC_APP_URL}/u/abc`,
  );
});

test("public app base rejects local, development, and non-HTTPS origins", () => {
  for (const value of [
    "http://yourworld.example",
    "https://localhost",
    "https://app.replit.dev",
    "not-a-url",
  ]) {
    assert.throws(() => normalizePublicAppBaseUrl(value), /PUBLIC_APP_URL/);
  }
});
