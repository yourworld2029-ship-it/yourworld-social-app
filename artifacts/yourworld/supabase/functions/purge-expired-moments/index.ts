import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase service configuration is missing");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function storagePathFromValue(value: unknown) {
  if (typeof value !== "string" || !value || /^(blob:|data:)/.test(value)) return null;
  if (!/^https?:\/\//.test(value)) return value;

  try {
    const pathname = decodeURIComponent(new URL(value).pathname);
    const marker = "/storage/v1/object/";
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const segments = pathname.slice(markerIndex + marker.length).split("/");
    const bucketIndex = segments.indexOf("moments");
    return bucketIndex >= 0 ? segments.slice(bucketIndex + 1).join("/") || null : null;
  } catch {
    return null;
  }
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

async function removeStoragePaths(paths: string[]) {
  for (let offset = 0; offset < paths.length; offset += 100) {
    const batch = paths.slice(offset, offset + 100);
    const { error } = await admin.storage.from("moments").remove(batch);
    if (error) throw new Error(`Moment media cleanup failed: ${error.message}`);
  }
}

async function removeInteractionRows(ids: string[]) {
  const tables: Array<[string, string]> = [
    ["moment_replies", "moment_id"],
    ["moment_views", "moment_id"],
    ["moment_likes", "moment_id"],
    ["likes", "post_id"],
    ["post_views", "post_id"],
  ];

  for (const [table, column] of tables) {
    const query = admin.from(table).delete().in(column, ids);
    const { error } = await query;
    if (error && !isMissingTable(error)) {
      throw new Error(`Moment interaction cleanup failed: ${error.message}`);
    }
  }

  const { error: uniqueViewsError } = await admin
    .from("unique_views")
    .delete()
    .in("content_id", ids)
    .eq("content_type", "moment");
  if (uniqueViewsError && !isMissingTable(uniqueViewsError)) {
    throw new Error(`Moment unique-view cleanup failed: ${uniqueViewsError.message}`);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "POST required" }, 405);

  const cutoff = new Date().toISOString();
  const { data: expired, error: selectError } = await admin
    .from("moments")
    .select("id, media_url, audio_url, payload")
    .lt("expires_at", cutoff)
    .limit(500);

  if (selectError) return json({ error: selectError.message }, 500);
  if (!expired?.length) {
    return json({ deletedMoments: 0, deletedMediaObjects: 0, skippedMoments: 0 });
  }

  const deletableIds: string[] = [];
  const skippedIds: string[] = [];
  const allMediaPaths = new Set<string>();

  for (const row of expired) {
    const payload =
      row.payload && typeof row.payload === "object"
        ? (row.payload as Record<string, unknown>)
        : {};
    const paths = [
      storagePathFromValue(row.media_url),
      storagePathFromValue(row.audio_url),
      storagePathFromValue(payload.musicUrl),
    ].filter((path): path is string => Boolean(path));

    try {
      await removeStoragePaths([...new Set(paths)]);
      paths.forEach((path) => allMediaPaths.add(path));
      deletableIds.push(row.id);
    } catch (error) {
      console.error("Skipping Moment whose media could not be removed", {
        id: row.id,
        error,
      });
      skippedIds.push(row.id);
    }
  }

  if (deletableIds.length) {
    await removeInteractionRows(deletableIds);
    const { error: deleteError } = await admin
      .from("moments")
      .delete()
      .in("id", deletableIds)
      .lt("expires_at", cutoff);
    if (deleteError) return json({ error: deleteError.message }, 500);
  }

  return json({
    deletedMoments: deletableIds.length,
    deletedMediaObjects: allMediaPaths.size,
    skippedMoments: skippedIds.length,
    skippedIds,
  });
});