import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { submitPublicAccountDeletionRequest } from "@/lib/account-deletion-request.functions";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete Your Account — YourWorld" },
      {
        name: "description",
        content: "Submit a YourWorld account deletion request or contact our privacy desk.",
      },
      { property: "og:title", content: "Delete Your Account — YourWorld" },
      {
        property: "og:description",
        content: "Submit a YourWorld account deletion request without signing in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const sendRequest = useServerFn(submitPublicAccountDeletionRequest);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const result = await sendRequest({ data: { email, username, website } });
      if (!result.sent) {
        setError(result.message);
        return;
      }
      setSuccess(true);
      setEmail("");
      setUsername("");
    } catch (requestError) {
      console.error("[account-deletion-request] submission failed", requestError);
      setError("We couldn't send your request right now. Please email Yourworld2029@gmail.com directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/privacy"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
        >
          <ArrowLeft size={18} />
          Privacy Policy
        </Link>

        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            YourWorld Privacy
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Account deletion request</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
            Use this public form without signing in, or email{" "}
            <a
              href="mailto:Yourworld2029@gmail.com?subject=Account%20deletion%20request"
              className="text-indigo-300 underline underline-offset-4"
            >
              Yourworld2029@gmail.com
            </a>
            . We will verify account ownership before processing the request.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          {success ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <h2 className="font-semibold text-emerald-100">Request sent</h2>
                <p className="mt-1 text-sm leading-5 text-zinc-300">
                  Your request was sent to our privacy desk. We will contact you to verify ownership.
                  Submitting this form does not immediately delete your account.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-medium">
                  Contact email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="account-username" className="mb-2 block text-sm font-medium">
                  YourWorld username <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  id="account-username"
                  type="text"
                  autoComplete="username"
                  maxLength={80}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
                  placeholder="@username"
                />
              </div>

              <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Sending request…" : "Submit deletion request"}
              </button>
            </form>
          )}
        </section>

        <aside className="mt-5 flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
          <p className="text-sm leading-5 text-zinc-400">
            For your protection, we verify that you control the account before deletion. Any data
            retained for legal, payment, security, or dispute-resolution requirements is handled as
            described in the{" "}
            <Link to="/privacy" className="text-indigo-300 underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </aside>

        <a
          href="mailto:Yourworld2029@gmail.com?subject=Account%20deletion%20request"
          className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
        >
          <Mail size={16} />
          Contact Yourworld2029@gmail.com
        </a>
      </div>
    </main>
  );
}
