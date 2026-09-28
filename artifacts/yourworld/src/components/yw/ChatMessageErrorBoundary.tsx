import React from "react";

export class ChatMessageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[chat-message] renderer failed", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="mx-auto max-w-[85%] rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-center text-xs text-zinc-300"
        >
          This message couldn’t be displayed. The rest of the chat is still available.
        </div>
      );
    }
    return this.props.children;
  }
}