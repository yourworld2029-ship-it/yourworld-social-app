export type CommentTranslationStreamResult = {
  translatedText: string;
  alreadyInTargetLanguage: boolean;
};

type StreamEvent = {
  delta?: unknown;
  done?: unknown;
  translatedText?: unknown;
  alreadyInTargetLanguage?: unknown;
  error?: unknown;
};

export async function readCommentTranslationStream(
  response: Response,
  onPartial?: (translatedText: string) => void,
): Promise<CommentTranslationStreamResult> {
  if (!response.body) {
    throw new Error("The translation stream was empty.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let translatedText = "";
  let complete = false;
  let alreadyInTargetLanguage = false;

  const readEvent = (eventText: string) => {
    const data = eventText
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return;

    let event: StreamEvent;
    try {
      event = JSON.parse(data) as StreamEvent;
    } catch {
      throw new Error("The translation service returned an invalid event.");
    }

    if (typeof event.error === "string") throw new Error(event.error);
    if (typeof event.alreadyInTargetLanguage === "boolean") {
      alreadyInTargetLanguage = event.alreadyInTargetLanguage;
    }
    if (
      alreadyInTargetLanguage !== true &&
      typeof event.delta === "string" &&
      event.delta
    ) {
      translatedText += event.delta;
      onPartial?.(translatedText);
    }
    if (typeof event.translatedText === "string") {
      translatedText = event.translatedText;
      if (alreadyInTargetLanguage !== true) onPartial?.(translatedText);
    }
    if (event.done === true) {
      complete = true;
    }
  };

  const processEvents = (flush: boolean) => {
    buffer = buffer.replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      readEvent(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
    if (flush && buffer.trim()) {
      readEvent(buffer);
      buffer = "";
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: !done });
      if (done) {
        buffer += decoder.decode();
        processEvents(true);
        break;
      }
      processEvents(false);
    }
  } finally {
    reader.releaseLock();
  }

  const finalText = translatedText.trim();
  if (!complete || !finalText) {
    throw new Error("The translation stream ended before it was complete.");
  }

  return { translatedText: finalText, alreadyInTargetLanguage };
}
