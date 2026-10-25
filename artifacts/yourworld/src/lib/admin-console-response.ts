import type { AdminConsoleData } from "./admin-console.functions";

const ENVELOPE_KEYS = ["result", "data", "payload", "value", "response"] as const;

export function findAdminConsolePayload(value: unknown): AdminConsoleData | null {
  const queue: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  const seen = new Set<object>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > 12) continue;

    if (Array.isArray(current.value)) {
      for (const nested of current.value) {
        queue.push({ value: nested, depth: current.depth + 1 });
      }
      continue;
    }
    if (!current.value || typeof current.value !== "object") continue;

    const record = current.value as Record<string, unknown>;
    if (seen.has(record)) continue;
    seen.add(record);

    if (Array.isArray(record.userReports) && Array.isArray(record.copyrightReports)) {
      return record as unknown as AdminConsoleData;
    }

    for (const key of ENVELOPE_KEYS) {
      if (key in record && record[key] !== undefined && record[key] !== null) {
        queue.push({ value: record[key], depth: current.depth + 1 });
      }
    }
  }

  return null;
}

export function describeAdminResponseShape(value: unknown): string {
  const queue: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  const seen = new Set<object>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > 8) continue;
    if (Array.isArray(current.value)) {
      if (current.value.length) queue.push({ value: current.value[0], depth: current.depth + 1 });
      continue;
    }
    if (!current.value || typeof current.value !== "object") continue;

    const record = current.value as Record<string, unknown>;
    if (seen.has(record)) continue;
    seen.add(record);
    const keys = Object.keys(record);
    if (keys.some((key) => ENVELOPE_KEYS.includes(key as (typeof ENVELOPE_KEYS)[number]))) {
      for (const key of ENVELOPE_KEYS) {
        if (key in record) queue.push({ value: record[key], depth: current.depth + 1 });
      }
      continue;
    }
    return keys.slice(0, 12).join(", ") || "(empty object)";
  }

  return value === null ? "null" : typeof value;
}
