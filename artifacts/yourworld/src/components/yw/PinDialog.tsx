import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";

function haptic(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined") navigator.vibrate?.(pattern);
  } catch {
    // Haptics are optional and may be unavailable in a browser or WebView.
  }
}

/**
 * Premium in-app PIN prompt used by Social and Orbit Secret Lock.
 */
export function PinDialog({
  open,
  title,
  description,
  confirmLabel = "Continue",
  error,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  error?: string | null;
  onCancel?: () => void;
  onSubmit: (pin: string) => boolean | void | Promise<boolean | void>;
}) {
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(Boolean(error));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setSubmitting(false);
    setShowError(Boolean(error));
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, error]);

  if (!open) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin.length < 4 || submitting) return;

    setSubmitting(true);
    haptic(10);
    void (async () => {
      try {
        const accepted = await onSubmit(pin);
        if (accepted === false) {
          setPin("");
          setShowError(true);
          haptic(24);
        } else {
          setShowError(false);
          haptic([8, 35, 12]);
        }
      } catch {
        setPin("");
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
        onSubmit={submit}
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/25 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,0.15)]">
          <Lock size={22} className="text-violet-300" strokeWidth={1.8} />
        </div>
        <div className="mt-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mx-auto mt-1.5 max-w-[260px] text-xs leading-5 text-zinc-400">
              {description}
            </p>
          )}
        </div>

        <div className="relative mx-auto mt-7 w-fit rounded-2xl outline-none transition-[filter] duration-200 focus-within:drop-shadow-[0_0_12px_rgba(168,85,247,0.22)]">
          <div className="flex gap-1.5 sm:gap-2" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => {
              const filled = index < pin.length;
              const active = index === pin.length && pin.length < 8;
              return (
                <span
                  key={index}
                  className={`grid h-9 w-[27px] place-items-center rounded-xl border transition-all duration-200 sm:h-10 sm:w-8 ${
                    filled
                      ? "scale-[1.03] border-violet-300/60 bg-violet-400/15"
                      : active
                        ? "border-fuchsia-300/80 bg-fuchsia-400/10 shadow-[0_0_14px_rgba(217,70,239,0.18)]"
                        : "border-white/10 bg-white/[0.035]"
                  }`}
                >
                  {filled && (
                    <span className="h-2 w-2 rounded-full bg-violet-100 shadow-[0_0_8px_rgba(196,181,253,0.75)]" />
                  )}
                </span>
              );
            })}
          </div>
          <input
            ref={inputRef}
            value={pin}
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, "").slice(0, 8);
              if (next.length > pin.length) haptic(7);
              setPin(next);
              setShowError(false);
            }}
            inputMode="numeric"
            type="password"
            autoComplete="one-time-code"
            autoFocus
            maxLength={8}
            pattern="[0-9]{4,8}"
            aria-label={`${title} PIN, 4 to 8 digits`}
            aria-describedby={showError && error ? "secret-pin-error" : undefined}
            className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
          />
        </div>
        <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          4–8 digit PIN
        </p>
        {showError && error && (
          <p id="secret-pin-error" role="alert" className="mt-3 text-xs font-medium text-rose-300">
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
            disabled={pin.length < 4 || submitting}
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