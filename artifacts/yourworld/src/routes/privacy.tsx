import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

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
          <Link to="/settings" className="p-1 text-zinc-300 hover:text-white">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>

        <p className="text-xs text-zinc-500 mb-6">Last updated: August 30, 2026</p>

        <Section title="1. Information We Collect">
          <p>
            We collect the information you provide when you create an account (name, email, profile
            details), content you post, and usage data such as device, interactions, and logs. Orbit
            discovery data is stored separately with privacy-first controls.
          </p>
          <p>
            If you use Sports Verification, we may collect verification identity details and
            supporting evidence such as certificates, passport pages, visa or stamp pages, and
            tournament photos. These materials are private verification information and are never
            publicly displayed on your profile or to other users.
          </p>
        </Section>

        <Section title="2. How We Use Information">
          <p>
            We use your information to provide, personalize, and secure the YourWorld platform,
            enable features such as Feed, Reels, Stories, chat, calls, Orbit, monetization, and to
            detect abuse and enforce our policies.
          </p>
        </Section>

        <Section title="3. Data Storage & Security">
          <p>
            Your data is stored with our backend provider and protected with Row-Level Security and
            access controls. Authentication tokens and sessions are handled securely. We do not sell
            your personal data.
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

        <Section title="4. Sharing">
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

        <Section title="5. Your Rights">
          <p>
            You may view, edit, or delete your account data from Settings. You can manage visibility,
            blocked accounts, notifications, and Orbit privacy controls at any time.
          </p>
          <p>
            You may request deletion of your YourWorld account and associated personal data by using
            <strong> Settings → Account → Delete My Account</strong>. If you cannot use that control,
            contact us at{" "}
            <a href="mailto:Yourworld2029@gmail.com?subject=Account%20deletion" className="text-indigo-400 underline">
              Yourworld2029@gmail.com
            </a>{" "}
            with an account-deletion request. We may need to verify the request. Deletion may be
            subject to limited retention required by law, fraud prevention, security, dispute
            resolution, or backups, after which retained data is deleted or anonymized.
          </p>
        </Section>

        <Section title="6. Cookies & Local Storage">
          <p>
            We use local storage and cookies to keep you signed in and remember preferences.
            Persistent authentication keeps you logged in across sessions unless you manually log out.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>YourWorld is not directed to children under 13 (or the applicable minimum age).</p>
        </Section>

        <Section title="8. Contact">
          <p>
            Privacy questions? Contact us at{" "}
            <a href="mailto:Yourworld2029@gmail.com" className="text-indigo-400 underline">
              Yourworld2029@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="9. Future Advertising — Google AdMob">
          <p>
            YourWorld does not currently include the Google AdMob SDK or serve Google AdMob
            advertising. If AdMob is introduced in the future, Google and its advertising partners
            may process or store information needed to serve, measure, secure, and limit advertising,
            including device and app information, IP address, approximate location, diagnostics,
            advertising identifiers such as the Android Advertising ID or IDFA where applicable, and
            ad views or interactions.
          </p>
          <p>
            Where required by law, we will present consent choices before using data for personalized
            advertising. You will be able to make, change, or withdraw applicable consent choices
            through the controls we provide and through available device or platform settings.
            Non-personalized advertising may still use limited information necessary to deliver and
            measure ads. We will update this policy before enabling AdMob advertising.
          </p>
        </Section>
      </div>
    </div>
  );
}
