import assert from "node:assert/strict";
import { test } from "node:test";
import { loadSearchData } from "@/lib/search-data";
import { loadChannelData } from "@/lib/channel-data";
import {
  createPostComment,
  deletePostComment,
  loadSocialPosts,
} from "@/lib/social-data";
import { supabase } from "@/integrations/supabase/client";

type QueryResult = { data?: unknown; error?: { message: string } | null };

function chain(
  result: QueryResult,
  onMethod?: (method: string, args: unknown[]) => void,
) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "order", "limit", "eq", "in", "insert", "delete", "update"]) {
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
      getSession: async () => ({ data: { session: options.session === undefined ? null : options.session } }),
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

const post = (id: string, userId: string, kind: "post" | "reel" = "post") => ({
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

  assert.deepEqual(result, { users: [], hashtags: [] });
  assert.equal(calls.some((call) => call.type === "rpc"), false);
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
  assert.deepEqual(result.reels, []);
  assert.deepEqual(result.posts, []);
  assert.deepEqual(result.subscribers, []);
  assert.deepEqual(result.stats, { subscribers: 0, views30d: 0, watchHours: 0, posts: 0 });
});

test("channel maps live videos, posts, likes, and subscribers", async () => {
  const creatorId = "33333333-3333-4333-8333-333333333333";
  const followerId = "44444444-4444-4444-8444-444444444444";
  const { client } = fakeClient({
    from: {
      posts: [{ data: [post("video-1", creatorId, "post"), { ...post("reel-1", creatorId, "reel"), kind: "reel" }] }],
      post_likes: [{ data: [{ post_id: "video-1" }, { post_id: "video-1" }] }],
    },
    rpc: {
      list_follows: [{ data: [{ id: followerId }] }],
      get_follow_counts: [{ data: [{ followers: 12 }] }],
      get_public_profiles: [{ data: [profile(followerId, "subscriber")] }],
    },
  });

  const result = await loadChannelData(creatorId, client);

  assert.equal(result.posts[0]?.id, "video-1");
  assert.equal(result.posts[0]?.likes, 2);
  assert.equal(result.reels[0]?.id, "reel-1");
  assert.equal(result.subscribers[0]?.handle, "subscriber");
  assert.deepEqual(result.stats, {
    subscribers: 12,
    views30d: 0,
    watchHours: 0,
    posts: 2,
  });
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
      post_comments: [
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
  assert.deepEqual(calls.filter(({ type }) => type === "from").map(({ type, name }) => `${type}:${name}`), [
    "from:post_comments",
    "from:post_comments",
  ]);
  assert.deepEqual(
    calls.find(({ name }) => name === "post_comments.insert")?.args,
    [{ post_id: postId, user_id: userId, body: "persisted comment" }],
  );
  assert.deepEqual(
    calls.find(({ name }) => name === "post_comments.eq")?.args,
    ["id", "comment-live"],
  );
});