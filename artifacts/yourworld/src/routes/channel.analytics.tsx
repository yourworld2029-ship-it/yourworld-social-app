import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock3, Eye, FileText, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { ChannelHeader } from "@/components/yw/ChannelHeader";
import {
  formatCount,
  useChannelData,
} from "@/lib/channel-data";
import { VideoPoster } from "@/components/yw/VideoPoster";

export const Route = createFileRoute("/channel/analytics")({
  head: () => ({
    meta: [
      { title: "Creator Analytics — YourWorld" },
      {
        name: "description",
        content: "Views, watch time, follower growth and top performing content for your profile.",
      },
      { property: "og:title", content: "Creator Analytics — YourWorld" },
      { property: "og:description", content: "Understand how your profile is growing on YourWorld." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChannelAnalytics,
});

function ChannelAnalytics() {
  const [periodDays, setPeriodDays] = useState<number | "lifetime">(30);
  const { stats, videos, reels, loading, watchTimeError } = useChannelData(periodDays);
  const top = [...videos, ...reels].sort((a, b) => b.views - a.views).slice(0, 4);
  const statValue = (value: number) =>
    loading && value !== 0 ? "…" : formatCount(value);
  const cards = [
    { label: "Total Views", value: statValue(stats.views30d), icon: <Eye size={16} />, accent: "text-fuchsia-200" },
    {
      label: "Watch Hours",
      value: statValue(stats.watchHours),
      hint: watchTimeError
        ? "Watch time unavailable"
        : periodDays === "lifetime"
          ? "Lifetime"
          : `Last ${periodDays} days`,
      icon: <Clock3 size={16} />,
      accent: "text-cyan-200",
    },
    { label: "Followers", value: statValue(stats.subscribers), icon: <UsersRound size={16} />, accent: "text-violet-200" },
    { label: "Published posts", value: statValue(stats.posts), icon: <FileText size={16} />, accent: "text-amber-200" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080910] pb-12 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 16% 0%, rgba(168, 85, 247, 0.15), transparent 36%), radial-gradient(ellipse at 92% 32%, rgba(34, 211, 238, 0.08), transparent 34%), linear-gradient(180deg, #0b0b15 0%, #080910 52%, #07080d 100%)",
        }}
      />
      <div className="relative z-10">
        <ChannelHeader title="Creator Analytics" backTo="/settings" />

        <div className="mx-auto max-w-2xl">
          <div className="flex gap-2 overflow-x-auto px-4 pt-5 no-scrollbar">
            {([7, 30, 90, "lifetime"] as const).map((period) => (
              <button
                key={period}
                type="button"
                data-testid={`analytics-period-${period}`}
                aria-pressed={periodDays === period}
                onClick={() => setPeriodDays(period)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  periodDays === period
                    ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-[0_8px_24px_-10px_rgba(217,70,239,0.85)]"
                    : "border border-white/10 bg-white/[0.045] text-slate-300 backdrop-blur-xl hover:bg-white/[0.09]"
                }`}
              >
                {period === "lifetime" ? "Lifetime" : `Last ${period} days`}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:gap-4">
            {cards.map((card) => (
              <AnalyticsStatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="px-4 pt-4">
            <section className="overflow-hidden rounded-[28px] border border-white/[0.1] bg-white/[0.045] shadow-[0_22px_65px_-42px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Top Performing
                </p>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.045] px-2.5 py-1 text-[10px] font-medium text-slate-400">
                  {top.length === 0 ? "0 items" : loading ? "…" : `${top.length} items`}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 border-t border-white/[0.06] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                <span>Video</span>
                <span className="text-right">Views</span>
              </div>
              <ul data-testid="creator-analytics-top-list">
                {loading ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-400">Loading content…</li>
                ) : top.map((item) => (
                  <li
                    key={item.id}
                    data-testid={`creator-analytics-item-${item.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 border-t border-white/[0.06] px-4 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <VideoPoster
                        mediaUrl={item.mediaUrl}
                        thumbnailUrl={item.thumb}
                        alt={item.title}
                        className="h-12 w-[4.25rem] shrink-0 rounded-xl"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-white">{item.title}</span>
                        <span className="block pt-0.5 text-[11px] text-slate-400">{item.publishedAt}</span>
                      </span>
                    </span>
                    <span
                      data-testid="creator-analytics-item-views"
                      className="text-right text-xs font-semibold tabular-nums text-slate-100"
                    >
                      {loading && item.views !== 0 ? "…" : formatCount(item.views)}
                    </span>
                  </li>
                ))}
                {!loading && top.length === 0 && (
                  <li className="border-t border-white/[0.06] px-4 py-8 text-center text-sm text-slate-400">
                    No published content yet.
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function AnalyticsStatCard({
  label,
  value,
  icon,
  accent,
  hint,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
  hint?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-[26px] border border-white/[0.1] bg-white/[0.045] p-4 shadow-[0_18px_55px_-38px_rgba(120,90,255,0.65)] backdrop-blur-2xl sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-violet-400/[0.12] blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-[11px]">
          {label}
        </p>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.055] ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="relative pt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
        {value}
      </p>
      {hint && <p className="relative pt-1 text-[10px] text-slate-400 sm:text-[11px]">{hint}</p>}
    </section>
  );
}
