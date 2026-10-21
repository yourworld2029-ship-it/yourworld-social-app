import { Router, type IRouter } from "express";
import {
  GetPublicLiveStreamParams,
  GetPublicLiveStreamResponse,
  ListPublicLiveStreamsResponse,
} from "@workspace/api-zod";
import { getLiveReplayStorageObjects } from "../lib/live-replay-storage";

const router: IRouter = Router();

const LIVE_STREAM_COLUMNS =
  "id,broadcaster_id,title,status,started_at,ended_at,peak_viewer_count";
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

type SupabaseConfig = {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
};

function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !publishableKey || !serviceRoleKey) return null;

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { url, publishableKey, serviceRoleKey };
}

function liveStreamsUrl(config: SupabaseConfig) {
  return new URL(`${config.url}/rest/v1/live_streams`);
}

function liveReplaysUrl(config: SupabaseConfig) {
  return new URL(`${config.url}/rest/v1/live_replays`);
}

function serviceHeaders(config: SupabaseConfig) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    Accept: "application/json",
  };
}

async function authenticateLiveReplayRequest(
  config: SupabaseConfig,
  authorization: string | undefined,
) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return null;
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  const user: unknown = await response.json().catch(() => null);
  return user && typeof user === "object" && "id" in user &&
    typeof user.id === "string" && UUID_PATTERN.test(user.id)
    ? user.id
    : null;
}

