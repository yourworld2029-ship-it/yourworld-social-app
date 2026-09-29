import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { isValidSecretCode } from "@/lib/secret-pin";

function haptic(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined") navigator.vibrate?.(pattern);
  } catch {
    // Haptics are optional and may be unavailable in a browser or WebView.
  }
}

/**
 * Premium in-app PIN prompt used by Social Chat Secret Lock.
 */
export function PinDialog({
  open,
  title,
  description,
  confirmLabel = "Continue",
  error,
  onCancel,
  onSubmit,
  warning = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  error?: string | null;
  onCancel?: () => void;
  onSubmit: (secretCode: string) => boolean | void | Promise<boolean | void>;
  warning?: boolean;
}) {
  const [secretCode, setSecretCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(Boolean(error));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSecretCode("");
    setSubmitting(false);
    setShowError(Boolean(error));
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, error]);

  if (!open) return null;

  const submitPin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidSecretCode(secretCode) || submitting) return;

    setSubmitting(true);
    haptic(10);
    void (async () => {
      try {
        const accepted = await onSubmit(secretCode);
        if (accepted === false) {
          setSecretCode("");
          setShowError(true);
          haptic(24);
        } else {
          setShowError(false);
          haptic([8, 35, 12]);
        }
      } catch {
        setSecretCode("");
        setShowError(true);
        haptic(24);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-[240] grid place-items-center bg-black/85 px-5 backdrop-blur-xl">
      <form
        className="w-full max-w-sm rounded-[28px] border border-fuchsia-300/20 bg-gradient-to-b from-zinc-900/95 to-zinc-950 p-6 text-center text-white shadow-[0_24px_90px_rgba(0,0,0,0.7),0_0_48px_rgba(124,58,237,0.15)] transition-all duration-300 sm:p-7"
        onSubmit={submitPin}
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/25 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,0.15)]">
          <Lock size={22} className="text-violet-300" strokeWidth={1.8} />
        </div>
        <div className="mt-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p
              role={warning ? "alert" : undefined}
              className={`mx-auto mt-3 max-w-[300px] rounded-xl text-left text-xs leading-5 ${
                warning
                  ? "border border-amber-400/25 bg-amber-400/[0.08] px-3 py-2.5 text-amber-200"
                  : "text-center text-zinc-400"
              }`}
            >
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-6 text-left">
          <label
            htmlFor="secret-lock-code"
            className="mb-2 block text-xs font-medium text-zinc-300"
          >
            Enter 4-8 character Secret Code
          </label>
          <input
            ref={inputRef}
            id="secret-lock-code"
            value={secretCode}
            onChange={(event) => {
              const next = event.target.value.replace(/[^a-z\d]/gi, "").slice(0, 8);
              if (next.length > secretCode.length) haptic(7);
              setSecretCode(next);
              setShowError(false);
            }}
            type="password"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            maxLength={8}
            minLength={4}
            pattern="[A-Za-z0-9]{4,8}"
            placeholder="Enter 4-8 character Secret Code"
            aria-describedby={showError && error ? "secret-code-error" : undefined}
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60 focus:ring-2 focus:ring-violet-400/20"
          />
        </div>
        {showError && error && (
          <p id="secret-code-error" role="alert" className="mt-3 text-xs font-medium text-rose-300">
            {error}
          </p>
        )}

        <div className={`mt-6 flex gap-2.5 ${onCancel ? "" : "block"}`}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-zinc-300 transition-all duration-200 hover:bg-white/[0.08] active:scale-[0.98]"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={secretCode.length < 4 || submitting}
            className={`h-12 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-sm font-bold text-white shadow-[0_8px_28px_rgba(124,58,237,0.25)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
              onCancel ? "flex-1" : "w-full"
            }`}
          >
            {submitting ? (confirmLabel === "Unlock" ? "Unlocking…" : "Saving…") : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}