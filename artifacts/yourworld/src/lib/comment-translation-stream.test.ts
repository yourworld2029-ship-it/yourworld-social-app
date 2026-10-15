import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readCommentTranslationStream } from "./comment-translation-stream";

function streamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("comment translation stream", () => {
  it("renders partial translation as events arrive and returns the full text", async () => {
    const partials: string[] = [];
    const result = await readCommentTranslationStream(
      streamResponse([
        'data: {"delta":"नमस्"}\n\n',
        'data: {"delta":"ते"}\n\n',
        'data: {"done":true,"alreadyInTargetLanguage":false}\n\n',
      ]),
      (text) => partials.push(text),
    );

    assert.deepEqual(partials, ["नमस्", "नमस्ते"]);
    assert.deepEqual(result, {
      translatedText: "नमस्ते",
      alreadyInTargetLanguage: false,
    });
  });

  it("handles event boundaries split across network chunks", async () => {
    const result = await readCommentTranslationStream(
      streamResponse([
        'data: {"delta":"नमस्"}\n',
        '\ndata: {"delta":"ते"}\n\n',
        'data: {"done":true,"alreadyInTargetLanguage":false}',
      ]),
    );

    assert.equal(result.translatedText, "नमस्ते");
  });

  it("surfaces a streamed service error", async () => {
    await assert.rejects(
      readCommentTranslationStream(
        streamResponse(['data: {"error":"Translation failed"}\n\n']),
      ),
      /Translation failed/,
    );
  });

  it("does not expose original text as a translation when it is already in the target language", async () => {
    const partials: string[] = [];
    const result = await readCommentTranslationStream(
      streamResponse([
        'data: {"alreadyInTargetLanguage":true}\n\n',
        'data: {"done":true,"alreadyInTargetLanguage":true,"translatedText":"Already Hindi"}\n\n',
      ]),
      (text) => partials.push(text),
    );

    assert.deepEqual(partials, []);
    assert.deepEqual(result, {
      translatedText: "Already Hindi",
      alreadyInTargetLanguage: true,
    });
  });
});
