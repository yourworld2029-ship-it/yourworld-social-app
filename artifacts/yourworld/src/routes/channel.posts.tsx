import { createFileRoute } from "@tanstack/react-router";
import { ChannelContentList } from "@/components/yw/ChannelContentList";
import { useChannelData } from "@/lib/channel-data";

export const Route = createFileRoute("/channel/posts")({
  head: () => ({
    meta: [
      { title: "Channel Posts — YourWorld" },
      { name: "description", content: "Manage and review the posts published on your YourWorld channel." },
      { property: "og:title", content: "Channel Posts — YourWorld" },
      { property: "og:description", content: "Performance of every item published to your channel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChannelPosts,
});

function ChannelPosts() {
  const { posts } = useChannelData();
  return <ChannelContentList title="Posts" items={posts} emptyLabel="No posts published yet." />;
}
