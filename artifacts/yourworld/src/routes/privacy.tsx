import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { historyBackLink } from "@/lib/navigation";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — YourWorld" },
      {
        name: "description",
        content:
          "YourWorld Privacy Policy — how we collect, use, store, and protect your personal information and content.",
      },
      { property: "og:title", content: "Privacy Policy — YourWorld" },
      {
        property: "og:description",
        content: "How YourWorld collects, uses, stores, and protects your personal information and content.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <ShieldCheck size={18} className="text-indigo-400" />
        {title}
      </h2>
      <div className="text-sm text-zinc-300 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/settings" onClick={historyBackLink} className="p-1 text-zinc-300 hover:text-white">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>

        <p className="text-xs text-zinc-500 mb-6">Last updated: October 29, 2026</p>

        <Section title="1. Information We Collect">
          <p>
            We collect the information you provide when you create an account (name, email, profile
            details), content you post, and usage data such as device, interactions, and logs.
            YourWorld is intended for users worldwide, so you may use the platform and upload
            photos, videos, and other content recorded in countries outside your country of residence.
          </p>
          <p>
            If you use Sports Verification, we may collect verification identity details and
            supporting evidence such as certificates, passport pages, visa or stamp pages, and
            tournament photos. Certificates, passport pages, visa or stamp pages, tournament
            evidence or photos, village/town, district, state, country and contact verification
            information, mobile numbers, email addresses, and other identity or verification
            evidence are private. They are never publicly displayed on your profile or to normal
            users.
          </p>
          <p>
            These private Sports Verification materials may only be accessed by authorized
            verification or safety personnel when necessary for verification, security, fraud
            prevention, legal compliance, or related legitimate purposes. Sports Verification may
            support both National Player or Coach verification and International Player or Coach
            verification, including competitions held outside India.
          </p>
          <p>
            A Sports Introduction video is different from private verification documents. It is a
            short video recorded by the Player or Coach using their natural or original voice, and
            may explain their sport, role, achievements, and journey. It may be publicly displayed
            on their YourWorld profile as a Reel-style Sports Introduction or verification video.
            It is not the same as private certificates, passport pages, visa or stamp pages, phone
            numbers, email addresses, identity details, or other verification evidence.
          </p>
        </Section>

        <Section title="2. How We Use Information">
          <p>
            We use your information to provide, personalize, and secure the YourWorld platform,
            enable features such as Feed, Reels, Stories, chat, calls, monetization, and to detect
            abuse and enforce our policies.
          </p>
        </Section>

        <Section title="3. Data Storage & Security">
          <p>
            Your data is stored with our backend provider and protected with Row-Level Security and
            access controls. Depending on where you use YourWorld and where our providers operate,
            information may be processed or stored internationally. Authentication tokens and
            sessions are handled securely. We do not sell your personal data.
          </p>
          <p>
            Photos, videos, posts, reels, and stories are stored and shown according to your
            audience and privacy choices. Chats and calls are handled to connect the intended
            participants; related messages, media, call signaling, and technical information may be
            processed as needed to provide and protect those features. User content is not publicly
            exposed beyond the visibility or participants you choose, and access is limited to
            authorized users and support or safety personnel when necessary.
          </p>
        </Section>

        <Section title="4. Data Retention & Deletion">
          <p>
            We keep account and profile information while your account is active. Posts, videos,
            Reels, Moments, and other content remain available according to your audience settings
            until you delete them or request account deletion. Deleting content removes it from
            normal access and active product views; limited copies may remain temporarily in
            provider backups or be retained where needed for security, dispute handling, or legal
            obligations.
          </p>
          <p>
            Messages and shared media are retained according to the conversation features and
            retention options in the app. If you enable timed deletion, eligible messages or media
            are removed under that setting. View Once media is handled separately and is not
            treated as a general conversation-retention setting.
          </p>
          <p>
            Private verification evidence, payment and tax records, reports, and records needed to
            investigate abuse or comply with law may be retained only for the time reasonably
            necessary for their stated purpose or the applicable legal requirement. Security,
            diagnostic, and delivery logs are kept only as long as needed to operate, protect, and
            troubleshoot the service. Backup expiry timing depends on the provider's backup cycle;
            restored copies are subject to deletion again.
          </p>
          <p>
            When an account-deletion request is verified and completed, we remove or anonymize
            associated personal data from active systems, except information we must keep for legal,
            payment, safety, fraud-prevention, or dispute-resolution purposes. Any retained
            information is restricted to that purpose and deleted or anonymized when no longer
            required.
          </p>
        </Section>

        <Section title="5. Sharing">
          <p>
            We share data only as necessary to operate the platform, comply with legal obligations, or
            respond to verified copyright takedown requests (see our{" "}
            <Link to="/copyright-policy" className="text-indigo-400 underline">
              Copyright & DMCA Policy
            </Link>
            ).
          </p>
          <p>
            Third-party service providers may process or store data on our behalf as necessary to
            operate the app. These providers may include hosting, authentication, storage, database,
            analytics, communications, moderation, payment, security, and infrastructure providers.
            Their processing is subject to the services they provide, applicable safeguards, and their
            own privacy policies.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>
            You may view, edit, or delete your account data from Settings. You can manage visibility,
            blocked accounts, and notifications at any time. Depending on your location, you may also
            have additional privacy rights or choices under applicable local law.
          </p>
          <p>
            You may request deletion of your YourWorld account and associated personal data by using
            <strong> Settings → Account → Delete My Account</strong>. If you cannot use that control,
            submit a request through the public{" "}
            <Link to="/delete-account" className="text-indigo-400 underline">
              account deletion request form
            </Link>{" "}
            or contact us at{" "}
            <a href="mailto:Yourworld2029@gmail.com?subject=Account%20deletion" className="text-indigo-400 underline">
              Yourworld2029@gmail.com
            </a>{" "}
            with an account-deletion request. We may need to verify the request. Deletion may be
            subject to limited retention required by law, fraud prevention, security, dispute
            resolution, or backups, after which retained data is deleted or anonymized.
          </p>
        </Section>

        <Section title="7. Cookies & Local Storage">
          <p>
            We use local storage and cookies to keep you signed in and remember preferences.
            Persistent authentication keeps you logged in across sessions unless you manually log out.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>YourWorld is not directed to children under 13 (or the applicable minimum age).</p>
        </Section>

        <Section title="9. Grievance Officer & Contact">
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or data
            processing practices, contact our designated Grievance Officer:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Grievance &amp; Compliance Officer: Legal &amp; Compliance Desk</li>
            <li>Enterprise: YourWorld Social</li>
            <li>
              Official Email:{" "}
              <a href="mailto:Yourworld2029@gmail.com" className="text-indigo-400 underline">
                Yourworld2029@gmail.com
              </a>
            </li>
            <li>Jurisdiction / Location: Hisar, Haryana, India</li>
          </ul>
          <p>
            In accordance with the Information Technology Act, 2000 and the Digital Personal Data
            Protection (DPDP) framework, we acknowledge privacy inquiries within 12–72 hours and
            resolve grievances expeditiously.
          </p>
        </Section>

        <Section title="10. Advertising — Google AdMob">
          <p>
            The current YourWorld app build does not include the Google Mobile Ads (AdMob) SDK and
            does not serve AdMob ads. If we enable AdMob, Google and its partners may process
            device/app information, IP address, approximate location, diagnostics, advertising IDs
            (such as Android Advertising ID or IDFA, where available), and ad impressions or
            interactions to deliver, measure, prevent fraud in, and limit advertising.
          </p>
          <p>
            Before enabling AdMob, we will update this policy and provide consent or privacy choices
            where required by law. Personalized ads will be shown only where permitted by the user's
            choices and applicable rules. Non-personalized ads may still use limited information
            needed for delivery, measurement, security, and fraud prevention. Users can also manage
            advertising-ID and ad-privacy controls through their device settings.
          </p>
        </Section>
      </div>
    </div>
  );
}
