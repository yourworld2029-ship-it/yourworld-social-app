import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test, type TestContext } from "node:test";
import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import callPushRouter from "./call-push";

const callerId = "11111111-1111-4111-8111-111111111111";
const receiverId = "22222222-2222-4222-8222-222222222222";
const callId = "33333333-3333-4333-8333-333333333333";
const conversationId = "44444444-4444-4444-8444-444444444444";
const messageId = "55555555-5555-4555-8555-555555555555";
const supabaseUrl = "https://supabase.test";
const nativeFetch = globalThis.fetch.bind(globalThis);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function startServer(t: TestContext) {
  const app = express();
  app.use(pinoHttp({ logger: pino({ level: "silent" }) }));
  app.use(express.json());
  app.use(callPushRouter);

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

function setEnvironment(
  t: TestContext,
  extra: Record<string, string | undefined> = {},
) {
  const values = {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    ...extra,
  };
  const previous = new Map(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  t.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

function incomingCall() {
  return {
    id: callId,
    caller_id: callerId,
    receiver_id: receiverId,
    call_type: "video",
    status: "ringing",
  };
}

function incomingMessage() {
  return {
    id: messageId,
    sender_id: callerId,
    receiver_id: receiverId,
    conversation_id: conversationId,
    is_system_message: false,
  };
}

function privateKeyServiceAccount() {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return JSON.stringify({
    type: "service_account",
    project_id: "yourworld-test-project",
    client_email: "test-sender@yourworld-test-project.iam.gserviceaccount.com",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  });
}

test("registered FCM tokens move to the currently authenticated user", async (t) => {
  setEnvironment(t);
  const baseUrl = await startServer(t);
  const requests: Array<{ url: URL; method: string; body: unknown }> = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      requests.push({
        url,
        method,
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
      if (url.pathname === "/auth/v1/user") return jsonResponse({ id: receiverId });
      if (url.pathname === "/rest/v1/call_push_subscriptions" && method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      if (url.pathname === "/rest/v1/call_push_subscriptions" && method === "POST") {
        return new Response(null, { status: 201 });
      }
      throw new Error(`Unexpected request: ${method} ${url.pathname}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/calls/push/register`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-session",
      "Content-Type": "application/json",
      "User-Agent": "YourWorld Android test",
    },
    body: JSON.stringify({ token: "test-fcm-device-token-123456789" }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { registered: true });
  const registrationRequests = requests.filter(
    (request) => request.url.pathname === "/rest/v1/call_push_subscriptions",
  );
  assert.deepEqual(registrationRequests.map((request) => request.method), ["DELETE", "POST"]);
  assert.equal(
    registrationRequests[0]?.url.searchParams.get("endpoint"),
    "eq.fcm:test-fcm-device-token-123456789",
  );
  const savedRegistration = registrationRequests[1]?.body as Record<string, unknown>;
  assert.equal(savedRegistration.user_id, receiverId);
  assert.equal(savedRegistration.endpoint, "fcm:test-fcm-device-token-123456789");
  assert.equal(savedRegistration.provider, "fcm");
  assert.deepEqual(savedRegistration.subscription, {
    token: "test-fcm-device-token-123456789",
  });
  assert.equal(savedRegistration.user_agent, "YourWorld Android test");
  assert.match(String(savedRegistration.last_seen_at), /^\d{4}-\d{2}-\d{2}T/);
});

test("Secret Lock suppresses an FCM call push before device lookup", async (t) => {
  setEnvironment(t, { FCM_SERVICE_ACCOUNT_JSON: undefined });
  const baseUrl = await startServer(t);
  const paths: string[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const url = new URL(String(input));
      paths.push(url.pathname);
      if (url.pathname === "/auth/v1/user") return jsonResponse({ id: callerId });
      if (url.pathname === "/rest/v1/calls") return jsonResponse([incomingCall()]);
      if (url.pathname === "/rest/v1/conversations") {
        return jsonResponse([{ id: conversationId }]);
      }
      if (url.pathname === "/rest/v1/conversation_preferences") {
        return jsonResponse([
          {
            secret_pin_salt: "receiver-private-salt",
            secret_pin_hash: "receiver-private-hash",
          },
        ]);
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url.pathname}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/calls/push`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ callId }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 0, suppressed: true });
  assert.ok(!paths.includes("/rest/v1/call_push_subscriptions"));
  assert.ok(!paths.includes("/rest/v1/profiles"));
  assert.ok(!paths.includes("/token"));
  assert.equal(paths.length, 4);
});

test("FCM call pushes use data-only high-priority delivery with a short TTL", async (t) => {
  setEnvironment(t, { FCM_SERVICE_ACCOUNT_JSON: privateKeyServiceAccount() });
  const baseUrl = await startServer(t);
  const captured: {
    conversationFilter: string | null;
    fcmRequest: { headers: Headers; body: Record<string, unknown> } | null;
  } = { conversationFilter: null, fcmRequest: null };
  t.mock.method(
    globalThis,
    "fetch",
    async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") return jsonResponse({ id: callerId });
      if (url.pathname === "/rest/v1/calls") return jsonResponse([incomingCall()]);
      if (url.pathname === "/rest/v1/conversations") {
        captured.conversationFilter = url.searchParams.get("or");
        return jsonResponse([]);
      }
      if (url.pathname === "/rest/v1/profiles") {
        return jsonResponse([{ display_name: "Caller display name" }]);
      }
      if (url.pathname === "/rest/v1/call_push_subscriptions") {
        return jsonResponse([
          {
            id: "subscription-1",
            endpoint: "fcm:test-fcm-device-token-123456789",
            subscription: { token: "test-fcm-device-token-123456789" },
          },
        ]);
      }
      if (url.hostname === "oauth2.googleapis.com") {
        return jsonResponse({ access_token: "test-google-oauth-token", expires_in: 3600 });
      }
      if (url.hostname === "fcm.googleapis.com") {
        captured.fcmRequest = {
          headers: new Headers(init?.headers),
          body: JSON.parse(String(init?.body)) as Record<string, unknown>,
        };
        return jsonResponse({ name: "projects/yourworld-test-project/messages/1" });
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url.href}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/calls/push`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ callId }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 1, suppressed: false });
  assert.equal(
    captured.conversationFilter,
    `(and(participant_one_id.eq.${receiverId},participant_two_id.eq.${callerId}),and(participant_two_id.eq.${receiverId},participant_one_id.eq.${callerId}))`,
  );
  assert.ok(captured.fcmRequest);
  assert.equal(
    captured.fcmRequest.headers.get("authorization"),
    "Bearer test-google-oauth-token",
  );
  const message = captured.fcmRequest.body.message as Record<string, unknown>;
  assert.equal(message.token, "test-fcm-device-token-123456789");
  assert.deepEqual(message.data, {
    type: "call",
    callId,
    mode: "video",
    peerName: "Caller display name",
  });
  assert.deepEqual(message.android, {
    priority: "HIGH",
    ttl: "30s",
    collapseKey: `yourworld-call-${callId}`,
  });
  assert.deepEqual(Object.keys(message).sort(), ["android", "data", "token"]);
});

test("call dismissal reaches the other participant with a high-priority FCM data message", async (t) => {
  setEnvironment(t, { FCM_SERVICE_ACCOUNT_JSON: privateKeyServiceAccount() });
  const baseUrl = await startServer(t);
  const captured: {
    fcmMessage: Record<string, unknown> | null;
    recipientFilter: string | null;
  } = { fcmMessage: null, recipientFilter: null };
  t.mock.method(
    globalThis,
    "fetch",
    async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") return jsonResponse({ id: callerId });
      if (url.pathname === "/rest/v1/calls") {
        return jsonResponse([{ ...incomingCall(), status: "cancelled" }]);
      }
      if (url.pathname === "/rest/v1/call_push_subscriptions") {
        captured.recipientFilter = url.searchParams.get("user_id");
        return jsonResponse([{
          id: "subscription-1",
          endpoint: "fcm:test-fcm-device-token-123456789",
          subscription: { token: "test-fcm-device-token-123456789" },
        }]);
      }
      if (url.hostname === "oauth2.googleapis.com") {
        return jsonResponse({ access_token: "test-google-oauth-token", expires_in: 3600 });
      }
      if (url.hostname === "fcm.googleapis.com") {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        captured.fcmMessage = body.message as Record<string, unknown>;
        return jsonResponse({ name: "projects/yourworld-test-project/messages/2" });
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url.href}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/calls/push`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ callId, action: "dismiss" }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 1, suppressed: false });
  assert.equal(captured.recipientFilter, `eq.${receiverId}`);
  assert.ok(captured.fcmMessage);
  const message = captured.fcmMessage as Record<string, unknown>;
  assert.deepEqual(message.data, { type: "call-dismiss", callId });
  assert.deepEqual(message.android, {
    priority: "HIGH",
    ttl: "30s",
    collapseKey: `yourworld-call-${callId}`,
  });
});

test("a different authenticated user cannot send the caller's call push", async (t) => {
  setEnvironment(t);
  const baseUrl = await startServer(t);
  let readConversations = false;
  t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0]) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") {
        return jsonResponse({ id: "55555555-5555-4555-8555-555555555555" });
      }
      if (url.pathname === "/rest/v1/calls") return jsonResponse([]);
      if (url.pathname === "/rest/v1/conversations") readConversations = true;
      throw new Error(`Unexpected request: ${url.pathname}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/calls/push`, {
    method: "POST",
    headers: {
      Authorization: "Bearer another-user-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ callId }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Call is not available." });
  assert.equal(readConversations, false);
});

test("chat message pushes are high priority, generic, and delivered to active Android tokens", async (t) => {
  setEnvironment(t, { FCM_SERVICE_ACCOUNT_JSON: privateKeyServiceAccount() });
  const baseUrl = await startServer(t);
  const captured: { fcmBody: Record<string, unknown> | null } = { fcmBody: null };
  t.mock.method(
    globalThis,
    "fetch",
    async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") return jsonResponse({ id: callerId });
      if (url.pathname === "/rest/v1/messages") return jsonResponse([incomingMessage()]);
      if (url.pathname === "/rest/v1/conversations") {
        return jsonResponse([
          {
            id: conversationId,
            participant_one_id: callerId,
            participant_two_id: receiverId,
          },
        ]);
      }
      if (url.pathname === "/rest/v1/conversation_preferences") {
        return jsonResponse([{ is_muted: false, is_locked: false }]);
      }
      if (url.pathname === "/rest/v1/profiles") {
        return jsonResponse([{ display_name: "Caller display name" }]);
      }
      if (url.pathname === "/rest/v1/call_push_subscriptions") {
        return jsonResponse([
          {
            id: "message-subscription-1",
            endpoint: "fcm:test-message-device-token-123456789",
            subscription: { token: "test-message-device-token-123456789" },
          },
        ]);
      }
      if (url.hostname === "oauth2.googleapis.com") {
        return jsonResponse({ access_token: "test-google-oauth-token", expires_in: 3600 });
      }
      if (url.hostname === "fcm.googleapis.com") {
        captured.fcmBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse({ name: "projects/yourworld-test-project/messages/2" });
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url.href}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/messages/push`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messageId }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 1, suppressed: false });
  assert.ok(captured.fcmBody);
  const message = captured.fcmBody.message as Record<string, unknown>;
  assert.equal(message.token, "test-message-device-token-123456789");
  assert.deepEqual(message.data, {
    type: "message",
    messageId,
    conversationId,
    senderId: callerId,
    peerName: "Caller display name",
    body: "Sent you a message",
    url: `/chat/dm_${[callerId, receiverId].sort().join("_")}`,
  });
  assert.deepEqual(message.android, { priority: "HIGH", ttl: "86400s" });
  assert.deepEqual(Object.keys(message).sort(), ["android", "data", "token"]);
});

test("reported protected-chat captures send high-priority alerts only to the other participant", async (t) => {
  setEnvironment(t, { FCM_SERVICE_ACCOUNT_JSON: privateKeyServiceAccount() });
  const baseUrl = await startServer(t);
  const captured: { fcmBody: Record<string, unknown> | null } = { fcmBody: null };
  t.mock.method(
    globalThis,
    "fetch",
    async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const url = new URL(String(input));
      if (url.pathname === "/auth/v1/user") return jsonResponse({ id: callerId });
      if (url.pathname === "/rest/v1/conversations") {
        return jsonResponse([
          {
            id: conversationId,
            participant_one_id: callerId,
            participant_two_id: receiverId,
            protect_chat_enabled: true,
          },
        ]);
      }
      if (url.pathname === "/rest/v1/conversation_preferences") {
        return jsonResponse([
          {
            is_muted: false,
            is_locked: false,
            screenshot_alert: true,
            screen_recording_alert: true,
          },
        ]);
      }
      if (url.pathname === "/rest/v1/profiles") {
        return jsonResponse([{ display_name: "Caller display name" }]);
      }
      if (url.pathname === "/rest/v1/call_push_subscriptions") {
        return jsonResponse([
          {
            id: "capture-alert-subscription-1",
            endpoint: "fcm:test-capture-device-token-123456789",
            subscription: { token: "test-capture-device-token-123456789" },
          },
        ]);
      }
      if (url.hostname === "oauth2.googleapis.com") {
        return jsonResponse({ access_token: "test-google-oauth-token", expires_in: 3600 });
      }
      if (url.hostname === "fcm.googleapis.com") {
        captured.fcmBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse({ name: "projects/yourworld-test-project/messages/capture" });
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url.href}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/capture-alerts/push`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId,
      kind: "recording",
      eventId: `${callerId}-1700000000000`,
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 1, suppressed: false });
  assert.ok(captured.fcmBody);
  const message = captured.fcmBody.message as Record<string, unknown>;
  assert.equal(message.token, "test-capture-device-token-123456789");
  assert.deepEqual(message.data, {
    type: "capture-alert",
    eventId: `${callerId}-1700000000000`,
    conversationId,
    kind: "recording",
    actorName: "Caller display name",
  });
  assert.deepEqual(message.android, { priority: "HIGH", ttl: "60s" });
});

test("capture-alert pushes are suppressed when shared chat protection is off", async (t) => {
  setEnvironment(t, { FCM_SERVICE_ACCOUNT_JSON: undefined });
  const baseUrl = await startServer(t);
  const paths: string[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0]) => {
      const url = new URL(String(input));
      paths.push(url.pathname);
      if (url.pathname === "/auth/v1/user") return jsonResponse({ id: callerId });
      if (url.pathname === "/rest/v1/conversations") {
        return jsonResponse([
          {
            id: conversationId,
            participant_one_id: callerId,
            participant_two_id: receiverId,
            protect_chat_enabled: false,
          },
        ]);
      }
      throw new Error(`Unexpected request: ${url.pathname}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/capture-alerts/push`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationId, kind: "screenshot" }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 0, suppressed: true });
  assert.ok(!paths.includes("/rest/v1/call_push_subscriptions"));
  assert.ok(!paths.includes("https://fcm.googleapis.com"));
});

test("muted chat message pushes are suppressed before FCM device lookup", async (t) => {
  setEnvironment(t, { FCM_SERVICE_ACCOUNT_JSON: undefined });
  const baseUrl = await startServer(t);
  const paths: string[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0]) => {
      const url = new URL(String(input));
      paths.push(url.pathname);
      if (url.pathname === "/auth/v1/user") return jsonResponse({ id: callerId });
      if (url.pathname === "/rest/v1/messages") return jsonResponse([incomingMessage()]);
      if (url.pathname === "/rest/v1/conversations") {
        return jsonResponse([
          {
            id: conversationId,
            participant_one_id: callerId,
            participant_two_id: receiverId,
          },
        ]);
      }
      if (url.pathname === "/rest/v1/conversation_preferences") {
        return jsonResponse([{ is_muted: true, is_locked: false }]);
      }
      throw new Error(`Unexpected request: ${url.pathname}`);
    },
  );

  const response = await nativeFetch(`${baseUrl}/messages/push`, {
    method: "POST",
    headers: {
      Authorization: "Bearer test-user-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messageId }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { delivered: 0, suppressed: true });
  assert.ok(!paths.includes("/rest/v1/call_push_subscriptions"));
  assert.ok(!paths.includes("/rest/v1/profiles"));
  assert.ok(!paths.includes("/token"));
});