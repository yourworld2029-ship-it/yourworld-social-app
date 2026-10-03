export function getFeedWindowIndices(
  itemCount: number,
  anchorIndex: number,
  pinnedIndex: number | null = null,
  direction: 1 | -1 = 1,
) {
  if (itemCount <= 0) return [];

  const anchor = Math.min(itemCount - 1, Math.max(0, anchorIndex));
  const indices = new Set<number>();
  indices.add(anchor);

  const adjacent = anchor + direction;
  if (adjacent >= 0 && adjacent < itemCount) indices.add(adjacent);

  if (
    pinnedIndex !== null &&
    Number.isInteger(pinnedIndex) &&
    pinnedIndex >= 0 &&
    pinnedIndex < itemCount
  ) {
    if (indices.size < 2 || indices.has(pinnedIndex)) {
      indices.add(pinnedIndex);
    } else {
      return [anchor, pinnedIndex].sort((a, b) => a - b);
    }
  }

  return [...indices].sort((a, b) => a - b);
}