import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";

// Controlled, self-cleaning live fixture. Never prints tokens, keys or signed URLs.
const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!base || !service || !publishable) throw new Error("Supabase test configuration is missing.");
if (new URL(base).hostname !== "pnpfybcdxynfooylxqou.supabase.co") throw new Error("The verified test project does not match runtime.");
const adminHeaders = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
const jsonRequest = async (path, method, body, headers = adminHeaders) => {
  const response = await fetch(`${base}${path}`, { method, headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Fixture request failed (${response.status}) at ${path.split("?")[0]}.`);
  return response.status === 204 ? null : response.json().catch(() => null);
};
const media = await readFile(process.argv[2] || "/tmp/yourworld-media-check.mp4");
const password = `${randomUUID()}Aa9!`;
const suffix = randomUUID();
const email = `media-check-${suffix}@example.com`;
let userId;
let objectPath;
let postIds = [];
try {
  const created = await jsonRequest("/auth/v1/admin/users", "POST", {
    email, password, email_confirm: true,
    user_metadata: { username: `media_${suffix.slice(0, 8)}`, full_name: "Media pipeline check" },
  });
  userId = created.id;
  if (!userId) throw new Error("Fixture identity was not created.");
  objectPath = `${userId}/media-check-${suffix}.mp4`;
  const upload = await fetch(`${base}/storage/v1/object/videos/${objectPath}`, {
    method: "POST", headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "video/mp4" }, body: media,
  });
  if (!upload.ok) throw new Error(`Fixture upload failed (${upload.status}).`);
  const sourceUrl = `${base}/storage/v1/object/public/videos/${objectPath}`;
  postIds = [randomUUID(), randomUUID()];
  await jsonRequest("/rest/v1/posts", "POST", postIds.map((id, index) => ({
    id, user_id: userId, kind: "video", caption: "Temporary media pipeline check",
    media_url: sourceUrl, media_type: "video/mp4", video_access: "public",
    allow_download: index === 0, thumbnail_url: null,
  })));
  const session = await jsonRequest("/auth/v1/token?grant_type=password", "POST", { email, password }, { apikey: publishable, "Content-Type": "application/json" });
  const api = process.env.MEDIA_CHECK_API || "http://localhost:80";
  const resolve = async (postId) => fetch(`${api}/api/media/offline-source`, {
    method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ postId, quality: "original" }),
  });
  const allowed = await resolve(postIds[0]);
  if (allowed.status !== 200) throw new Error(`Legacy download resolver returned ${allowed.status}.`);
  const payload = await allowed.json();
  if (!payload.url) throw new Error("Legacy download resolver returned no URL.");
  const saved = await fetch(payload.url);
  const bytes = Buffer.from(await saved.arrayBuffer());
  if (!saved.ok || !saved.headers.get("content-type")?.startsWith("video/") ||
    createHash("sha256").update(bytes).digest("hex") !== createHash("sha256").update(media).digest("hex")) {
    throw new Error("Resolved media did not match the playable source bytes.");
  }
  const blocked = await resolve(postIds[1]);
  if (blocked.status !== 403) throw new Error("Creator download denial was not preserved.");
  console.log(JSON.stringify({ legacySourceResolution: "PASS", fullDownloadByteMatch: "PASS", creatorDenial: "PASS", bytes: bytes.length }));
} finally {
  if (userId) {
    const failures = [];
    if (postIds.length) await jsonRequest(`/rest/v1/posts?user_id=eq.${userId}&id=in.(${postIds.join(",")})`, "DELETE").catch((error) => failures.push(error));
    if (objectPath) await jsonRequest("/storage/v1/object/videos", "DELETE", { prefixes: [objectPath] }).catch((error) => failures.push(error));
    await jsonRequest(`/auth/v1/admin/users/${userId}`, "DELETE").catch((error) => failures.push(error));
    if (failures.length) throw new Error(`Temporary fixture cleanup failed for ${failures.length} operation(s).`);
    console.log("Temporary fixture cleanup completed.");
  }
}