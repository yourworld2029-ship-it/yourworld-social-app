type SupabaseQueryFetchOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
};

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method.toUpperCase();
  }
  return "GET";
}

function isSupabaseRead(input: RequestInfo | URL, init?: RequestInit): boolean {
  const method = requestMethod(input, init);
  if (method !== "GET" && method !== "HEAD") return false;

  try {
    return /\/rest\/v1(?:\/|$)/.test(
      new URL(requestUrl(input), "http://localhost").pathname,
    );
  } catch {
    return false;
  }
}

function abortError(signal?: AbortSignal): Error {
  if (signal?.reason instanceof Error) return signal.reason;
  const error = new Error("The Supabase query was aborted.");
  error.name = "AbortError";
  return error;
}

function timeoutError(timeoutMs: number): Error {
  const error = new Error(`The Supabase query exceeded ${timeoutMs} ms.`);
  error.name = "TimeoutError";
  return error;
}

function waitForRetry(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError(signal));
  if (delayMs <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(abortError(signal));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchWithTimeout(
  fetcher: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
  callerSignal?: AbortSignal,
): Promise<Response> {
  if (callerSignal?.aborted) throw abortError(callerSignal);

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetcher(input, { ...init, signal: controller.signal });
    const body = await response.arrayBuffer();
    return new Response(
      [204, 205, 304].includes(response.status) ? null : body,
      {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
    );
  } catch (error) {
    if (timedOut) throw timeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}

/**
 * Bounds and retries only idempotent Supabase PostgREST reads. Mutations,
 * Storage transfers, auth requests, and media playback keep their current
 * transport behavior to avoid duplicate writes or interrupted media.
 */
export function withSupabaseQueryResilience(
  fetcher: typeof fetch = fetch,
  options: SupabaseQueryFetchOptions = {},
): typeof fetch {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 400;

  return async (input, init) => {
    if (!isSupabaseRead(input, init)) return fetcher(input, init);

    const callerSignal =
      init?.signal ??
      (typeof Request !== "undefined" && input instanceof Request
        ? input.signal
        : undefined);
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (callerSignal?.aborted) throw abortError(callerSignal);

      let response: Response | null = null;
      try {
        response = await fetchWithTimeout(
          fetcher,
          input,
          init,
          timeoutMs,
          callerSignal,
        );
      } catch (error) {
        if (callerSignal?.aborted) throw error;
        lastError = error;
        if (attempt === maxAttempts - 1) throw error;
      }

      if (response) {
        if (!RETRYABLE_STATUSES.has(response.status) || attempt === maxAttempts - 1) {
          return response;
        }
        await response.body?.cancel().catch(() => undefined);
      }

      const delayMs = Math.min(baseDelayMs * 2 ** attempt, 2_000);
      await waitForRetry(delayMs, callerSignal);
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Supabase query failed after retrying.");
  };
}
