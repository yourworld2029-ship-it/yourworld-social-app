import { createFileRoute } from "@tanstack/react-router";
import { ChannelHeader, StatTile } from "@/components/yw/ChannelHeader";
import {
  formatCount,
  useChannelData,
} from "@/lib/channel-data";

export const Route = createFileRoute("/channel/analytics")({
  head: () => ({
    meta: [
      { title: "Channel Analytics — YourWorld" },
      {
        name: "description",
        content: "Views, watch time, subscriber growth and top performing content for your channel.",
      },
      { property: "og:title", content: "Channel Analytics — YourWorld" },
      { property: "og:description", content: "Understand how your channel is growing on YourWorld." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChannelAnalytics,
});

function ChannelAnalytics() {
  const { stats, videos, reels } = useChannelData();
  const top = [...videos, ...reels].sort((a, b) => b.views - a.views).slice(0, 4);

  return (
    <main className="min-h-screen pb-12">
      <ChannelHeader title="Analytics" />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        <StatTile label="Total views" value={formatCount(stats.views30d)} />
        <StatTile label="Watch hours" value={formatCount(stats.watchHours)} hint="No live watch-time source yet" />
        <StatTile label="Subscribers" value={formatCount(stats.subscribers)} />
        <StatTile label="Published" value={formatCount(stats.posts)} />
      </div>

      <div className="px-4 pt-4">
        <section className="surface-card overflow-hidden rounded-3xl">
          <p className="px-4 pt-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top performing
          </p>
          <ul className="pt-1">
            {top.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <img src={t.thumb} alt="" loading="lazy" className="h-11 w-16 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{t.publishedAt}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold">{formatCount(t.views)}</span>
              </li>
            ))}
            {top.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">No published content yet.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
