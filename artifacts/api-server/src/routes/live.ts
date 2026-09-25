import { Router, type IRouter } from "express";
import {
  GetPublicLiveStreamParams,
  GetPublicLiveStreamResponse,
  ListPublicLiveStreamsResponse,
} from "@workspace/api-zod";

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

function serviceHeaders(config: SupabaseConfig) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    Accept: "application/json",
  };
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

export default router;