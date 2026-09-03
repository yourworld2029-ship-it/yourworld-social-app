type DbError = { code?: string; message?: string; details?: string | null };

const missingColumnPatterns = [
  /Could not find the '([^']+)' column/i,
  /column (?:[\w.]+\.)?["']?([\w]+)["']? does not exist/i,
];

export function missingColumn(error: DbError | null | undefined): string | null {
  const text = [error?.message, error?.details].filter(Boolean).join(" ");
  for (const pattern of missingColumnPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function postKind(row: Record<string, unknown>): "post" | "reel" | "video" {
  const explicit = row.kind ?? row.type;
  if (explicit === "reel" || explicit === "video") return explicit;
  if (
    Number(row.duration_seconds ?? 0) >= 90 ||
    (typeof row.title === "string" && row.title.trim().length > 0)
  ) {
    return "video";
  }
  return "post";
}

export function normalizePostRow<T extends Record<string, unknown>>(row: T) {
  return { ...row, kind: postKind(row) } as T & { kind: "post" | "reel" | "video" };
}

/**
 * Retries a write only when PostgREST explicitly reports a missing column.
 * This supports older, data-bearing schemas without resets or broad migrations.
 */
export async function writeCompat(
  write: (payload: Record<string, unknown>) => PromiseLike<{ error: DbError | null }>,
  initial: Record<string, unknown>,
  aliases: Record<string, string> = {},
) {
  const payload = { ...initial };
  const removed = new Set<string>();

  for (let attempt = 0; attempt <= Object.keys(initial).length; attempt += 1) {
    const result = await write(payload);
    if (!result.error) return result;

    const column = missingColumn(result.error);
    if (!column || removed.has(column) || !(column in payload)) return result;
    removed.add(column);

    const alias = aliases[column];
    const value = payload[column];
    delete payload[column];
    if (alias && !(alias in payload)) {
      payload[alias] = column === "kind" && value === "post" ? "story" : value;
    }
  }

  return write(payload);
}