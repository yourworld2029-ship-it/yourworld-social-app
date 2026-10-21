export function excludeIdsFromLiveReplayPosts<T extends { id: string }>(
  posts: T[],
  livePostIds: ReadonlySet<string>,
) {
  return posts.filter((post) => !livePostIds.has(post.id));
}
