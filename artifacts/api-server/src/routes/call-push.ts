import { createSign } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  RegisterIncomingCallPushBody,
  RegisterIncomingCallPushResponse,
  SendIncomingCallPushBody,
  SendIncomingCallPushResponse,
  SendMessagePushBody,
  SendMessagePushResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type FetchResponse = Awaited<ReturnType<typeof fetch>>;
type JsonObject = Record<string, unknown>;
type SupabaseConfig = {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
};
type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
};
type CallRow = {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: "audio" | "video";
  status: string;
};
type CallPushAction = "ring" | "dismiss";
type ConversationRow = { id: string };
type PreferenceRow = {
  is_muted?: boolean | null;
  is_locked?: boolean | null;
  secret_pin_salt?: string | null;
  secret_pin_hash?: string | null;
  screenshot_alert?: boolean | null;
  screen_recording_alert?: boolean | null;
};
type ProfileRow = {
  display_name?: string | null;
  username?: string | null;
};
type CaptureConversationRow = {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  protect_chat_enabled?: boolean;
};
type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  conversation_id: string | null;
  is_system_message?: boolean | null;
};
type MessageConversationRow = {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
};
type SubscriptionRow = {
  id: string;
  endpoint: string;
  subscription: unknown;
};

let cachedGoogleToken: { token: string; expiresAt: number } | null = null;

function supabaseConfig(): SupabaseConfig | null {
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

function serviceHeaders(serviceRoleKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
  };
}

function postgrestUrl(
  baseUrl: string,
  table: string,
  query: Record<string, string>,
) {
  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function authenticateUser(
  config: SupabaseConfig,
  token: string,
): Promise<string | null> {
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return null;
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== "object" || !("id" in data)) return null;
  return typeof data.id === "string" ? data.id : null;
}

async function readRows<T>(
  config: SupabaseConfig,
  table: string,
  query: Record<string, string>,
): Promise<T[]> {
  const response = await fetch(postgrestUrl(config.url, table, query), {
    headers: serviceHeaders(config.serviceRoleKey),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Supabase ${table} query failed with status ${response.status}.`);
  }
  const data: unknown = await response.json().catch(() => null);
  if (!Array.isArray(data)) {
    throw new Error(`Supabase ${table} returned an invalid response.`);
  }
  return data as T[];
}

async function deleteSubscription(config: SupabaseConfig, id: string) {
  const response = await fetch(
    postgrestUrl(config.url, "call_push_subscriptions", { id: `eq.${id}` }),
    {
      method: "DELETE",
      headers: serviceHeaders(config.serviceRoleKey),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase subscription cleanup failed with status ${response.status}.`);
  }
}

