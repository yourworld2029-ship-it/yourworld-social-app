import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NationalAwardTermsSection({
  accepted,
  editable,
  busy,
  submitting,
  onAcceptedChange,
}: {
  accepted: boolean;
  editable: boolean;
  busy: boolean;
  submitting: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}) {
  return (
    <section
      data-testid="section-national-award-terms"
      className="mt-5 rounded-3xl border border-white/10 bg-white/[0.025] p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-amber-200 [&>svg]:h-4 [&>svg]:w-4">
          <ShieldCheck aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">Terms &amp; Conditions</h3>
          <p className="text-xs text-zinc-500">
            Review these requirements before submitting your National Award Profile for
            verification.
          </p>
        </div>
      </div>

      <details className="rounded-2xl border border-amber-200/15 bg-gradient-to-br from-amber-200/[0.08] via-white/[0.035] to-transparent">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-amber-100">
          <span className="flex items-center justify-between gap-3">
            <span>Verification terms</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Tap to read
            </span>
          </span>
        </summary>
        <div className="border-t border-white/10 px-4 py-3">
          <ul className="list-disc space-y-1.5 pl-5 text-xs leading-5 text-zinc-300">
            <li>
              I confirm that all information, identity details, and sports achievements submitted by me
              are genuine, true, and accurate.
            </li>
            <li>
              I bear full legal responsibility for the authenticity of my uploaded documents and
              credentials.
            </li>
            <li>
              Submission of fake, forged, or altered documents is strictly prohibited under applicable
              laws.
            </li>
            <li>
              YourWorld reserves the right to reject verification, revoke badges, suspend accounts, or
              take legal action against fraud.
            </li>
            <li>
              Identity documents and certificates remain strictly private and accessible only to
              authorized verification reviewers.
            </li>
            <li>
              I consent that my Introduction Video will be automatically published to my profile&apos;s
              Reels feed as a public sports intro upon submission.
            </li>
            <li>
              All details, uploaded files, and video will be locked from editing or deletion during the
              12 to 72-hour review period.
            </li>
            <li>Country selection is permanently locked upon submission to prevent misuse.</li>
            <li>
              YourWorld reserves the right to cross-verify claims with official sports federations and
              governing bodies.
            </li>
          </ul>
        </div>
      </details>

      {editable ? (
        <>
          <label
            data-testid="control-national-award-terms"
            className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-200"
          >
            <input
              type="checkbox"
              data-testid="checkbox-national-award-terms"
              checked={accepted}
              onChange={(event) => onAcceptedChange(event.target.checked)}
              className="mt-1 h-4 w-4 accent-amber-200"
            />
            <span>I Agree to the Terms &amp; Conditions</span>
          </label>
          <Button
            type="submit"
            data-testid="button-submit-national-award-verification"
            disabled={!accepted || busy}
            className="mt-4 w-full rounded-full bg-amber-200 text-black hover:bg-amber-100"
          >
            {submitting ? "Submitting…" : "Submit for Verification"}
          </Button>
        </>
      ) : null}
    </section>
  );
}