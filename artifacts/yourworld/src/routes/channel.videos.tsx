import { createFileRoute } from "@tanstack/react-router";
import { ChannelContentList } from "@/components/yw/ChannelContentList";
import { useChannelData } from "@/lib/channel-data";

export const Route = createFileRoute("/channel/videos")({
  head: () => ({
    meta: [
      { title: "Channel Videos — YourWorld" },
      { name: "description", content: "Manage and review the videos published on your YourWorld channel." },
      { property: "og:title", content: "Channel Videos — YourWorld" },
      { property: "og:description", content: "Performance of every item published to your channel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChannelVideos,
});

function ChannelVideos() {
  const { videos } = useChannelData();
  return <ChannelContentList title="Videos" items={videos} emptyLabel="No videos published yet." />;
}
