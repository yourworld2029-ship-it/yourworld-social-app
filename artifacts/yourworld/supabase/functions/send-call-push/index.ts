import { createClient } from "https://esm.sh/@supabase/supabase-js@2.111.0";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CallPushRequest = {
  callId?: string;
  receiverId?: string;
  mode?: "audio" | "video";
  peerName?: string;
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return response({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("WEB_PUSH_VAPID_SUBJECT") ?? "mailto:security@yourworld.app";
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return response({ error: "Push delivery is not configured" }, 503);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return response({ error: "Invalid session" }, 401);

  let payload: CallPushRequest;
  try {
    payload = await request.json();
  } catch {
    return response({ error: "Invalid JSON body" }, 400);
  }
  if (
    !payload.callId ||
    !payload.receiverId ||
    !payload.peerName ||
    (payload.mode !== "audio" && payload.mode !== "video")
  ) {
    return response({ error: "callId, receiverId, peerName, and mode are required" }, 400);
  }
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: call, error: callError } = await admin
    .from("calls")
    .select("id, caller_id, receiver_id, call_type, status")
    .eq("id", payload.callId)
    .maybeSingle();
  if (
    callError ||
    !call ||
    call.caller_id !== authData.user.id ||
    call.receiver_id !== payload.receiverId ||
    call.status !== "ringing"
  ) {
    return response({ error: "Call is not available" }, 404);
  }

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("call_push_subscriptions")
    .select("id, subscription")
    .eq("user_id", payload.receiverId);
  if (subscriptionsError) return response({ error: "Could not load push subscriptions" }, 500);

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const pushPayload = JSON.stringify({
    data: {
      type: "call",
      callId: payload.callId,
      mode: payload.mode,
      peerName: payload.peerName,
      url: "/",
    },
  });
  let delivered = 0;
  await Promise.all(
    (subscriptions ?? []).map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, pushPayload, {
          TTL: 45,
          urgency: "high",
        });
        delivered += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("call_push_subscriptions").delete().eq("id", row.id);
        } else {
          console.error("[send-call-push] provider delivery failed", statusCode ?? "unknown");
        }
      }
    }),
  );

  return response({ delivered, attempted: subscriptions?.length ?? 0 });
});