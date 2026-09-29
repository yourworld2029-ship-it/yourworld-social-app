import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadSearchData,
  normalizeProfileSearchTerm,
  searchPublicProfiles,
} from "@/lib/search-data";
import { loadChannelData, loadVideoPurchaseEarnings } from "@/lib/channel-data";
import { recordVideoWatchHeartbeat, startVideoWatchSession } from "@/lib/video-data";
import { createPostComment, deletePostComment, loadSocialPosts } from "@/lib/social-data";
import { supabase } from "@/integrations/supabase/client";

type QueryResult = { data?: unknown; error?: { message: string } | null };

function chain(result: QueryResult, onMethod?: (method: string, args: unknown[]) => void) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "order", "limit", "eq", "in", "or", "insert", "delete", "update"]) {
    builder[method] = (...args: unknown[]) => {
      onMethod?.(method, args);
      return builder;
    };
  }
  builder.maybeSingle = async () => result;
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

function fakeClient(options: {
  session?: { user: { id: string } } | null;
  from: Record<string, QueryResult[]>;
  rpc?: Record<string, QueryResult[]>;
}) {
  const calls: Array<{ type: "from" | "rpc" | "query"; name: string; args: unknown[] }> = [];
  const from = (name: string) => {
    calls.push({ type: "from", name, args: [] });
    const result = options.from[name]?.shift() ?? { data: [] };
    return chain(result, (method, args) => {
      calls.push({ type: "query", name: `${name}.${method}`, args });
    });
  };
  const rpc = (name: string, args: unknown) => {
    calls.push({ type: "rpc", name, args: [args] });
    const result = options.rpc?.[name]?.shift() ?? { data: [] };
    return Promise.resolve(result);
  };
  const client = {
    auth: {
      getSession: async () => ({
        data: { session: options.session === undefined ? null : options.session },
      }),
    },
    from,
    rpc,
  };
  return { client: client as unknown as typeof supabase, calls };
}

const profile = (id: string, username: string, displayName = username) => ({
  id,
  username,
  display_name: displayName,
  category: "Creator",
});

const post = (id: string, userId: string, kind: "post" | "reel" | "video" = "post") => ({
  id,
  user_id: userId,
  kind,
  media_url: `https://cdn.example.test/${id}.jpg`,
  media_type: "image",
  caption: `${id} caption`,
  hashtags: ["Live", `#${id}`],
  location: null,
  audio: null,
  allow_download: true,
  created_at: "2026-09-01T12:00:00.000Z",
});

test("search stays empty when Supabase has no profiles or posts", async () => {
  const { client, calls } = fakeClient({
    from: { profiles: [{ data: [] }], posts: [{ data: [] }] },
  });

  const result = await loadSearchData(client);

  assert.deepEqual(result, { users: [], reels: [], videos: [], hashtags: [] });
  assert.equal(
    calls.some((call) => call.type === "rpc"),
    false,
  );
});

test("search exposes live profiles and normalized hashtag totals", async () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const { client } = fakeClient({
    from: {
      profiles: [{ data: [profile(userId, "live.creator", "Live Creator")] }],
      posts: [{ data: [{ hashtags: ["Live", "#live", " other "] }] }],
    },
    rpc: { get_follow_counts: [{ data: [{ user_id: userId, followers: 7 }] }] },
  });

  const result = await loadSearchData(client);

  assert.equal(result.users[0]?.username, "live.creator");
  assert.equal(result.users[0]?.followerCount, 7);
  assert.deepEqual(
    result.hashtags.map(({ tag, postCount }) => ({ tag, postCount })),
    [
      { tag: "live", postCount: 2 },
      { tag: "other", postCount: 1 },
    ],
  );
});

test("profile search normalizes @ while preserving username and display name", async () => {
  const userId = "12121212-1212-4121-8121-121212121212";
  const { client, calls } = fakeClient({
    from: {},
    rpc: {
      search_profiles: [{ data: [profile(userId, "sandy", "Sandeep Poonia")] }],
    },
  });

  const result = await searchPublicProfiles(" @sandy ", client);

  assert.equal(normalizeProfileSearchTerm(" @sandy "), "sandy");
  assert.equal(result[0]?.id, userId);
  assert.equal(result[0]?.username, "sandy");
  assert.equal(result[0]?.name, "Sandeep Poonia");
  assert.deepEqual(
    calls.find((call) => call.type === "rpc" && call.name === "search_profiles")?.args,
    [{ search: "sandy" }],
  );
});

