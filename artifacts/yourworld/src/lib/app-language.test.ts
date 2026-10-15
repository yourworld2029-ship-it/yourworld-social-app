import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commentMayNeedTranslation } from "./app-language";

describe("comment translation language check", () => {
  it("does not offer translation for English comments when English is selected", () => {
    assert.equal(commentMayNeedTranslation("Hello, how are you?", "en"), false);
  });

  it("does not offer translation for Hindi comments when Hindi is selected", () => {
    assert.equal(commentMayNeedTranslation("आप कैसे हैं?", "hi"), false);
  });

  it("offers translation for Hindi comments when English is selected", () => {
    assert.equal(commentMayNeedTranslation("यह बहुत अच्छा है", "en"), true);
  });

  it("offers translation for English-script comments when Hindi is selected", () => {
    assert.equal(commentMayNeedTranslation("This is really good", "hi"), true);
  });
});
