import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase service configuration.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ALLOWED_BUCKETS = new Set([
  "messages",
  "voice_notes",
  "avatars",
  "media",
  "videos",
  "public",
]);
const MOMENT_BUCKETS = new Set(["moments"]);
const BATCH_SIZE = 100;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SocialRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  media_url: string | null;
  voice_note_url: string | null;
  metadata: Record<string, unknown> | null;
  is_deleted: boolean | null;
  expires_at: string | null;
};

type DirectRow = {
  id: string;
  sender_id: string;
  media_url: string | null;
  expires_at: string | null;
};

type StorageObject = { bucket: string; path: string };
type CleanupFailureStage = "reference" | "storage" | "database" | "unexpected";

function decodeSegments(path: string) {
  return path.split("/").map((segment) => decodeURIComponent(segment));
}

function objectFromUrl(
  value: string | null,
  allowedBuckets: ReadonlySet<string> = ALLOWED_BUCKETS,
): StorageObject | null {
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.host !== new URL(supabaseUrl).host) return null;

  const match = url.pathname.match(
    /^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/,
  );
  if (!match) return null;

  const bucket = decodeURIComponent(match[1]);
  const segments = decodeSegments(match[2]);
  if (
    !allowedBuckets.has(bucket) ||
    segments.length < 2 ||
    segments.length > 3 ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Chat media Storage path is outside the approved layout.");
  }
  return { bucket, path: segments.join("/") };
}

function isSharedMomentReference(row: SocialRow) {
  const metadata = row.metadata ?? {};
  const url = row.media_url;
  if (
    metadata.type !== "moment_reply" ||
    metadata.view_once === true ||
    typeof metadata.moment_id !== "string" ||
    !UUID_PATTERN.test(metadata.moment_id) ||
    !url ||
    metadata.moment_media_url !== url
  ) {
    return false;
  }

  const object = objectFromUrl(url, MOMENT_BUCKETS);
  if (!object) return false;
  const segments = decodeSegments(object.path);
  if (
    segments.length !== 2 ||
    !UUID_PATTERN.test(segments[0]) ||
    !/^[a-z0-9_-]+-\d+-[a-z0-9]{6}\.[a-z0-9]{1,8}$/i.test(segments[1])
  ) {
    throw new Error("The shared Moment Storage path failed validation.");
  }
  return true;
}

function socialObject(
  row: SocialRow,
  kind: "image" | "audio",
): StorageObject | null {
  if (isSharedMomentReference(row)) return null;
  const expectedBucket = kind === "audio" ? "voice_notes" : "messages";
  const rawUrl = kind === "audio" ? row.voice_note_url : row.media_url;
  const declaredBucket = row.metadata?.media_bucket;
  const declaredPath = row.metadata?.media_path;
  if (
    !rawUrl &&
    (typeof declaredBucket !== "string" || declaredBucket !== expectedBucket) &&
    typeof declaredPath !== "string"
  ) {
    return null;
  }
  const urlObject = objectFromUrl(rawUrl);
  const bucket = typeof declaredBucket === "string" ? declaredBucket : urlObject?.bucket;
  const rawPath =
    typeof declaredPath === "string"
      ? declaredPath
      : urlObject?.path;
  if (!bucket || !rawPath) return null;
  if (bucket !== expectedBucket) {
    throw new Error("Social Chat media bucket does not match its type.");
  }

  const segments = decodeSegments(rawPath);
  const thread = `dm_${[row.sender_id, row.receiver_id].sort().join("_")}`;
  const filePattern =
    kind === "audio"
      ? /^voice-\d+\.webm$/
      : /^image-\d+\.(?:jpg|jpeg|png|webp)$/i;
  if (
    segments.length !== 3 ||
    segments[0] !== row.sender_id ||
    segments[1] !== thread ||
    !filePattern.test(segments[2]) ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Social Chat Storage path failed validation.");
  }
  return { bucket, path: segments.join("/") };
}

async function removeObject(object: StorageObject | null) {
  if (!object) return;
  const { error } = await admin.storage.from(object.bucket).remove([object.path]);
  if (!error) return;
  const status = Number((error as { statusCode?: string }).statusCode);
  if (status === 404) return;
  throw error;
}

async function deleteRow(table: string, id: string) {
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) throw error;
}

async function loadSocialCandidates(now: string) {
  const [expired, deleted] = await Promise.all([
    admin
      .from("messages")
      .select("id,sender_id,receiver_id,media_url,voice_note_url,metadata,is_deleted,expires_at")
      .not("expires_at", "is", null)
      .lte("expires_at", now)
      .limit(BATCH_SIZE),
    admin
      .from("messages")
      .select("id,sender_id,receiver_id,media_url,voice_note_url,metadata,is_deleted,expires_at")
      .eq("is_deleted", true)
      .limit(BATCH_SIZE),
  ]);
  if (expired.error) throw expired.error;
  if (deleted.error) throw deleted.error;
  const rows = new Map<string, SocialRow>();
  for (const row of [...(expired.data ?? []), ...(deleted.data ?? [])] as SocialRow[]) {
    rows.set(row.id, row);
  }
  return [...rows.values()].slice(0, BATCH_SIZE);
}

async function processSocial(row: SocialRow): Promise<CleanupFailureStage | null> {
  let image: StorageObject | null;
  let audio: StorageObject | null;
  try {
    image = socialObject(row, "image");
    audio = socialObject(row, "audio");
  } catch {
    return "reference";
  }

  try {
    await removeObject(image);
    await removeObject(audio);
  } catch {
    return "storage";
  }

  try {
    await deleteRow("messages", row.id);
  } catch {
    return "database";
  }
  return null;
}

async function processDirect(row: DirectRow): Promise<CleanupFailureStage | null> {
  let object: StorageObject | null;
  try {
    object = objectFromUrl(row.media_url);
  } catch {
    return "reference";
  }
  try {
    await removeObject(object);
  } catch {
    return "storage";
  }
  try {
    await deleteRow("direct_messages", row.id);
  } catch {
    return "database";
  }
  return null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const token = request.headers.get("x-retention-token");
  if (!token) return new Response("Unauthorized", { status: 401 });
  const { data: authorized, error: authorizationError } = await admin.rpc(
    "verify_chat_retention_token",
    { _candidate: token },
  );
  if (authorizationError || authorized !== true) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date().toISOString();
  let deleted = 0;
  let failures = 0;
  const failureStages: Record<CleanupFailureStage, number> = {
    reference: 0,
    storage: 0,
    database: 0,
    unexpected: 0,
  };
  const recordResult = (failure: CleanupFailureStage | null) => {
    if (!failure) {
      deleted += 1;
      return;
    }
    failures += 1;
    failureStages[failure] += 1;
  };

  const socialRows = await loadSocialCandidates(now);
  for (const row of socialRows) {
    try {
      recordResult(await processSocial(row));
    } catch {
      recordResult("unexpected");
    }
  }

  const directRows = await admin
    .from("direct_messages")
    .select("id,sender_id,media_url,expires_at")
    .not("expires_at", "is", null)
    .lte("expires_at", now)
    .limit(BATCH_SIZE);
  if (directRows.error) throw directRows.error;

  for (const row of (directRows.data ?? []) as DirectRow[]) {
    try {
      recordResult(await processDirect(row));
    } catch {
      recordResult("unexpected");
    }
  }

  return Response.json({ deleted, failures, failureStages });
});