import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { removeDeletedPostFromQueryCaches } from "./post-deletion";

test("removing a post clears it from every cached social and video feed", () => {
  const queryClient = new QueryClient();
  const socialKey = ["social-posts", "reel", "owner-1"] as const;
  const creatorMediaKey = ["social-posts", "creator-media", "owner-1"] as const;
  const videosKey = ["long-videos"] as const;

  queryClient.setQueryData(socialKey, {
    pages: [{ posts: [{ id: "deleted" }, { id: "kept-reel" }] }],
    pageParams: [0],
  });
  queryClient.setQueryData(creatorMediaKey, {
    pages: [{ posts: [{ id: "deleted" }, { id: "kept-media" }] }],
    pageParams: [0],
  });
  queryClient.setQueryData(videosKey, {
    pages: [{ videos: [{ id: "deleted" }, { id: "kept-video" }] }],
    pageParams: [0],
  });

  removeDeletedPostFromQueryCaches(queryClient, "deleted");

  const socialPosts = queryClient.getQueryData<{
    pages: Array<{ posts: Array<{ id: string }> }>;
    pageParams: number[];
  }>(socialKey);
  const creatorMedia = queryClient.getQueryData<{
      pages: Array<{ posts: Array<{ id: string }> }>;
      pageParams: number[];
  }>(creatorMediaKey);
  const longVideos = queryClient.getQueryData<{
      pages: Array<{ videos: Array<{ id: string }> }>;
      pageParams: number[];
  }>(videosKey);

  assert.deepEqual(socialPosts?.pages[0]?.posts, [{ id: "kept-reel" }]);
  assert.deepEqual(creatorMedia?.pages[0]?.posts, [{ id: "kept-media" }]);
  assert.deepEqual(longVideos?.pages[0]?.videos, [{ id: "kept-video" }]);
});