import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchProfilePostCount } from "./profile-posts";

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
