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
            <li>I confirm that all information submitted by me is true and accurate.</li>
            <li>
              I am responsible for the authenticity of my award certificate, gazette records, and
              identity information.
            </li>
            <li>Fake, forged, altered or misleading documents/information are strictly prohibited.</li>
            <li>YourWorld may reject or revoke verification if submitted information is found to be false.</li>
            <li>YourWorld may restrict or suspend accounts involved in fraudulent verification.</li>
            <li>
              YourWorld may take appropriate legal action or other remedies permitted under applicable
              law where applicable.
            </li>
            <li>
              Verification documents remain private and are used strictly for verification purposes.
            </li>
            <li>
              The Award Introduction video may be displayed publicly as part of the verified award
              profile.
            </li>
            <li>
              YourWorld may retain verification records/evidence for legitimate security, verification
              and legal purposes.
            </li>
            <li>Verification review typically takes between 12 to 72 working hours.</li>
            <li>
              YourWorld reserves the right to cross-verify award credentials with official government
              gazettes, ministries, or official honours portals.
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