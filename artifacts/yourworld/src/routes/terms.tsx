import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { historyBackLink } from "@/lib/navigation";

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
          <Link to="/settings" onClick={historyBackLink} className="p-1 text-zinc-300 hover:text-white">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>

        <p className="text-xs text-zinc-500 mb-6">Last updated: September 22, 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using YourWorld ("YW"), you agree to be bound by these Terms of
            Service. If you do not agree, you may not access or use the platform. YourWorld is owned
            and operated by YourWorld Social (Proprietorship, India).
          </p>
          <p>
            YourWorld is available to users worldwide. You may access the platform and upload content recorded
            in different countries, subject to applicable laws, these Terms, our platform rules, and your rights
            and permissions in that content. We do not represent that YourWorld is automatically compliant with
            every country's laws; requirements may vary based on where you live or use the platform.
          </p>
        </Section>

        <Section title="2. Your Account">
          <p>
            You are responsible for safeguarding your account credentials and for all activity that occurs under
            your account. You must be at least 13 years old (or the minimum age required in your country) to use
            YourWorld. Creators receiving payouts or participating in monetization features must be at least 18
            years old.
          </p>
        </Section>

        <Section title="3. Content & Conduct">
          <p>
            You retain ownership of content you post. You grant YourWorld Social a worldwide, non-exclusive,
            royalty-free license to host, store, use, display, and distribute your content within the platform
            ecosystem. You must not post content that is unlawful, infringing, hateful, harassing, sexually
            explicit, violent, or that violates our Community Guidelines.
          </p>
          <p>
            You are responsible for having all rights, permissions, consents, and legal authority necessary to
            upload and share your content, including photos, videos, posts, reels, stories, messages, and other
            material.
          </p>
        </Section>

        <Section title="4. Sports Verification">
          <p>
            Sports Verification may require supporting evidence such as certificates, tournament photos, identity
            or contact information, or other evidence where applicable. All submitted verification documents and
            identity or contact evidence are private and are not publicly displayed to normal users.
          </p>
          <p>
            Verification materials may be accessed only by authorized verification or safety personnel when
            necessary for verification, security, fraud prevention, legal compliance, or related legitimate
            purposes. YourWorld may support both National Player or Coach verification and International Player
            or Coach verification, including international sporting events held outside India.
          </p>
          <p>
            The Sports Introduction video is separate from private verification documents. It is a short video
            recorded by the Player or Coach in their natural or original voice and may explain their sport, role,
            achievements, and journey. It may be publicly displayed on YourWorld as a Reel-style Sports
            Introduction or verification video. Certificates, phone numbers, email addresses, and other private
            verification evidence must not be made public.
          </p>
          <p>
            Submitting false, forged, altered, misleading, or fraudulent certificates, achievements, identity
            information, or verification evidence may result in rejection or revocation of verification, removal
            of a sports badge, content removal, account restriction or suspension, and other remedies permitted by
            applicable law.
          </p>
        </Section>

        <Section title="5. Monetization & Payments">
          <p>
            Creators participating in eligible monetization features or paid promotional or Promote features, when
            available and officially enabled by YourWorld, are subject to the applicable{" "}
            <Link to="/terms/monetization" className="text-indigo-400 underline">
              Creator Monetization Terms
            </Link>
            . Eligibility, platform commission (net 15% platform fee), payout schedules, payment processing fees,
            and tax requirements are governed by those terms.
          </p>
          <p>
            Payouts, where offered, are processed according to the applicable eligibility requirements and
            schedule. YourWorld does not promise earnings, guaranteed reach, views, impressions, followers,
            engagement, or sales. All consumer purchases (such as digital tips, coins, or virtual goods) provide
            immediate access and are non-refundable once delivered, except in verifiable cases of duplicate billing
            or technical failed transactions.
          </p>
        </Section>

        <Section title="6. Promotion">
          <p>
            Paid Promote or advertising features, when available, are subject to eligibility requirements,
            applicable advertising rules, payment terms, and YourWorld policies. Promoted content does not
            guarantee impressions, views, followers, engagement, or sales.
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
            YourWorld respects intellectual property rights. See our{" "}
            <Link to="/copyright-policy" className="text-indigo-400 underline">
              Copyright & DMCA Policy
            </Link>{" "}
            for our takedown procedure and designated agent contact details.
          </p>
        </Section>

        <Section title="9. Termination, Suspension & Asset Forfeiture">
          <p>
            YourWorld reserves the right to suspend, restrict, or terminate your account at any time if you
            violate these Terms, our Community Guidelines, our Copyright & DMCA Policy, applicable law, or if we
            detect fraudulent, abusive, or unauthorized commercial activities. You may delete your account at any
            time from Settings.
          </p>
          <p>
            Upon suspension or termination of an account due to policy violations, illegal conduct, copyright
            infringement, or fraudulent behavior, any accumulated virtual wallet balance, unredeemed coins, or
            promotional credits shall be forfeited. YourWorld Social explicitly reserves the right to freeze,
            withhold, or offset pending payouts and balances against damages, chargebacks, third-party claims, or
            administrative and legal expenses.
          </p>
        </Section>

        <Section title="10. Disclaimer & Limitation of Liability">
          <p>
            YourWorld is provided "as is" and "as available" without warranties of any kind, whether express or
            implied. YourWorld Social operates as an intermediary under Section 79 of the Information Technology
            Act, 2000, and does not actively monitor or endorse user-generated content. To the maximum extent
            permitted by applicable law, YourWorld Social shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising out of or related to your use of the platform.
          </p>
        </Section>

        <Section title="11. Governing Law & Dispute Resolution">
          <p>
            These Terms shall be governed by, interpreted, and construed in accordance with the substantive laws
            of India. Any legal dispute, controversy, claim, or action arising out of or relating to these Terms or
            the platform shall be subject to the exclusive jurisdiction of the competent courts situated in Hisar,
            Haryana, India.
          </p>
        </Section>

        <Section title="12. Contact & Grievance Redressal">
          <p>
            In accordance with the Information Technology Act, 2000 and the Intermediary Guidelines and Digital
            Media Ethics Code Rules, 2021:
          </p>
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold text-white">Enterprise Legal Name</dt>
              <dd>YourWorld Social</dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Grievance & Compliance Officer</dt>
              <dd>S. Kumar</dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Official Support & Grievance Email</dt>
              <dd>
                <a href="mailto:yourworld2029@gmail.com" className="text-indigo-400 underline">
                  yourworld2029@gmail.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Jurisdiction / City</dt>
              <dd>Hisar, Haryana, India</dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Response Timelines</dt>
              <dd>Acknowledgment within 24–48 hours; resolution within 15 working days.</dd>
            </div>
          </dl>
        </Section>
      </div>
    </div>
  );
}
