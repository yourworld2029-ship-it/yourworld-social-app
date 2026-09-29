export type ExternalTextLink = {
  start: number;
  end: number;
  text: string;
  href: string;
};

export type ExternalLinkPlatform = "youtube" | "instagram" | "web";

export type ExternalLinkPresentation = {
  platform: ExternalLinkPlatform;
  domain: string;
};

const URL_CANDIDATE_PATTERN =
  /(?:https?:\/\/|\/\/)[^\s<>"'`]+|www\.[^\s<>"'`]+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?(?:[/?#][^\s<>"'`]*)?/giu;

function countCharacter(value: string, character: string) {
  return [...value].filter((part) => part === character).length;
}

function trimTrailingPunctuation(value: string) {
  let result = value;
  const closingToOpening: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  while (result) {
    const withoutPunctuation = result.replace(/[.,!?;:…。]+$/u, "");
    if (withoutPunctuation !== result) {
      result = withoutPunctuation;
      continue;
    }

    const closing = result.at(-1);
    const opening = closing ? closingToOpening[closing] : undefined;
    if (
      opening &&
      countCharacter(result, closing!) > countCharacter(result, opening)
    ) {
      result = result.slice(0, -1);
      continue;
    }
    break;
  }

  return result;
}

/** Finds safe HTTP(S) links, including bare hostnames and www-prefixed URLs. */
export function extractExternalTextLinks(text: string): ExternalTextLink[] {
  const links: ExternalTextLink[] = [];

  for (const match of text.matchAll(URL_CANDIDATE_PATTERN)) {
    const start = match.index;
    if (start === undefined) continue;

    const previousCharacter = text[start - 1];
    if (previousCharacter && /[a-z0-9_@.-]/i.test(previousCharacter)) continue;

    const prefix = text.slice(0, start);
    const schemePrefix = prefix.match(/([a-z][a-z0-9+.-]*:)$/i)?.[1];
    if (schemePrefix && !/^https?:$/i.test(schemePrefix)) {
      continue;
    }

    const candidate = trimTrailingPunctuation(match[0]);
    if (!candidate) continue;

    const hrefCandidate = candidate.startsWith("//")
      ? `https:${candidate}`
      : /^https?:\/\//i.test(candidate)
        ? candidate
        : `https://${candidate}`;

    try {
      const parsed = new URL(hrefCandidate);
      if (
        (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
        !parsed.hostname
      ) {
        continue;
      }

      links.push({
        start,
        end: start + candidate.length,
        text: candidate,
        href: parsed.href,
      });
    } catch {
      // Ignore incomplete or malformed URL-looking text.
    }
  }

  return links;
}

export function getExternalLinkPresentation(href: string): ExternalLinkPresentation | null {
  try {
    const parsed = new URL(href);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !parsed.hostname
    ) {
      return null;
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const platform: ExternalLinkPlatform =
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com"
        ? "youtube"
        : hostname === "instagram.com" || hostname.endsWith(".instagram.com")
          ? "instagram"
          : "web";

    return {
      platform,
      domain: parsed.hostname.replace(/^www\./i, ""),
    };
  } catch {
    return null;
  }
}