import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const nativeWebViewOrigin = "https://localhost";

const nativeServerFnFetch: typeof fetch = (input, init) => {
  if (typeof window === "undefined" || window.location.origin !== nativeWebViewOrigin) {
    return fetch(input, init);
  }

  const requestUrl = input instanceof Request ? input.url : String(input);
  const localUrl = new URL(requestUrl, window.location.origin);
  if (
    localUrl.origin !== nativeWebViewOrigin ||
    !localUrl.pathname.startsWith("/_serverFn/")
  ) {
    return fetch(input, init);
  }

  const hostedUrl = new URL(
    `${localUrl.pathname}${localUrl.search}`,
    import.meta.env.VITE_APP_URL,
  );
  const hostedInput =
    input instanceof Request ? new Request(hostedUrl, input) : hostedUrl.toString();
  return fetch(hostedInput, { ...init, credentials: "omit" });
};

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
  origin: (origin, ctx) =>
    origin === new URL(ctx.request.url).origin || origin === nativeWebViewOrigin,
  secFetchSite: (site, ctx) =>
    site === "same-origin" ||
    (site === "cross-site" && ctx.request.headers.get("Origin") === nativeWebViewOrigin),
});

export const startInstance = createStart(() => ({
  serverFns: { fetch: nativeServerFnFetch },
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
