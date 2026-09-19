type PreventableClick = {
  preventDefault: () => void;
};

export function historyBackOr(fallback: () => void) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    window.history.back();
    return;
  }
  fallback();
}

export function historyBackLink(event: PreventableClick) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    event.preventDefault();
    window.history.back();
  }
}