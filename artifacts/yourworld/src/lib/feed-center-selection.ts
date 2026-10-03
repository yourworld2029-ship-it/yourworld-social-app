export function centeredCandidate<T extends { element: Pick<HTMLElement, "getBoundingClientRect">; order: number }>(
  candidates: T[], viewportHeight: number,
) {
  return candidates.map((candidate) => {
    const { top, bottom } = candidate.element.getBoundingClientRect();
    return { candidate, distance: Math.abs((top + bottom) / 2 - viewportHeight / 2) };
  }).sort((a, b) => a.distance - b.distance || a.candidate.order - b.candidate.order)[0]?.candidate ?? null;
}