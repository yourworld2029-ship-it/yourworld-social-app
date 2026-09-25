import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type HoldToRevealButtonProps = {
  onReveal: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel: string;
};

const HOLD_DURATION_MS = 650;

export function HoldToRevealButton({
  onReveal,
  children,
  className,
  disabled = false,
  ariaLabel,
}: HoldToRevealButtonProps) {
  const timerRef = useRef<number | null>(null);
  const onRevealRef = useRef(onReveal);
  const disabledRef = useRef(disabled);
  const [holding, setHolding] = useState(false);
  onRevealRef.current = onReveal;
  disabledRef.current = disabled;

  const cancelHold = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }, []);

  const startHold = useCallback(() => {
    if (disabledRef.current || timerRef.current !== null) return;
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setHolding(false);
      if (!disabledRef.current) onRevealRef.current();
    }, HOLD_DURATION_MS);
  }, []);

  useEffect(() => {
    const cancelWhenHidden = () => {
      if (document.visibilityState === "hidden") cancelHold();
    };
    window.addEventListener("blur", cancelHold);
    document.addEventListener("visibilitychange", cancelWhenHidden);
    return () => {
      window.removeEventListener("blur", cancelHold);
      document.removeEventListener("visibilitychange", cancelWhenHidden);
    };
  }, [cancelHold]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      data-holding={holding ? "true" : undefined}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        startHold();
      }}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onBlur={cancelHold}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") cancelHold();
      }}
      onContextMenu={(event) => event.preventDefault()}
      className={`${className ?? ""} ${holding ? "opacity-75" : ""}`.trim()}
    >
      {children}
    </button>
  );
}