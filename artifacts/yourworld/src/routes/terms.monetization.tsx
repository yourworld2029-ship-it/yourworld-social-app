import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { historyBackLink } from "@/lib/navigation";

export const Route = createFileRoute("/terms/monetization")({
  head: () => ({
    meta: [
      { title: "Creator Monetization Terms — YourWorld" },
      {
        name: "description",
        content:
          "Creator revenue sharing, payout schedules, tax compliance and content integrity terms for YourWorld.",
      },
      { property: "og:title", content: "Creator Monetization Terms — YourWorld" },
      {
        property: "og:description",
        content: "Revenue sharing, payout, TDS and content integrity terms for YourWorld creators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatorMonetizationTermsPage,
});

function PolicySection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#141418] p-4">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <FileText className="h-4 w-4 text-indigo-300" />
        {number}. {title}
      </h2>
      <div className="space-y-2 pt-2 text-sm leading-relaxed text-zinc-300">{children}</div>
    </section>
  );
}

function CreatorMonetizationTermsPage() {
  return (
    <main className="min-h-screen bg-[#09090b] pb-12 text-white">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/settings"
            onClick={historyBackLink}
            className="rounded-lg p-1 text-zinc-300 hover:text-white"
            aria-label="Back to settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Creator policy
            </p>
            <h1 className="text-xl font-bold">Creator Monetization Terms</h1>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-sm leading-relaxed text-indigo-100">
          These terms apply when you submit payout details, apply for monetization, or request a
          creator payout. Last updated: September 20, 2026.
        </div>

        <div className="space-y-3">
          <PolicySection number="1" title="Revenue Sharing">
            <p>
              <strong className="text-white">Direct Sales (Courses, VIP Batches):</strong> Creator
              receives 85% of the base list price. A 2% processing fee is collected from buyers to
              cover gateway transaction processing. Platform retains a 15% service fee.
            </p>
            <p>
              <strong className="text-white">Advertising & Digital Impressions:</strong> Net
              advertising revenue is distributed on a 70% Creator / 30% Platform basis.
            </p>
          </PolicySection>

          <PolicySection number="2" title="Payout Schedule & Thresholds">
            <p>
              The minimum withdrawal threshold is ₹5,000. Payouts are scheduled on creator-chosen
              15-day or 30-day settlement cycles following profile verification.
            </p>
          </PolicySection>

          <PolicySection number="3" title="Tax Compliance (TDS)">
            <p>
              As per Section 194-O of the Indian Income Tax Act, a statutory 1% Tax Deducted at
              Source (TDS) will be deducted on all gross platform payouts and deposited against the
              creator&apos;s PAN.
            </p>
          </PolicySection>

          <PolicySection number="4" title="Content Integrity">
            <p>
              Creators warrant that all uploaded courses and videos are original. Piracy or
              community guideline violations will lead to wallet suspension.
            </p>
          </PolicySection>
        </div>

        <Link
          to="/wallet"
          className="mt-5 flex items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-black"
        >
          <CheckCircle2 className="h-4 w-4" />
          Return to monetization wallet
        </Link>
      </div>
    </main>
  );
}