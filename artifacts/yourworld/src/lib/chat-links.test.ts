import assert from "node:assert/strict";
import test from "node:test";
import {
  extractExternalTextLinks,
  getExternalLinkPresentation,
} from "./chat-links";

test("finds social and other web URLs with or without a scheme", () => {
  const text =
    "https://youtu.be/abc?t=12, instagram.com/reel/xyz www.snapchat.com/add/name facebook.com/page and example.org/help";

  assert.deepEqual(
    extractExternalTextLinks(text).map(({ text: label, href }) => [label, href]),
    [
      ["https://youtu.be/abc?t=12", "https://youtu.be/abc?t=12"],
      ["instagram.com/reel/xyz", "https://instagram.com/reel/xyz"],
      ["www.snapchat.com/add/name", "https://www.snapchat.com/add/name"],
      ["facebook.com/page", "https://facebook.com/page"],
      ["example.org/help", "https://example.org/help"],
    ],
  );
});

test("excludes trailing sentence punctuation and email addresses", () => {
  const text = "Try (https://example.com/watch_(clip)). Contact me@example.com!";
  const [link] = extractExternalTextLinks(text);

  assert.deepEqual(link, {
    start: text.indexOf("https://"),
    end: text.indexOf(")).") + 1,
    text: "https://example.com/watch_(clip)",
    href: "https://example.com/watch_(clip)",
  });
});

test("does not create links for unsupported schemes", () => {
  assert.deepEqual(
    extractExternalTextLinks("javascript://example.com or ftp://files.example.com"),
    [],
  );
});

test("identifies social platforms and normalized domains for rich link cards", () => {
  assert.deepEqual(getExternalLinkPresentation("https://www.youtube.com/watch?v=abc"), {
    platform: "youtube",
    domain: "youtube.com",
  });
  assert.deepEqual(getExternalLinkPresentation("https://youtu.be/abc"), {
    platform: "youtube",
    domain: "youtu.be",
  });
  assert.deepEqual(getExternalLinkPresentation("https://www.instagram.com/p/abc"), {
    platform: "instagram",
    domain: "instagram.com",
  });
  assert.deepEqual(getExternalLinkPresentation("https://example.org/article"), {
    platform: "web",
    domain: "example.org",
  });
  assert.equal(getExternalLinkPresentation("javascript:alert(1)"), null);
});