test("channel stays empty when the creator has no live rows", async () => {
  const creatorId = "22222222-2222-4222-8222-222222222222";
  const { client } = fakeClient({
    from: { posts: [{ data: [] }] },
    rpc: {
      list_follows: [{ data: [] }],
      get_follow_counts: [{ data: [{ followers: 0 }] }],
    },
  });

  const result = await loadChannelData(creatorId, client);

  assert.deepEqual(result.videos, []);
  assert.deepEqual(result.stats, {
    subscribers: 0,
    videoViews: 0,
    watchHours: 0,
    publishedVideos: 0,
  });
});

test("creator analytics includes only long videos and sorts the top videos by views", async () => {
  const creatorId = "33333333-3333-4333-8333-333333333333";
  const { client } = fakeClient({
    from: {
      posts: [
        {
          data: [
            {
              ...post("video-low", creatorId, "video"),
              title: "Lower-view video",
              media_type: "video",
              views_count: 40,
              duration_seconds: 150,
            },
            {
              ...post("reel-high", creatorId, "reel"),
              title: "Popular reel",
              views_count: 9000,
              duration_seconds: 200,
            },
            {
              ...post("post-titled", creatorId, "post"),
              title: "A titled post",
              views_count: 7000,
              duration_seconds: 200,
            },
            {
              ...post("video-high", creatorId, "video"),
              title: "Higher-view video",
              media_type: "video",
              views_count: 700,
              duration_seconds: 200,
            },
          ],
        },
      ],
    },
    rpc: {
      get_follow_counts: [{ data: [{ followers: 12 }] }],
    },
  });

  const result = await loadChannelData(creatorId, client);

  assert.deepEqual(result.videos.map((video) => video.id), ["video-high", "video-low"]);
  assert.deepEqual(result.stats, {
    subscribers: 12,
    videoViews: 740,
    watchHours: 0,
    publishedVideos: 2,
  });
});

test("channel uses the live watch-hours aggregate for the requested period", async () => {
  const creatorId = "88888888-8888-4888-8888-888888888888";
  const { client, calls } = fakeClient({
    from: {
      posts: [{ data: [post("video-1", creatorId, "post")] }],
      post_likes: [{ data: [] }],
    },
    rpc: {
      list_follows: [{ data: [] }],
      get_follow_counts: [{ data: [{ followers: 1 }] }],
      get_public_profiles: [{ data: [] }],
      get_channel_watch_hours: [{ data: 12.5 }],
    },
  });

  const result = await loadChannelData(creatorId, client, 7);

  assert.equal(result.stats.watchHours, 12.5);
  assert.equal(result.watchTimeError, null);
  const watchCall = calls.find((call) => call.name === "get_channel_watch_hours");
  assert.equal(watchCall?.type, "rpc");
  assert.equal((watchCall?.args[0] as { _channel_id: string })._channel_id, creatorId);
});

test("channel lifetime filter uses only the video watch-hours aggregate", async () => {
  const creatorId = "99999999-9999-4999-8999-999999999999";
  const { client, calls } = fakeClient({
    from: {
      posts: [{ data: [] }],
    },
    rpc: {
      list_follows: [{ data: [] }],
      get_follow_counts: [{ data: [{ followers: 0 }] }],
      get_channel_watch_hours: [{ data: 0 }],
    },
  });

  await loadChannelData(creatorId, client, "lifetime");

  const watchCall = calls.find((call) => call.name === "get_channel_watch_hours");
  assert.equal(
    (watchCall?.args[0] as { _period_start: string })._period_start,
    new Date(0).toISOString(),
  );
  assert.equal(calls.some((call) => call.name === "get_channel_live_watch_hours"), false);
});

