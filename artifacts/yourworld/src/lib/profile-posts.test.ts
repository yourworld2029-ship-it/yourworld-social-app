import assert from "node:assert/strict";
import { test } from "node:test";
import { countProfileMediaRows, fetchProfilePostCount } from "./profile-posts";

type QueryResult = {
  count: number | null;
  data: unknown[] | null;
  error: unknown | null;
};

function query(result: QueryResult) {
  const promise = Promise.resolve(result);
  return Object.assign(promise, {
    eq() {
      return this;
    },
    in() {
      return this;
    },
    not() {
      return this;
    },
    limit() {
      return this;
    },
  });
}

function countClient(
  tables: Record<string, QueryResult>,
  postCounts: QueryResult[],
) {
  let postCountIndex = 0;
  return {
    from(table: string) {
      return {
        select() {
          if (table === "posts") {
            const result = postCounts[postCountIndex] ?? {
              count: 0,
              data: null,
              error: null,
            };
            postCountIndex += 1;
            return query(result);
          }
          return query(
            tables[table] ?? { count: null, data: null, error: null },
          );
        },
      };
    },
  } as never;
}

test("profile count remains available when optional profile tables reject reads", async () => {
  const result = await fetchProfilePostCount(
    "creator-id",
    countClient(
      {
        live_replays: {
          count: null,
          data: null,
          error: new Error("live replay read denied"),
        },
        reel_collaboration_invites: {
          count: null,
          data: null,
          error: new Error("collaboration read denied"),
        },
      },
      [{ count: 17, data: null, error: null }],
    ),
  );

  assert.equal(result, 17);
});

test("profile Posts count matches loaded non-deleted Videos and Reels only", () => {
  const rows = [
    { id: "video-1", kind: "video" },
    { id: "video-2", kind: "video" },
    { id: "reel-1", kind: "reel" },
    { id: "moment-1", kind: "moment" },
    { id: "image-1", kind: "photo" },
    { id: "video-1", kind: "video" },
  ] as never;
  assert.equal(countProfileMediaRows(rows), 3);
});

test("profile count includes readable accepted collaboration Reels", async () => {
  const result = await fetchProfilePostCount(
    "creator-id",
    countClient(
      {
        live_replays: {
          count: null,
          data: [{ post_id: "live-replay-post" }],
          error: null,
        },
        reel_collaboration_invites: {
          count: null,
          data: [{ post_id: "accepted-reel" }],
          error: null,
        },
      },
      [
        { count: 8, data: null, error: null },
        { count: 1, data: null, error: null },
      ],
    ),
  );

  assert.equal(result, 9);
});

test("missing archived column retries the exact count using its GET error body", async () => {
  const result = await fetchProfilePostCount(
    "creator-id",
    countClient({}, [
      { count: null, data: null, error: { code: "42703", message: "column posts.archived does not exist" } },
      { count: 36, data: [{ id: "one-returned-row" }], error: null },
    ]),
  );
  assert.equal(result, 36);
});

test("count requests retain JSON errors, count only Videos and Reels, and avoid duplicate collaborations", async () => {
  const calls: Array<[string, ...unknown[]]> = [];
  const client = {
    from(table: string) {
      return {
        select(columns: string, options?: { count?: string; head?: boolean }) {
          calls.push(["select", table, columns, options]);
          const result = table === "posts"
            ? { count: 5, data: [{ id: "bounded-row" }], error: null }
            : { count: null, data: table === "reel_collaboration_invites" ? [{ post_id: "collab" }] : [], error: null };
          const request = Object.assign(Promise.resolve(result), {
            eq(column: string, value: unknown) { calls.push(["eq", table, column, value]); return this; },
            in(column: string, value: string[]) { calls.push(["in", table, column, value]); return this; },
            not(column: string, operator: string, value: string) { calls.push(["not", table, column, operator, value]); return this; },
            limit(value: number) { calls.push(["limit", table, value]); return this; },
          });
          return request;
        },
      };
    },
  };
  assert.equal(await fetchProfilePostCount("creator-id", client as never), 10);
  const countReads = calls.filter(([method, table]) => method === "select" && table === "posts");
  assert.equal(countReads.length, 2);
  for (const call of countReads) assert.deepEqual(call[3], { count: "exact" });
  assert.ok(calls.some((call) => call[0] === "in" && call[2] === "kind" && JSON.stringify(call[3]) === '["video","reel"]'));
  assert.ok(calls.some((call) => call[0] === "not" && call[2] === "user_id" && call[3] === "eq" && call[4] === "creator-id"));
  assert.equal(calls.filter(([method]) => method === "limit").length, 2);
});
