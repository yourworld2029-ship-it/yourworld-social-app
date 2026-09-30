import { Component, type ErrorInfo, type ReactNode } from "react";

type VideoPlayerErrorBoundaryProps = {
  children: ReactNode;
  onRetry: () => void;
  onBack?: () => void;
};

type VideoPlayerErrorBoundaryState = {
  hasError: boolean;
};

export class VideoPlayerErrorBoundary extends Component<
  VideoPlayerErrorBoundaryProps,
  VideoPlayerErrorBoundaryState
> {
  state: VideoPlayerErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): VideoPlayerErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[video-player] player render failed", error, info);
  }

  private retry = () => {
    this.setState({ hasError: false }, this.props.onRetry);
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="absolute inset-0 z-[90] grid place-items-center bg-black p-5 text-center text-white"
        role="alert"
        data-testid="video-player-render-error"
      >
        <div className="flex max-w-xs flex-col items-center gap-3">
          <p className="text-sm font-semibold">The video player hit a problem.</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.retry}
              className="rounded-full bg-pink-600 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-700"
              data-testid="button-retry-video-player"
            >
              Retry video
            </button>
            {this.props.onBack ? (
              <button
                type="button"
                onClick={this.props.onBack}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                data-testid="button-back-from-video-player-error"
              >
                Back
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}