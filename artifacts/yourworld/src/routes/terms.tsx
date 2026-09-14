import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — YourWorld" },
      {
        name: "description",
        content:
          "YourWorld Terms of Service — the rules and conditions that govern your use of the YourWorld social platform.",
      },
      { property: "og:title", content: "Terms of Service — YourWorld" },
      {
        property: "og:description",
        content: "Rules and conditions that govern your use of the YourWorld social platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <FileText size={18} className="text-indigo-400" />
        {title}
      </h2>
      <div className="text-sm text-zinc-300 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/settings" className="p-1 text-zinc-300 hover:text-white">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>

        <p className="text-xs text-zinc-500 mb-6">Last updated: August 30, 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using YourWorld ("YW"), you agree to be bound by these Terms of
            Service. If you do not agree, you may not access or use the platform.
          </p>
          <p>
            YourWorld is available to users worldwide. You may access the platform and upload content
            recorded in different countries, subject to applicable laws, these Terms, our platform
            rules, and your rights and permissions in that content. We do not represent that YourWorld
            is automatically compliant with every country's laws; requirements may vary based on where
            you live or use the platform.
          </p>
        </Section>

        <Section title="2. Your Account">
          <p>
            You are responsible for safeguarding your account credentials and for all activity that
            occurs under your account. You must be at least 13 years old (or the minimum age in your
            country) to use YourWorld.
          </p>
        </Section>

        <Section title="3. Content & Conduct">
          <p>
            You retain ownership of content you post. You grant YourWorld a worldwide, non-exclusive,
            royalty-free license to host, store, use, display, and distribute your content within the
            platform. You must not post content that is unlawful, infringing, hateful, harassing, or
            that violates our Community Guidelines.
          </p>
          <p>
            You are responsible for having all rights, permissions, consents, and legal authority
            necessary to upload and share your content, including photos, videos, posts, reels,
            stories, messages, and other material.
          </p>
        </Section>

        <Section title="4. Sports Verification">
          <p>
            Sports Verification may require supporting evidence such as certificates, passport pages,
            visa or stamp pages, tournament photos, identity or contact information, or other evidence
            where applicable. All submitted verification documents and identity or contact evidence
            are private and are not publicly displayed to normal users.
          </p>
          <p>
            Verification materials may be accessed only by authorized verification or safety personnel
            when necessary for verification, security, fraud prevention, legal compliance, or related
            legitimate purposes. YourWorld may support both National Player or Coach verification and
            International Player or Coach verification, including international sporting events held
            outside India.
          </p>
          <p>
            The Sports Introduction video is separate from private verification documents. It is a
            short video recorded by the Player or Coach in their natural or original voice and may
            explain their sport, role, achievements, and journey. It may be publicly displayed on
            YourWorld as a Reel-style Sports Introduction or verification video. Certificates,
            passport pages, visa or stamp pages, phone numbers, email addresses, and other private
            verification evidence must not be made public.
          </p>
          <p>
            Submitting false, forged, altered, misleading, or fraudulent certificates, achievements,
            identity information, or verification evidence may result in rejection or revocation of
            verification, removal of a sports badge, content removal, account restriction or
            suspension, and other remedies permitted by applicable law.
          </p>
        </Section>

        <Section title="5. Monetization & Payments">
          <p>
            Creators participating in eligible monetization features or paid promotional or Promote
            features, when available and officially enabled by YourWorld, are subject to the
            applicable Monetization policies. Eligibility, revenue share, payout schedules, payment
            methods, fees, refunds, and tax requirements may be governed by separate
            monetization or payment terms where applicable.
          </p>
          <p>
            Payouts, where offered, are processed according to the applicable eligibility requirements
            and schedule. YourWorld does not promise earnings, guaranteed reach, views, impressions,
            followers, engagement, or sales.
          </p>
        </Section>

        <Section title="6. Promotion">
          <p>
            Paid Promote or advertising features, when available, are subject to eligibility
            requirements, applicable advertising rules, payment and refund rules, and YourWorld
            policies. Promoted content does not guarantee impressions, views, followers, engagement,
            or sales.
          </p>
        </Section>

        <Section title="7. Privacy">
          <p>
            Your use of YourWorld is also governed by our{" "}
            <Link to="/privacy" className="text-indigo-400 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            YourWorld respects intellectual property. See our{" "}
            <Link to="/copyright-policy" className="text-indigo-400 underline">
              Copyright & DMCA Policy
            </Link>{" "}
            for the takedown procedure and designated copyright agent.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            YourWorld may suspend, restrict, or terminate your account if you violate these Terms, our
            Community Guidelines, Copyright & DMCA Policy, or applicable law, or if we detect fraudulent
            activity. You may delete your account at any time from Settings.
          </p>
        </Section>

        <Section title="10. Disclaimer & Limitation of Liability">
          <p>
            YourWorld is provided "as is" without warranties of any kind. To the maximum extent
            permitted by applicable law, YourWorld shall not be liable for indirect, incidental, or
            consequential damages arising from your use of the platform.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:Yourworld2029@gmail.com" className="text-indigo-400 underline">
              Yourworld2029@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
