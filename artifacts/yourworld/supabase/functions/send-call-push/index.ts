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
  avatarUrl?: string | null;
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

  // A Secret Lock is recipient-specific. Suppress the OS push before it can
  // wake the service worker, reveal caller details, or vibrate the device.
  const { data: conversations, error: conversationError } = await admin
    .from("conversations")
    .select("id")
    .or(
      `and(participant_one_id.eq.${call.receiver_id},participant_two_id.eq.${call.caller_id}),and(participant_two_id.eq.${call.receiver_id},participant_one_id.eq.${call.caller_id})`,
    );
  if (conversationError) {
    return response({ error: "Could not verify recipient chat privacy" }, 503);
  }
  const conversationIds = (conversations ?? []).map((conversation) => conversation.id);
  if (conversationIds.length) {
    const { data: preferences, error: preferenceError } = await admin
      .from("conversation_preferences")
      .select("is_locked,secret_pin_salt,secret_pin_hash")
      .in("conversation_id", conversationIds)
      .eq("user_id", call.receiver_id)
      .eq("is_locked", true);
    if (preferenceError) {
      return response({ error: "Could not verify recipient chat privacy" }, 503);
    }
    const hasLockedPreference = (preferences ?? []).some(
      (preference) =>
        typeof preference.secret_pin_salt === "string" &&
        preference.secret_pin_salt.length > 0 &&
        typeof preference.secret_pin_hash === "string" &&
        preference.secret_pin_hash.length > 0,
    );
    if (hasLockedPreference) {
      return response({ delivered: 0, attempted: 0, suppressed: true });
    }
  }

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("call_push_subscriptions")
    .select("id, subscription")
    .eq("user_id", payload.receiverId)
    .eq("provider", "webpush");
  if (subscriptionsError) return response({ error: "Could not load push subscriptions" }, 500);

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const pushPayload = JSON.stringify({
    data: {
      type: "call",
      callId: payload.callId,
      mode: payload.mode,
      peerName: payload.peerName,
      avatarUrl: payload.avatarUrl ?? null,
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