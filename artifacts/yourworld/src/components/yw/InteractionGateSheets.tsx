import { ArrowRight, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";

type InteractionGateSheetsProps = {
  authOpen: boolean;
  onCloseAuth: () => void;
  onContinueAuth: () => void;
};

function Overlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function JoinYourWorldSheet({
  onClose,
  onContinue,
}: {
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-yourworld-title"
        className="w-full max-w-lg rounded-t-[28px] border border-white/10 bg-[#111018] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-5 text-white shadow-2xl sm:rounded-[28px] sm:pb-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg shadow-pink-500/20">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign-in prompt"
            className="grid h-10 w-10 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-300">
          YOURWORLD
        </p>
        <h2
          id="join-yourworld-title"
          className="mt-2 font-display text-2xl font-bold tracking-tight"
        >
          Join YOURWORLD
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
          Create an account or sign in to join the conversation and connect with creators.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:brightness-110 active:scale-[0.99]"
        >
          Log in or sign up
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-10 w-full rounded-full text-sm font-medium text-white/55 transition hover:text-white"
        >
          Maybe later
        </button>
      </section>
    </Overlay>
  );
}

export function InteractionGateSheets({
  authOpen,
  onCloseAuth,
  onContinueAuth,
}: InteractionGateSheetsProps) {
  return (
    <>
      {authOpen ? (
        <JoinYourWorldSheet onClose={onCloseAuth} onContinue={onContinueAuth} />
      ) : null}
    </>
  );
}