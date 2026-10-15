import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractJsonStringPrefix } from "./translate-comment";

describe("partial translation JSON extraction", () => {
  it("extracts a complete translated string with escaped quotes", () => {
    const result = extractJsonStringPrefix(
      String.raw`{"alreadyInTargetLanguage":false,"translatedText":"He said \"hello\"."}`,
      "translatedText",
    );

    assert.equal(result, 'He said "hello".');
  });

  it("waits for an incomplete escape sequence before exposing it", () => {
    const result = extractJsonStringPrefix(
      '{"translatedText":"Hello ' + "\\" + "u09",
      "translatedText",
    );

    assert.equal(result, "Hello ");
  });

  it("returns null until the translation field begins", () => {
    assert.equal(
      extractJsonStringPrefix('{"alreadyInTargetLanguage":false,', "translatedText"),
      null,
    );
  });
});
