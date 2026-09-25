import { ArrowRight, Download, MessageCircle, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";

type InteractionGateSheetsProps = {
  authOpen: boolean;
  chatDownloadOpen: boolean;
  onCloseAuth: () => void;
  onContinueAuth: () => void;
  onCloseChatDownload: () => void;
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

function DownloadCardContent() {
  return (
    <>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 text-pink-200 ring-1 ring-white/10">
        <MessageCircle className="h-6 w-6" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-pink-300">
        YOURWORLD for Android
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
        Private chats are in the app
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/65">
        Download YOURWORLD for Android to send private messages and view ephemeral media.
      </p>
      <a
        href="/yourworld-v3.apk"
        download="yourworld-v3.apk"
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:brightness-110 active:scale-[0.99]"
      >
        <Download className="h-4 w-4" />
        Download Android app
      </a>
    </>
  );
}

export function PrivateChatDownloadCard({
  mode = "page",
  onClose,
}: {
  mode?: "page" | "modal";
  onClose?: () => void;
}) {
  const content = (
    <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111018] px-6 py-7 text-center shadow-2xl sm:px-8">
      {mode === "modal" && onClose ? (
        <div className="mb-1 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close app download prompt"
            className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <DownloadCardContent />
      {mode === "modal" && onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-10 w-full rounded-full text-sm font-medium text-white/55 transition hover:text-white"
        >
          Not now
        </button>
      ) : null}
    </div>
  );

  if (mode === "modal") {
    return (
      <Overlay onClose={onClose ?? (() => {})}>
        {content}
      </Overlay>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#09080d] px-4 py-10">
      {content}
    </main>
  );
}

export function InteractionGateSheets({
  authOpen,
  chatDownloadOpen,
  onCloseAuth,
  onContinueAuth,
  onCloseChatDownload,
}: InteractionGateSheetsProps) {
  return (
    <>
      {authOpen ? (
        <JoinYourWorldSheet onClose={onCloseAuth} onContinue={onContinueAuth} />
      ) : null}
      {chatDownloadOpen ? (
        <PrivateChatDownloadCard mode="modal" onClose={onCloseChatDownload} />
      ) : null}
    </>
  );
}