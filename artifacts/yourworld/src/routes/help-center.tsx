import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CircleHelp, Download, Mail, ShieldCheck, WalletCards } from "lucide-react";
import { historyBackLink } from "@/lib/navigation";

export const Route = createFileRoute("/help-center")({
  head: () => ({
    meta: [
      { title: "Help Center — YourWorld" },
      {
        name: "description",
        content:
          "YourWorld Help Center with account guides, Sports Verification help, payout information, and troubleshooting.",
      },
      { property: "og:title", content: "Help Center — YourWorld" },
      {
        property: "og:description",
        content: "Find answers to common questions, account guides, and platform troubleshooting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpCenterPage,
});

function HelpSection({
  icon: Icon,
  number,
  title,
  children,
}: {
  icon: typeof CircleHelp;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-indigo-400" />
        <h2 className="text-base font-semibold text-white">
          {number}. {title}
        </h2>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-zinc-300">{children}</div>
    </section>
  );
}

function Question({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold text-white">{question}</h3>
      <p className="mt-1.5">{children}</p>
    </div>
  );
}

function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-[#09090b] pb-12 text-white">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-[#09090b]/95 px-4 py-3 backdrop-blur">
        <Link
          to="/settings"
          onClick={historyBackLink}
          className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
          aria-label="Back to settings"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
            Support
          </p>
          <h1 className="text-lg font-semibold">YourWorld Help Center</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 to-transparent p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-500/20">
              <CircleHelp className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Find the help you need</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                Find answers to common questions, account guides, and platform troubleshooting.
              </p>
            </div>
          </div>
        </div>

        <HelpSection icon={ShieldCheck} number="1" title="Account & Sports Verification">
          <Question question="How do I apply for Sports Verification?">
            Go to Profile &gt; Settings &gt; Sports Verification. Submit required verification details
            and upload your authentic Sports Introduction video. Documents remain strictly private.
          </Question>
          <Question question="How do I delete or edit my account?">
            You can manage account settings or request profile deletion directly inside Settings &gt;
            Account.
          </Question>
        </HelpSection>

        <HelpSection icon={WalletCards} number="2" title="Monetization, Wallet & Payouts">
          <Question question="When are payouts processed?">
            Eligible creator payouts are processed according to schedule once verification and minimum
            payout thresholds are satisfied.
          </Question>
          <Question question="Are digital coin purchases refundable?">
            All virtual items and digital coin purchases provide instant utility and are non-refundable
            once delivered, except in verified cases of technical duplicate charges.
          </Question>
        </HelpSection>

        <HelpSection icon={ShieldCheck} number="3" title="Safety & Content Reporting">
          <Question question="How do I report inappropriate content or copyright violations?">
            Use the in-app &quot;Report a problem&quot; button on any post or go to Help &amp; Support
            &gt; Copyright &amp; DMCA Policy to file a formal takedown request.
          </Question>
        </HelpSection>

        <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15">
              <Download className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-white">Install the Android app</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                Download the latest YourWorld Android debug build directly to your phone.
              </p>
              <a
                href="/download-apk"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 active:bg-emerald-600 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-300" />
            <h2 className="text-base font-semibold text-white">4. Need more help?</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Email our official support desk directly at{" "}
            <a
              href="mailto:yourworld2029@gmail.com"
              className="font-semibold text-indigo-200 underline underline-offset-2"
            >
              yourworld2029@gmail.com
            </a>
            . We acknowledge queries within 12–72 hours.
          </p>
        </section>
      </div>
    </main>
  );
}