async function registerFcmToken(
  config: SupabaseConfig,
  userId: string,
  token: string,
  userAgent: string,
) {
  const endpoint = `fcm:${token}`;
  const deleteResponse = await fetch(
    postgrestUrl(config.url, "call_push_subscriptions", {
      endpoint: `eq.${endpoint}`,
      provider: "eq.fcm",
    }),
    {
      method: "DELETE",
      headers: serviceHeaders(config.serviceRoleKey),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!deleteResponse.ok) {
    throw new Error(`Could not replace previous FCM registration (${deleteResponse.status}).`);
  }

  const response = await fetch(`${config.url}/rest/v1/call_push_subscriptions`, {
    method: "POST",
    headers: {
      ...serviceHeaders(config.serviceRoleKey),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      endpoint,
      provider: "fcm",
      subscription: { token },
      user_agent: userAgent.slice(0, 500),
      last_seen_at: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Could not save FCM registration (${response.status}).`);
  }
}

function serviceAccount(): ServiceAccount | null {
  const value = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const row = parsed as JsonObject;
    if (
      typeof row.client_email !== "string" ||
      typeof row.private_key !== "string" ||
      typeof row.project_id !== "string"
    ) {
      return null;
    }
    return {
      client_email: row.client_email,
      private_key: row.private_key.replace(/\\n/g, "\n"),
      project_id: row.project_id,
    };
  } catch {
    return null;
  }
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function getGoogleAccessToken(account: ServiceAccount): Promise<string> {
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + 60_000) {
    return cachedGoogleToken.token;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const jwtHeader = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const jwtPayload = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: FCM_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  const unsignedToken = `${jwtHeader}.${jwtPayload}`;
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .end()
    .sign(account.private_key);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const data: unknown = await response.json().catch(() => null);
  if (
    !response.ok ||
    !data ||
    typeof data !== "object" ||
    !("access_token" in data) ||
    typeof data.access_token !== "string"
  ) {
    throw new Error(`Google OAuth token exchange failed with status ${response.status}.`);
  }
  const expiresIn =
    "expires_in" in data && typeof data.expires_in === "number"
      ? data.expires_in
      : 3600;
  cachedGoogleToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return data.access_token;
}

function tokenFromSubscription(row: SubscriptionRow): string | null {
  if (row.subscription && typeof row.subscription === "object") {
    const token = (row.subscription as JsonObject).token;
    if (typeof token === "string" && token.length > 0) return token;
  }
  return row.endpoint.startsWith("fcm:") ? row.endpoint.slice(4) : null;
}

async function sendFcmCall(
  account: ServiceAccount,
  accessToken: string,
  deviceToken: string,
  call: CallRow,
  peerName: string | null,
  action: CallPushAction,
) {
  const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        data: action === "dismiss"
          ? { type: "call-dismiss", callId: call.id }
          : {
              type: "call",
              callId: call.id,
              mode: call.call_type,
              peerName: peerName ?? "YourWorld caller",
            },
        android: {
          priority: "HIGH",
          ttl: "30s",
          collapseKey: `yourworld-call-${call.id}`,
        },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const result: unknown = await response.json().catch(() => null);
  if (response.ok) return { delivered: true, unregistered: false };
  const error =
    result && typeof result === "object" && "error" in result
      ? (result as JsonObject).error
      : null;
  const details =
    error && typeof error === "object" && "details" in error
      ? (error as JsonObject).details
      : null;
  const unregistered =
    Array.isArray(details) &&
    details.some(
      (detail) =>
        !!detail &&
        typeof detail === "object" &&
        "errorCode" in detail &&
        detail.errorCode === "UNREGISTERED",
    );
  return { delivered: false, unregistered, status: response.status };
}

router.post("/calls/push/register", async (req, res): Promise<void> => {
  const parsedBody = RegisterIncomingCallPushBody.safeParse(req.body);
  if (
    !parsedBody.success ||
    !/^[\x21-\x7e]{16,4096}$/.test(parsedBody.data.token)
  ) {
    res.status(400).json({ error: "Provide a valid Android push token." });
    return;
  }

  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }

  const config = supabaseConfig();
  if (!config) {
    req.log.error("Android call push registration is missing Supabase configuration");
    res.status(502).json({ error: "Could not save call notification settings." });
    return;
  }

  let userId: string | null;
  try {
    userId = await authenticateUser(config, token);
  } catch (cause) {
    req.log.warn({ cause }, "Supabase could not validate Android push registration");
    res.status(502).json({ error: "Could not validate the current session." });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "The current session is no longer valid." });
    return;
  }

  try {
    await registerFcmToken(
      config,
      userId,
      parsedBody.data.token,
      req.get("user-agent") ?? "",
    );
  } catch (cause) {
    req.log.error({ cause }, "Could not save Android call push registration");
    res.status(502).json({ error: "Could not save call notification settings." });
    return;
  }

  res.json(RegisterIncomingCallPushResponse.parse({ registered: true }));
});

router.post("/calls/push", async (req, res): Promise<void> => {
  const parsedBody = SendIncomingCallPushBody.safeParse(req.body);
  if (!parsedBody.success || !UUID_PATTERN.test(parsedBody.data.callId)) {
    res.status(400).json({ error: "Provide a valid call ID." });
    return;
  }

  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }

  const config = supabaseConfig();
  if (!config) {
    req.log.error("Incoming call push is missing Supabase configuration");
    res.status(503).json({ error: "Incoming call notifications are not configured." });
    return;
  }

  let callerId: string | null;
  try {
    callerId = await authenticateUser(config, token);
  } catch (cause) {
    req.log.warn({ cause }, "Supabase could not validate the incoming call push user");
    res.status(502).json({ error: "Could not validate the current session." });
    return;
  }
  if (!callerId) {
    res.status(401).json({ error: "The current session is no longer valid." });
    return;
  }

  const action: CallPushAction = parsedBody.data.action ?? "ring";
  let call: CallRow | undefined;
  try {
    const calls = await readRows<CallRow>(config, "calls", {
      select: "id,caller_id,receiver_id,call_type,status",
      id: `eq.${parsedBody.data.callId}`,
      limit: "1",
    });
    call = calls[0];
  } catch (cause) {
    req.log.error({ cause }, "Could not verify incoming call push ownership");
    res.status(502).json({ error: "Could not verify this call." });
    return;
  }
  if (
    !call ||
    !UUID_PATTERN.test(call.caller_id) ||
    !UUID_PATTERN.test(call.receiver_id) ||
    (call.call_type !== "audio" && call.call_type !== "video") ||
    (action === "ring" && (call.caller_id !== callerId || call.status !== "ringing")) ||
    (action === "dismiss" && callerId !== call.caller_id && callerId !== call.receiver_id)
  ) {
    res.status(404).json({ error: "Call is not available." });
    return;
  }

  const recipientId = callerId === call.caller_id ? call.receiver_id : call.caller_id;

  if (action === "ring") {
    let conversations: ConversationRow[];
    try {
      conversations = await readRows<ConversationRow>(config, "conversations", {
        select: "id",
        or: `and(participant_one_id.eq.${call.receiver_id},participant_two_id.eq.${call.caller_id}),and(participant_two_id.eq.${call.receiver_id},participant_one_id.eq.${call.caller_id})`,
        limit: "20",
      });
    } catch (cause) {
      req.log.error({ cause }, "Could not verify incoming call chat privacy");
      res.status(503).json({ error: "Could not verify chat privacy." });
      return;
    }
    if (conversations.length > 0) {
      let preferences: PreferenceRow[];
      try {
        preferences = await readRows<PreferenceRow>(config, "conversation_preferences", {
          select: "secret_pin_salt,secret_pin_hash",
          conversation_id: `in.(${conversations.map((row) => row.id).join(",")})`,
          user_id: `eq.${call.receiver_id}`,
          is_locked: "eq.true",
          limit: "20",
        });
      } catch (cause) {
        req.log.error({ cause }, "Could not verify incoming call Secret Lock state");
        res.status(503).json({ error: "Could not verify chat privacy." });
        return;
      }
      const hasSecretLock = preferences.some(
        (preference) =>
          typeof preference.secret_pin_salt === "string" &&
          preference.secret_pin_salt.length > 0 &&
          typeof preference.secret_pin_hash === "string" &&
          preference.secret_pin_hash.length > 0,
      );
      if (hasSecretLock) {
        res.json(SendIncomingCallPushResponse.parse({ delivered: 0, suppressed: true }));
        return;
      }
    }
  }

  const account = serviceAccount();
  if (!account) {
    req.log.error("FCM service account is missing or invalid");
    res.status(503).json({ error: "Incoming call notifications are not configured." });
    return;
  }

  let subscriptions: SubscriptionRow[];
  let profiles: ProfileRow[] = [];
  try {
    subscriptions = await readRows<SubscriptionRow>(config, "call_push_subscriptions", {
        select: "id,endpoint,subscription",
        user_id: `eq.${recipientId}`,
        provider: "eq.fcm",
        limit: "50",
      });
    if (action === "ring") {
      profiles = await readRows<ProfileRow>(config, "profiles", {
        select: "display_name,username",
        id: `eq.${call.caller_id}`,
        limit: "1",
      });
    }
  } catch (cause) {
    req.log.error({ cause }, "Could not load incoming call push recipients");
    res.status(502).json({ error: "Could not load call notification devices." });
    return;
  }

  const deviceTokens = Array.from(
    new Set(
      subscriptions
        .map(tokenFromSubscription)
        .filter((value): value is string => value !== null),
    ),
  );
  if (deviceTokens.length === 0) {
    res.json(SendIncomingCallPushResponse.parse({ delivered: 0, suppressed: false }));
    return;
  }

  const peerName = action === "ring"
    ? profiles[0]?.display_name?.trim() || profiles[0]?.username?.trim() || "YourWorld caller"
    : null;

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken(account);
  } catch (cause) {
    req.log.error({ cause }, "Could not obtain FCM authorization");
    res.status(502).json({ error: "Could not authorize call notification delivery." });
    return;
  }

  let delivered = 0;
  await Promise.all(
    deviceTokens.map(async (deviceToken) => {
      try {
        const result = await sendFcmCall(account, accessToken, deviceToken, call, peerName, action);
        if (result.delivered) {
          delivered += 1;
        } else if (result.unregistered) {
          const subscription = subscriptions.find(
            (row) => tokenFromSubscription(row) === deviceToken,
          );
          if (subscription) await deleteSubscription(config, subscription.id);
        } else {
          req.log.warn(
            { status: result.status },
            "FCM did not accept a call push",
          );
        }
      } catch (cause) {
        req.log.warn({ cause }, "FCM call push delivery failed");
      }
    }),
  );

  res.json(SendIncomingCallPushResponse.parse({ delivered, suppressed: false }));
});

router.post("/messages/push", async (req, res): Promise<void> => {
  const parsedBody = SendMessagePushBody.safeParse(req.body);
  if (!parsedBody.success || !UUID_PATTERN.test(parsedBody.data.messageId)) {
    res.status(400).json({ error: "Provide a valid message ID." });
    return;
  }

  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }

  const config = supabaseConfig();
  if (!config) {
    req.log.error("Chat message push is missing Supabase configuration");
    res.status(503).json({ error: "Message notifications are not configured." });
    return;
  }

  let senderId: string | null;
  try {
    senderId = await authenticateUser(config, token);
  } catch (cause) {
    req.log.warn({ cause }, "Supabase could not validate the message push user");
    res.status(502).json({ error: "Could not validate the current session." });
    return;
  }
  if (!senderId) {
    res.status(401).json({ error: "The current session is no longer valid." });
    return;
  }

  let message: MessageRow | undefined;
  try {
    const messages = await readRows<MessageRow>(config, "messages", {
      select: "id,sender_id,receiver_id,conversation_id,is_system_message",
      id: `eq.${parsedBody.data.messageId}`,
      sender_id: `eq.${senderId}`,
      limit: "1",
    });
    message = messages[0];
  } catch (cause) {
    req.log.error({ cause }, "Could not verify chat message push ownership");
    res.status(502).json({ error: "Could not verify this message." });
    return;
  }
  if (
    !message ||
    !UUID_PATTERN.test(message.receiver_id) ||
    message.receiver_id === senderId ||
    !message.conversation_id ||
    !UUID_PATTERN.test(message.conversation_id)
  ) {
    res.status(404).json({ error: "Message is not available." });
    return;
  }
  if (message.is_system_message === true) {
    res.json(SendMessagePushResponse.parse({ delivered: 0, suppressed: true }));
    return;
  }

  let conversation: MessageConversationRow | undefined;
  let preferences: PreferenceRow[];
  try {
    const conversations = await readRows<MessageConversationRow>(config, "conversations", {
      select: "id,participant_one_id,participant_two_id",
      id: `eq.${message.conversation_id}`,
      limit: "1",
    });
    conversation = conversations[0];
    if (
      !conversation ||
      !(
        (conversation.participant_one_id === senderId &&
          conversation.participant_two_id === message.receiver_id) ||
        (conversation.participant_two_id === senderId &&
          conversation.participant_one_id === message.receiver_id)
      )
    ) {
      res.status(404).json({ error: "Message is not available." });
      return;
    }
    preferences = await readRows<PreferenceRow>(config, "conversation_preferences", {
      select: "is_muted,is_locked,secret_pin_salt,secret_pin_hash",
      conversation_id: `eq.${conversation.id}`,
      user_id: `eq.${message.receiver_id}`,
      limit: "1",
    });
  } catch (cause) {
    req.log.error({ cause }, "Could not verify chat message notification privacy");
    res.status(503).json({ error: "Could not verify chat notification settings." });
    return;
  }

  const recipientSettings = preferences[0];
  const secretLocked =
    recipientSettings?.is_locked === true &&
    typeof recipientSettings.secret_pin_salt === "string" &&
    recipientSettings.secret_pin_salt.length > 0 &&
    typeof recipientSettings.secret_pin_hash === "string" &&
    recipientSettings.secret_pin_hash.length > 0;
  if (recipientSettings?.is_muted === true || secretLocked) {
    res.json(SendMessagePushResponse.parse({ delivered: 0, suppressed: true }));
    return;
  }

  const account = serviceAccount();
  if (!account) {
    req.log.error("FCM service account is missing or invalid");
    res.status(503).json({ error: "Message notifications are not configured." });
    return;
  }

  let subscriptions: SubscriptionRow[];
  let profiles: ProfileRow[];
  try {
    [subscriptions, profiles] = await Promise.all([
      readRows<SubscriptionRow>(config, "call_push_subscriptions", {
        select: "id,endpoint,subscription",
        user_id: `eq.${message.receiver_id}`,
        provider: "eq.fcm",
        limit: "50",
      }),
      readRows<ProfileRow>(config, "profiles", {
        select: "display_name,username",
        id: `eq.${senderId}`,
        limit: "1",
      }),
    ]);
  } catch (cause) {
    req.log.error({ cause }, "Could not load chat message push recipients");
    res.status(502).json({ error: "Could not load message notification devices." });
    return;
  }

  const deviceTokens = Array.from(
    new Set(
      subscriptions
        .map(tokenFromSubscription)
        .filter((value): value is string => value !== null),
    ),
  );
  if (deviceTokens.length === 0) {
    res.json(SendMessagePushResponse.parse({ delivered: 0, suppressed: false }));
    return;
  }

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken(account);
  } catch (cause) {
    req.log.error({ cause }, "Could not obtain FCM authorization for a message push");
    res.status(502).json({ error: "Could not authorize message notification delivery." });
    return;
  }

  const peerName =
    profiles[0]?.display_name?.trim() ||
    profiles[0]?.username?.trim() ||
    "YourWorld";
  const threadId = `dm_${[senderId, message.receiver_id].sort().join("_")}`;
  const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`;
  let delivered = 0;
  await Promise.all(
    deviceTokens.map(async (deviceToken) => {
      let response: FetchResponse;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: deviceToken,
              data: {
                type: "message",
                messageId: message.id,
                conversationId: conversation!.id,
                peerName,
                body: "Sent you a message",
                url: `/chat/${threadId}`,
              },
              android: {
                priority: "HIGH",
                ttl: "86400s",
              },
            },
          }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch (cause) {
        req.log.warn({ cause }, "FCM chat message push delivery failed");
        return;
      }

      const result: unknown = await response.json().catch(() => null);
      if (response.ok) {
        delivered += 1;
        return;
      }
      const error =
        result && typeof result === "object" && "error" in result
          ? (result as JsonObject).error
          : null;
      const details =
        error && typeof error === "object" && "details" in error
          ? (error as JsonObject).details
          : null;
      const unregistered =
        Array.isArray(details) &&
        details.some(
          (detail) =>
            !!detail &&
            typeof detail === "object" &&
            "errorCode" in detail &&
            detail.errorCode === "UNREGISTERED",
        );
      if (unregistered) {
        const subscription = subscriptions.find(
          (row) => tokenFromSubscription(row) === deviceToken,
        );
        if (subscription) {
          try {
            await deleteSubscription(config, subscription.id);
          } catch (cause) {
            req.log.warn({ cause }, "Could not remove an expired FCM message subscription");
          }
        }
      } else {
        req.log.warn(
          { status: response.status },
          "FCM did not accept a chat message push",
        );
      }
    }),
  );

  res.json(SendMessagePushResponse.parse({ delivered, suppressed: false }));
});

router.post("/capture-alerts/push", async (req, res): Promise<void> => {
  const body = req.body && typeof req.body === "object" ? (req.body as JsonObject) : {};
  const conversationId = body.conversationId;
  const kind = body.kind;
  const eventId = body.eventId;
  if (
    typeof conversationId !== "string" ||
    !UUID_PATTERN.test(conversationId) ||
    (kind !== "screenshot" && kind !== "recording")
  ) {
    res.status(400).json({ error: "Provide a valid protected chat and capture type." });
    return;
  }

  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }
  const config = supabaseConfig();
  if (!config) {
    req.log.error("Chat capture alerts are missing Supabase configuration");
    res.status(503).json({ error: "Chat protection alerts are not configured." });
    return;
  }

  let senderId: string | null;
  try {
    senderId = await authenticateUser(config, token);
  } catch (cause) {
    req.log.warn({ cause }, "Supabase could not validate the chat capture alert user");
    res.status(502).json({ error: "Could not validate the current session." });
    return;
  }
  if (!senderId) {
    res.status(401).json({ error: "The current session is no longer valid." });
    return;
  }

  let conversation: CaptureConversationRow | undefined;
  let recipientSettings: PreferenceRow | undefined;
  let subscriptions: SubscriptionRow[];
  let profiles: ProfileRow[];
  try {
    const conversations = await readRows<CaptureConversationRow>(config, "conversations", {
      select: "id,participant_one_id,participant_two_id,protect_chat_enabled",
      id: `eq.${conversationId}`,
      limit: "1",
    });
    conversation = conversations[0];
    if (
      !conversation ||
      (conversation.participant_one_id !== senderId &&
        conversation.participant_two_id !== senderId)
    ) {
      res.status(404).json({ error: "Protected conversation is not available." });
      return;
    }
    if (conversation.protect_chat_enabled !== true) {
      res.json({ delivered: 0, suppressed: true });
      return;
    }
    const recipientId =
      conversation.participant_one_id === senderId
        ? conversation.participant_two_id
        : conversation.participant_one_id;
    const preferences = await readRows<PreferenceRow>(
      config,
      "conversation_preferences",
      {
        select:
          "is_muted,is_locked,secret_pin_salt,secret_pin_hash,screenshot_alert,screen_recording_alert",
        conversation_id: `eq.${conversationId}`,
        user_id: `eq.${recipientId}`,
        limit: "1",
      },
    );
    recipientSettings = preferences[0];
    const alertEnabled =
      kind === "screenshot"
        ? recipientSettings?.screenshot_alert !== false
        : recipientSettings?.screen_recording_alert !== false;
    const secretLocked =
      recipientSettings?.is_locked === true &&
      typeof recipientSettings.secret_pin_salt === "string" &&
      recipientSettings.secret_pin_salt.length > 0 &&
      typeof recipientSettings.secret_pin_hash === "string" &&
      recipientSettings.secret_pin_hash.length > 0;
    if (!alertEnabled || recipientSettings?.is_muted === true || secretLocked) {
      res.json({ delivered: 0, suppressed: true });
      return;
    }
    [subscriptions, profiles] = await Promise.all([
      readRows<SubscriptionRow>(config, "call_push_subscriptions", {
        select: "id,endpoint,subscription",
        user_id: `eq.${recipientId}`,
        provider: "eq.fcm",
        limit: "50",
      }),
      readRows<ProfileRow>(config, "profiles", {
        select: "display_name,username",
        id: `eq.${senderId}`,
        limit: "1",
      }),
    ]);
  } catch (cause) {
    req.log.error({ cause }, "Could not validate chat capture alert delivery");
    res.status(503).json({ error: "Could not verify chat protection alert settings." });
    return;
  }

  const deviceTokens = Array.from(
    new Set(
      subscriptions
        .map(tokenFromSubscription)
        .filter((value): value is string => value !== null),
    ),
  );
  if (deviceTokens.length === 0) {
    res.json({ delivered: 0, suppressed: false });
    return;
  }
  const account = serviceAccount();
  if (!account) {
    req.log.error("FCM service account is missing or invalid");
    res.status(503).json({ error: "Chat protection alerts are not configured." });
    return;
  }

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken(account);
  } catch (cause) {
    req.log.error({ cause }, "Could not obtain FCM authorization for a chat capture alert");
    res.status(502).json({ error: "Could not authorize the chat protection alert." });
    return;
  }

  const actorName =
    profiles[0]?.display_name?.trim() || profiles[0]?.username?.trim() || "A chat participant";
  const safeEventId =
    typeof eventId === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(eventId)
      ? eventId
      : `${senderId}-${Date.now()}`;
  const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`;
  let delivered = 0;
  await Promise.all(
    deviceTokens.map(async (deviceToken) => {
      let response: FetchResponse;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: deviceToken,
              data: {
                type: "capture-alert",
                eventId: safeEventId,
                conversationId,
                kind,
                actorName,
              },
              android: { priority: "HIGH", ttl: "60s" },
            },
          }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch (cause) {
        req.log.warn({ cause }, "FCM chat capture alert delivery failed");
        return;
      }

      if (response.ok) {
        delivered += 1;
        return;
      }
      const result: unknown = await response.json().catch(() => null);
      const error =
        result && typeof result === "object" && "error" in result
          ? (result as JsonObject).error
          : null;
      const details =
        error && typeof error === "object" && "details" in error
          ? (error as JsonObject).details
          : null;
      const unregistered =
        Array.isArray(details) &&
        details.some(
          (detail) =>
            !!detail &&
            typeof detail === "object" &&
            "errorCode" in detail &&
            detail.errorCode === "UNREGISTERED",
        );
      if (unregistered) {
        const subscription = subscriptions.find(
          (row) => tokenFromSubscription(row) === deviceToken,
        );
        if (subscription) {
          try {
            await deleteSubscription(config, subscription.id);
          } catch (cause) {
            req.log.warn({ cause }, "Could not remove an expired capture-alert subscription");
          }
        }
      } else {
        req.log.warn({ status: response.status }, "FCM rejected a chat capture alert");
      }
    }),
  );

  res.json({ delivered, suppressed: false });
});

export default router;