import { supabase } from "@/integrations/supabase/client";
import { mediaApiUrl } from "@/lib/media-api-url";
import type { AppLanguage } from "@/lib/app-language";

export type CommentTranslation = {
  translatedText: string;
  alreadyInTargetLanguage: boolean;
};

const translationCache = new Map<string, CommentTranslation>();

export async function translateComment(
  text: string,
  targetLanguage: AppLanguage,
): Promise<CommentTranslation> {
  const cacheKey = `${targetLanguage}\u0000${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) {
    throw new Error("Sign in to translate comments.");
  }

  const response = await fetch(mediaApiUrl("/api/translate-comment"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text, targetLanguage }),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== "object") {
    throw new Error("The translation service could not complete the request.");
  }

  const translatedText =
    "translatedText" in result && typeof result.translatedText === "string"
      ? result.translatedText
      : null;
  const alreadyInTargetLanguage =
    "alreadyInTargetLanguage" in result &&
    typeof result.alreadyInTargetLanguage === "boolean"
      ? result.alreadyInTargetLanguage
      : null;
  if (!translatedText || alreadyInTargetLanguage === null) {
    throw new Error("The translation service returned an invalid response.");
  }

  const translation = { translatedText, alreadyInTargetLanguage };
  translationCache.set(cacheKey, translation);
  if (translationCache.size > 300) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey) translationCache.delete(oldestKey);
  }
  return translation;
}
