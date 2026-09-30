import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

const nativeWebViewOrigin = "https://localhost";
const serverFnMethods = new Set(["GET", "POST"]);
const serverFnHeaders = new Set(["accept", "authorization", "content-type", "x-tsr-serverfn"]);

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function isServerFnRequest(request: Request): boolean {
  const { pathname } = new URL(request.url);
  return pathname === "/_serverFn" || pathname.startsWith("/_serverFn/");
}

function nativeServerFnCorsHeaders(): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": nativeWebViewOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Authorization, Content-Type, X-TSR-ServerFn",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  });
}

function handleServerFnPreflight(request: Request): Response {
  if (request.headers.get("Origin") !== nativeWebViewOrigin) {
    return new Response(null, { status: 403 });
  }

  const requestedMethod = request.headers
    .get("Access-Control-Request-Method")
    ?.toUpperCase();
  if (!requestedMethod || !serverFnMethods.has(requestedMethod)) {
    return new Response(null, { status: 403 });
  }

  const requestedHeaders = (request.headers.get("Access-Control-Request-Headers") ?? "")
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);
  if (requestedHeaders.some((header) => !serverFnHeaders.has(header))) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, { status: 204, headers: nativeServerFnCorsHeaders() });
}

function addNativeServerFnCors(request: Request, response: Response): Response {
  if (
    !isServerFnRequest(request) ||
    request.headers.get("Origin") !== nativeWebViewOrigin
  ) {
    return response;
  }

  const headers = new Headers(response.headers);
  for (const [name, value] of nativeServerFnCorsHeaders()) {
    headers.set(name, value);
  }
  const vary = new Set(
    (headers.get("Vary") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  vary.add("Origin");
  headers.set("Vary", [...vary].join(", "));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    if (isServerFnRequest(request) && request.method === "OPTIONS") {
      return handleServerFnPreflight(request);
    }

    let response: Response;
    try {
      const handler = await getServerEntry();
      response = await handler.fetch(request, env, ctx);
      response = await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      response = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return addNativeServerFnCors(request, response);
  },
};