test("video earnings only sum paid creator shares for the selected owner and video", async () => {
  const creatorId = "abababab-abab-4bab-8bab-abababababab";
  const videoId = "cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd";
  const { client, calls } = fakeClient({
    session: { user: { id: creatorId } },
    from: {
      video_purchases: [{
        data: [
          { creator_share: "31.50", status: "paid" },
          { creator_share: "10.00", status: "refunded" },
          { creator_share: 8.25, status: "paid" },
        ],
      }],
    },
  });

  assert.equal(await loadVideoPurchaseEarnings(videoId, client), 39.75);
  assert.deepEqual(
    calls
      .filter((call) => call.type === "query" && call.name.startsWith("video_purchases."))
      .map((call) => call.args),
    [
      ["creator_share,status"],
      ["creator_id", creatorId],
      ["video_id", videoId],
      ["status", "paid"],
    ],
  );
});

test("watch recording sends no client-asserted duration or direct table insert", async () => {
  const postId = "99999999-9999-4999-8999-999999999999";
  const sessionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const { client, calls } = fakeClient({
    from: {},
    rpc: {
      start_video_watch_session: [{ data: sessionId }],
      record_video_watch_heartbeat: [{ data: 10 }],
    },
  });

  const started = await startVideoWatchSession(postId, client);
  const heartbeat = await recordVideoWatchHeartbeat(sessionId, client);

  assert.equal(started.sessionId, sessionId);
  assert.equal(heartbeat.creditedSeconds, 10);
  assert.equal(
    calls.some((call) => call.type === "from"),
    false,
  );
  assert.deepEqual(
    calls.filter((call) => call.type === "rpc").map((call) => [call.name, call.args[0]]),
    [
      ["start_video_watch_session", { _post_id: postId }],
      ["record_video_watch_heartbeat", { _session_id: sessionId }],
    ],
  );
});

test("a feed refresh returns empty live data instead of stale local rows", async () => {
  const creatorId = "55555555-5555-4555-8555-555555555555";
  const { client } = fakeClient({
    session: { user: { id: creatorId } },
    from: {
      posts: [{ data: [post("fresh-1", creatorId, "reel")] }, { data: [] }],
      post_likes: [{ data: [] }],
      post_comments: [{ data: [] }],
    },
    rpc: {
      get_public_profiles: [{ data: [profile(creatorId, "live.creator")] }],
    },
  });

  const first = await loadSocialPosts("reel", client);
  const refreshed = await loadSocialPosts("reel", client);

  assert.equal(first.posts[0]?.id, "fresh-1");
  assert.deepEqual(refreshed.posts, []);
  assert.equal(refreshed.currentUserId, creatorId);
});

test("missing profile rows use a generic live identity, never a demo identity", async () => {
  const missingProfileId = "66666666-6666-4666-8666-666666666666";
  const { client } = fakeClient({
    session: null,
    from: {
      posts: [{ data: [post("missing-profile-post", missingProfileId)] }],
      post_likes: [{ data: [] }],
      post_comments: [{ data: [] }],
    },
    rpc: { get_public_profiles: [{ data: [] }] },
  });

  const result = await loadSocialPosts("post", client);
  const author = result.posts[0]?.author;

  assert.equal(author?.id, missingProfileId);
  assert.equal(author?.name, "YourWorld user");
  assert.equal(author?.username, `user${missingProfileId.slice(0, 4)}`);
  assert.notEqual(author?.username, "riko.night");
  assert.notEqual(author?.username, "sea.salt");
  assert.notEqual(author?.username, "spinsolo");
});

test("comments are inserted and deleted through Supabase", async () => {
  const postId = "post-live";
  const userId = "77777777-7777-4777-8777-777777777777";
  const { client, calls } = fakeClient({
    from: {
      comments: [
        { data: { id: "comment-live", created_at: "2026-09-02T10:00:00.000Z" }, error: null },
        { data: null, error: null },
      ],
    },
  });

  const created = await createPostComment(postId, userId, "  persisted comment  ", client);
  const deleted = await deletePostComment("comment-live", client);

  assert.deepEqual(created.data, {
    id: "comment-live",
    created_at: "2026-09-02T10:00:00.000Z",
  });
  assert.equal(created.error, null);
  assert.equal(deleted.error, null);
  assert.deepEqual(
    calls.filter(({ type }) => type === "from").map(({ type, name }) => `${type}:${name}`),
    ["from:comments", "from:comments"],
  );
  assert.deepEqual(calls.find(({ name }) => name === "comments.insert")?.args, [
    { post_id: postId, user_id: userId, content: "persisted comment" },
  ]);
  assert.deepEqual(calls.find(({ name }) => name === "comments.eq")?.args, ["id", "comment-live"]);
});
