import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Copyright,
  HeartHandshake,
  Mail,
  ShieldCheck,
  Trophy,
  Video,
} from "lucide-react";
import { historyBackLink } from "@/lib/navigation";

export const Route = createFileRoute("/community-guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — YourWorld" },
      {
        name: "description",
        content:
          "YourWorld Community Guidelines for respectful, authentic, safe, and inspiring participation.",
      },
      { property: "og:title", content: "Community Guidelines — YourWorld" },
      {
        property: "og:description",
        content: "Guidelines to keep YourWorld safe, positive, and inspiring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityGuidelinesPage,
});

function GuidelineSection({
  icon: Icon,
  number,
  title,
  children,
}: {
  icon: typeof HeartHandshake;
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
      <div className="space-y-3 text-sm leading-relaxed text-zinc-300">{children}</div>
    </section>
  );
}

function GuidelineItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <span className="font-semibold text-white">{title}:</span> {children}
    </li>
  );
}

function CommunityGuidelinesPage() {
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
            Safety
          </p>
          <h1 className="text-lg font-semibold">Community Guidelines</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 to-transparent p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-500/20">
              <HeartHandshake className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">YourWorld Community Guidelines</h2>
              <p className="mt-1 text-xs text-zinc-500">Last updated: September 22, 2026</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Find our guidelines below to keep YourWorld safe, positive, and inspiring.
              </p>
            </div>
          </div>
        </div>

        <GuidelineSection icon={HeartHandshake} number="1" title="Respect All Creators & Players">
          <ul className="list-disc space-y-2 pl-5">
            <GuidelineItem title="No Bullying & Harassment">
              Abusing, targeting, or degrading any user is strictly banned.
            </GuidelineItem>
            <GuidelineItem title="No Hate Speech">
              Hate speech based on religion, race, gender, or nationality will result in an immediate
              ban.
            </GuidelineItem>
            <GuidelineItem title="Respect Rivalry">
              Sports rivalry must remain respectful; abusive behavior and violence are prohibited.
            </GuidelineItem>
          </ul>
        </GuidelineSection>

        <GuidelineSection icon={Trophy} number="2" title="Fair Play & Authentic Accounts">
          <ul className="list-disc space-y-2 pl-5">
            <GuidelineItem title="Sportsman Spirit">
              Encourage healthy competition. Impersonation and fake profiles are strictly banned.
            </GuidelineItem>
            <GuidelineItem title="No Scam or Spam">
              Spamming comments or promoting fraudulent schemes is prohibited.
            </GuidelineItem>
          </ul>
        </GuidelineSection>

        <GuidelineSection icon={Video} number="3" title="Sports Verification Integrity">
          <ul className="list-disc space-y-2 pl-5">
            <GuidelineItem title="No Fake Certificates">
              Using forged or someone else&apos;s credentials to get a sports badge is prohibited and
              will lead to badge revocation and account restriction.
            </GuidelineItem>
            <GuidelineItem title="Authentic Videos">
              The Sports Intro video must feature your own natural voice and genuine achievements.
            </GuidelineItem>
          </ul>
        </GuidelineSection>

        <GuidelineSection icon={AlertTriangle} number="4" title="Violence, Harmful & Mature Content">
          <ul className="list-disc space-y-2 pl-5">
            <GuidelineItem title="No Violence">
              Posting violent, dangerous, or self-harm content is prohibited.
            </GuidelineItem>
            <GuidelineItem title="No Adult/Sensitive Content">
              Sexual, explicit, and mature content is strictly banned.
            </GuidelineItem>
            <GuidelineItem title="Minor Safety">
              Content endangering children is strictly prohibited.
            </GuidelineItem>
          </ul>
        </GuidelineSection>

        <GuidelineSection icon={Copyright} number="5" title="Intellectual Property">
          <ul className="list-disc space-y-2 pl-5">
            <GuidelineItem title="Respect Original Work">
              Only post content you own or are authorized to use (refer to our{" "}
              <Link to="/copyright-policy" className="text-indigo-300 underline underline-offset-2">
                Copyright &amp; DMCA Policy
              </Link>
              ).
            </GuidelineItem>
          </ul>
        </GuidelineSection>

        <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-300" />
            <h2 className="text-base font-semibold text-white">Report Violations</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            If you spot any violations, report them via the app. Our compliance desk reviews reports
            within 12–72 hours. Email:{" "}
            <a
              href="mailto:yourworld2029@gmail.com"
              className="font-semibold text-indigo-200 underline underline-offset-2"
            >
              yourworld2029@gmail.com
            </a>
          </p>
          <Mail className="sr-only" aria-hidden="true" />
        </section>
      </div>
    </main>
  );
}