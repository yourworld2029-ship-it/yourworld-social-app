import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Coins, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChannelHeader } from "@/components/yw/ChannelHeader";
import { formatCount, MONETIZATION, useChannelData } from "@/lib/channel-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/channel/monetization")({
  head: () => ({
    meta: [
      { title: "Channel Monetization — YourWorld" },
      {
        name: "description",
        content:
          "Check your monetization eligibility and start earning from your YourWorld channel once you qualify.",
      },
      { property: "og:title", content: "Channel Monetization — YourWorld" },
      { property: "og:description", content: "Eligibility, requirements and earnings for your channel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChannelMonetization,
});

function ChannelMonetization() {
  const { stats, loading, watchTimeError } = useChannelData();
  const [applying, setApplying] = useState(false);
  const reqs = [
    {
      label: `${formatCount(MONETIZATION.minSubscribers)} subscribers`,
      value: stats.subscribers,
      target: MONETIZATION.minSubscribers,
    },
    {
      label: `${formatCount(MONETIZATION.minWatchHours)} watch hours`,
      value: stats.watchHours,
      target: MONETIZATION.minWatchHours,
    },
  ];
  const eligible = !loading && !watchTimeError && reqs.every((r) => r.value >= r.target);

  return (
    <main className="min-h-screen pb-12">
      <ChannelHeader title="Monetization" />

      <div className="px-4 pt-4">
        <div className="surface-card flex items-start gap-3 rounded-3xl p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary">
            {eligible ? (
              <Coins className="h-5 w-5" strokeWidth={1.7} />
            ) : (
              <Lock className="h-[18px] w-[18px]" strokeWidth={1.7} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {loading
                ? "Loading eligibility…"
                : eligible
                  ? "You're eligible to monetize"
                  : "Monetization locked"}
            </p>
            <p className="pt-0.5 text-xs leading-relaxed text-muted-foreground">
              {loading
                ? "Checking your live channel requirements."
                : watchTimeError
                  ? "Watch time is temporarily unavailable. Try again shortly."
                  : eligible
                    ? "Apply once and earnings start on your next published video."
                    : "Keep publishing — monetization unlocks automatically when you meet both requirements."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {reqs.map((r) => {
          const pct = Math.min(100, Math.round((r.value / r.target) * 100));
          const done = r.value >= r.target;
          return (
            <section key={r.label} className="surface-card rounded-3xl p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full ${
                    done ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={2.4} />
                </span>
                <p className="flex-1 text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : formatCount(r.value)} / {formatCount(r.target)}
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
              </div>
            </section>
          );
        })}
      </div>

      <div className="px-4 pt-4">
        <Button
          className="h-11 w-full rounded-full"
          disabled={loading || applying || !!watchTimeError || !eligible}
          onClick={() => {
            void (async () => {
              setApplying(true);
              try {
                const { data } = await supabase.auth.getSession();
                const uid = data.session?.user.id;
                if (!uid) throw new Error("Sign in to apply for monetization");
                const { error } = await supabase.from("creator_payout_profiles").upsert(
                  { user_id: uid, monetization_eligible: true },
                  { onConflict: "user_id" },
                );
                if (error) throw new Error(error.message);
                toast.success("Monetization application submitted for review");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Application failed");
              } finally {
                setApplying(false);
              }
            })();
          }}
        >
          {loading
            ? "Checking eligibility…"
            : applying
              ? "Submitting…"
              : eligible
                ? "Apply for monetization"
                : "Not eligible yet"}
        </Button>
      </div>
    </main>
  );
}