async function readLiveStreamRows(
  config: SupabaseConfig,
  query: Record<string, string>,
) {
  const url = liveStreamsUrl(config);
  url.searchParams.set("select", LIVE_STREAM_COLUMNS);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: serviceHeaders(config),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Supabase returned ${response.status}`);
  }

  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error("Supabase returned an invalid live-stream response");
  }
  return rows;
}

router.get("/live/streams", async (req, res) => {
  const config = supabaseConfig();
  if (!config) {
    req.log.error("Public live-stream discovery is missing Supabase configuration");
    res.status(502).json({ error: "Live streams are temporarily unavailable." });
    return;
  }

  try {
    const rows = await readLiveStreamRows(config, {
      status: "eq.live",
      order: "started_at.desc",
      limit: "100",
    });
    const parsed = ListPublicLiveStreamsResponse.safeParse(rows);
    if (!parsed.success) {
      req.log.error(
        { issues: parsed.error.issues },
        "Public live-stream response failed validation",
      );
      res.status(502).json({ error: "Live streams are temporarily unavailable." });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.json(parsed.data);
  } catch (cause) {
    req.log.error({ cause }, "Could not read public live streams");
    res.status(502).json({ error: "Live streams are temporarily unavailable." });
  }
});

router.get("/live/streams/:streamId", async (req, res) => {
  const params = GetPublicLiveStreamParams.safeParse(req.params);
  if (!params.success || !UUID_PATTERN.test(params.data.streamId)) {
    res.status(400).json({ error: "Invalid stream ID." });
    return;
  }

  const config = supabaseConfig();
  if (!config) {
    req.log.error("Public live-stream discovery is missing Supabase configuration");
    res.status(502).json({ error: "Live streams are temporarily unavailable." });
    return;
  }

  try {
    const rows = await readLiveStreamRows(config, {
      id: `eq.${params.data.streamId}`,
      status: "eq.live",
      limit: "1",
    });
    if (rows.length === 0) {
      res.status(404).json({ error: "Live stream is not active." });
      return;
    }

    const parsed = GetPublicLiveStreamResponse.safeParse(rows[0]);
    if (!parsed.success) {
      req.log.error(
        { issues: parsed.error.issues },
        "Public live-stream response failed validation",
      );
      res.status(502).json({ error: "Live streams are temporarily unavailable." });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.json(parsed.data);
  } catch (cause) {
    req.log.error({ cause }, "Could not read public live stream");
    res.status(502).json({ error: "Live streams are temporarily unavailable." });
  }
});

router.delete("/live/replays/:replayId", async (req, res) => {
  const replayId = req.params.replayId;
  if (!UUID_PATTERN.test(replayId)) {
    res.status(400).json({ error: "Invalid replay ID." });
    return;
  }

  const config = supabaseConfig();
  const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const cloudflareApiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN?.trim();
  if (!config) {
    res.status(502).json({ error: "Live replay storage is temporarily unavailable." });
    return;
  }

  let userId: string | null;
  try {
    userId = await authenticateLiveReplayRequest(
      config,
      req.get("authorization"),
    );
  } catch (cause) {
    req.log.warn({ cause }, "Could not validate live replay deletion session");
    res.status(502).json({ error: "Could not validate the sign-in session." });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "Sign in to manage this replay." });
    return;
  }

  try {
    const rowUrl = liveReplaysUrl(config);
    rowUrl.searchParams.set(
      "select",
      "id,broadcaster_id,stream_id,post_id,stream_uid,storage_bucket,source_path",
    );
    rowUrl.searchParams.set("id", `eq.${replayId}`);
    rowUrl.searchParams.set("broadcaster_id", `eq.${userId}`);
    rowUrl.searchParams.set("limit", "1");
    const rowResponse = await fetch(rowUrl, {
      headers: serviceHeaders(config),
      signal: AbortSignal.timeout(10_000),
    });
    if (!rowResponse.ok) throw new Error("Replay ownership could not be checked.");
    const rows: unknown = await rowResponse.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || typeof row !== "object") {
      res.status(404).json({ error: "This replay is no longer available." });
      return;
    }
    const replay = row as Record<string, unknown>;
    const streamUid = replay.stream_uid;
    if (replay.broadcaster_id !== userId) {
      res.status(403).json({ error: "You cannot delete this replay." });
      return;
    }

    if (
      typeof streamUid === "string" &&
      /^[a-zA-Z0-9_-]{8,128}$/.test(streamUid)
    ) {
      if (!cloudflareAccountId || !cloudflareApiToken) {
        req.log.warn(
          "Skipping Cloudflare live-replay cleanup because its credentials are unavailable",
        );
      } else {
        try {
          const streamResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cloudflareAccountId)}/stream/${encodeURIComponent(streamUid)}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${cloudflareApiToken}` },
              signal: AbortSignal.timeout(20_000),
            },
          );
          const streamPayload: unknown = await streamResponse.json().catch(() => null);
          const streamAlreadyMissing =
            streamResponse.status === 404 ||
            (streamPayload &&
              typeof streamPayload === "object" &&
              "errors" in streamPayload &&
              Array.isArray(streamPayload.errors) &&
              streamPayload.errors.some(
                (item) =>
                  item &&
                  typeof item === "object" &&
                  "code" in item &&
                  item.code === 10009,
              ));
          if (!streamResponse.ok && !streamAlreadyMissing) {
            req.log.warn(
              { status: streamResponse.status },
              "Cloudflare could not delete a live replay; continuing database cleanup",
            );
          }
        } catch (cause) {
          req.log.warn(
            { cause },
            "Cloudflare replay cleanup failed; continuing database cleanup",
          );
        }
      }
    }

    const storageObjects = getLiveReplayStorageObjects({
      ownerId: userId,
      storageBucket: replay.storage_bucket,
      sourcePath: replay.source_path,
      streamId: replay.stream_id,
    });
    const normalizedSourcePath =
      typeof replay.source_path === "string"
        ? replay.source_path.trim().replace(/^\/+/, "")
        : "";
    if (
      !storageObjects.some(
        (object) =>
          object.path === normalizedSourcePath ||
          `${object.bucket}/${object.path}` === normalizedSourcePath,
      )
    ) {
      req.log.warn(
        "Live replay source path is detached or invalid; skipping object cleanup",
      );
    }
    for (const object of storageObjects) {
      try {
        const storageResponse = await fetch(
          `${config.url}/storage/v1/object/${object.bucket}/${object.path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`,
          {
            method: "DELETE",
            headers: {
              apikey: config.serviceRoleKey,
              Authorization: `Bearer ${config.serviceRoleKey}`,
            },
            signal: AbortSignal.timeout(20_000),
          },
        );
        if (!storageResponse.ok && storageResponse.status !== 404) {
          req.log.warn(
            { bucket: object.bucket, status: storageResponse.status },
            "Could not remove a live-replay object; continuing database cleanup",
          );
        }
      } catch (cause) {
        req.log.warn(
          { bucket: object.bucket, cause },
          "Live-replay object cleanup failed; continuing database cleanup",
        );
      }
    }

    const postId = replay.post_id;
    if (typeof postId === "string" && UUID_PATTERN.test(postId)) {
      try {
        const postUrl = new URL(`${config.url}/rest/v1/posts`);
        postUrl.searchParams.set("id", `eq.${postId}`);
        postUrl.searchParams.set("user_id", `eq.${userId}`);
        const postResponse = await fetch(postUrl, {
          method: "DELETE",
          headers: { ...serviceHeaders(config), Prefer: "return=minimal" },
          signal: AbortSignal.timeout(10_000),
        });
        if (!postResponse.ok) {
          req.log.warn(
            { status: postResponse.status },
            "Could not remove the live replay's backing post",
          );
        }
      } catch (cause) {
        req.log.warn({ cause }, "Could not remove the live replay's backing post");
      }
    }

    const deleteUrl = liveReplaysUrl(config);
    deleteUrl.searchParams.set("id", `eq.${replayId}`);
    deleteUrl.searchParams.set("broadcaster_id", `eq.${userId}`);
    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: { ...serviceHeaders(config), Prefer: "return=minimal" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!deleteResponse.ok) throw new Error("Replay metadata could not be removed.");
    res.status(204).end();
  } catch (cause) {
    req.log.error({ cause }, "Could not delete live replay");
    res.status(502).json({ error: "The replay could not be deleted. Please try again." });
  }
});

export default router;