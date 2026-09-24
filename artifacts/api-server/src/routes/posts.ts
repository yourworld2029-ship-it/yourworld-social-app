import {
  Router,
  type IRouter,
  type Request,
  type Response as ExpressResponse,
} from "express";
import {
  SetPostPinBody,
  SetPostPinParams,
  SetPostPinResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string | null;
};

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

type PostPinRow = {
  id?: unknown;
  pinned?: unknown;
};

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !serviceRoleKey) return null;

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { url, publishableKey, serviceRoleKey };
}

function bearerToken(header: string | undefined) {
  return header?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

async function authenticateUser(
  baseUrl: string,
  publishableKey: string,
  token: string,
) {
  const response = await fetch(`${baseUrl}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return null;

  const user: unknown = await response.json().catch(() => null);
  if (!user || typeof user !== "object" || !("id" in user)) return null;
  return typeof user.id === "string" ? user.id : null;
}

async function readError(response: FetchResponse): Promise<SupabaseError> {
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== "object") return {};
  const row = data as Record<string, unknown>;
  return {
    code: typeof row.code === "string" ? row.code : undefined,
    message: typeof row.message === "string" ? row.message : undefined,
    details: typeof row.details === "string" ? row.details : undefined,
  };
}

function missingPinnedColumn(error: SupabaseError) {
  const text = [error.code, error.message, error.details].filter(Boolean).join(" ");
  return (
    (error.code === "PGRST204" || error.code === "42703") &&
    /pinned/i.test(text)
  );
}

function pinLimitReached(error: SupabaseError) {
  return (
    error.code === "P0001" ||
    /pin at most 3 posts/i.test(error.message ?? "")
  );
}

function postgrestUrl(baseUrl: string, query: Record<string, string>) {
  const url = new URL(`${baseUrl}/rest/v1/posts`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return url;
}

function serviceHeaders(serviceRoleKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
  };
}

async function readRows(response: FetchResponse): Promise<PostPinRow[] | null> {
  const data: unknown = await response.json().catch(() => null);
  return Array.isArray(data) ? (data as PostPinRow[]) : null;
}

function sendSupabaseFailure(
  req: Request,
  res: ExpressResponse,
  status: number,
  error: SupabaseError,
) {
  if (missingPinnedColumn(error)) {
    res.status(503).json({
      error: "Post pinning is unavailable until the posts.pinned database migration is applied.",
    });
    return;
  }
  if (pinLimitReached(error)) {
    res.status(409).json({ error: "You can pin at most 3 posts to your profile grid." });
    return;
  }

  req.log.error(
    { status, code: error.code },
    "Supabase rejected the post pin update",
  );
  res.status(502).json({ error: "Could not update this post's pin state." });
}

router.patch("/posts/:postId/pin", async (req, res): Promise<void> => {
  const params = SetPostPinParams.safeParse(req.params);
  const parsedBody = SetPostPinBody.safeParse(req.body);
  if (!params.success || !parsedBody.success) {
    res.status(400).json({ error: "Provide a valid post ID and pin state." });
    return;
  }

  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }

  const config = supabaseConfig();
  if (!config) {
    req.log.error("Post pinning storage configuration is unavailable");
    res.status(502).json({ error: "Post pinning is temporarily unavailable." });
    return;
  }

  let userId: string | null;
  try {
    userId = await authenticateUser(config.url, config.publishableKey, token);
  } catch (error) {
    req.log.warn({ err: error }, "Supabase could not validate post pin user");
    res.status(502).json({ error: "Could not validate the current session." });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "The current session is no longer valid." });
    return;
  }

  const { postId } = params.data;
  const { pinned } = parsedBody.data;
  const headers = serviceHeaders(config.serviceRoleKey);

  try {
    const ownedPostResponse = await fetch(
      postgrestUrl(config.url, {
        select: "id,pinned",
        id: `eq.${postId}`,
        user_id: `eq.${userId}`,
        limit: "1",
      }),
      {
        headers,
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!ownedPostResponse.ok) {
      sendSupabaseFailure(
        req,
        res,
        ownedPostResponse.status,
        await readError(ownedPostResponse),
      );
      return;
    }

    const ownedRows = await readRows(ownedPostResponse);
    if (!ownedRows) {
      res.status(502).json({ error: "Supabase returned an invalid post response." });
      return;
    }
    const ownedPost = ownedRows[0];
    if (!ownedPost || ownedPost.id !== postId) {
      res.status(404).json({ error: "Post not found." });
      return;
    }
    if (typeof ownedPost.pinned !== "boolean") {
      req.log.error({ postId }, "Supabase returned an invalid post pin state");
      res.status(502).json({ error: "Supabase returned an invalid post pin state." });
      return;
    }

    if (ownedPost.pinned === pinned) {
      res.status(200).json(
        SetPostPinResponse.parse({ postId, pinned: ownedPost.pinned }),
      );
      return;
    }

    if (pinned) {
      const countResponse = await fetch(
        postgrestUrl(config.url, {
          select: "id",
          user_id: `eq.${userId}`,
          id: `neq.${postId}`,
          pinned: "eq.true",
          limit: "3",
        }),
        {
          headers,
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!countResponse.ok) {
        sendSupabaseFailure(
          req,
          res,
          countResponse.status,
          await readError(countResponse),
        );
        return;
      }
      const pinnedRows = await readRows(countResponse);
      if (!pinnedRows) {
        res.status(502).json({ error: "Supabase returned an invalid pin count." });
        return;
      }
      if (pinnedRows.length >= 3) {
        res.status(409).json({
          error: "You can pin at most 3 posts to your profile grid.",
        });
        return;
      }
    }

    const updateUrl = postgrestUrl(config.url, {
      select: "id,pinned",
      id: `eq.${postId}`,
      user_id: `eq.${userId}`,
    });
    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        ...serviceHeaders(config.serviceRoleKey),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ pinned }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!updateResponse.ok) {
      sendSupabaseFailure(
        req,
        res,
        updateResponse.status,
        await readError(updateResponse),
      );
      return;
    }

    const updatedRows = await readRows(updateResponse);
    if (!updatedRows) {
      res.status(502).json({ error: "Supabase returned an invalid pin update." });
      return;
    }
    const updatedPost = updatedRows[0];
    if (!updatedPost || updatedPost.id !== postId) {
      res.status(404).json({ error: "Post not found." });
      return;
    }
    if (typeof updatedPost.pinned !== "boolean") {
      res.status(502).json({ error: "Supabase returned an invalid post pin state." });
      return;
    }

    res.status(200).json(
      SetPostPinResponse.parse({ postId, pinned: updatedPost.pinned }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Post pin update failed");
    res.status(502).json({ error: "Could not update this post's pin state." });
  }
});

export default router;