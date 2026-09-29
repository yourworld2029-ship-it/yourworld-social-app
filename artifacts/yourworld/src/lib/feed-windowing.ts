export function getFeedWindowIndices(
  itemCount: number,
  anchorIndex: number,
  pinnedIndex: number | null = null,
) {
  if (itemCount <= 0) return [];

  const anchor = Math.min(itemCount - 1, Math.max(0, anchorIndex));
  const indices = new Set<number>();
  for (let index = Math.max(0, anchor - 1); index <= Math.min(itemCount - 1, anchor + 1); index += 1) {
    indices.add(index);
  }

  if (
    pinnedIndex !== null &&
    Number.isInteger(pinnedIndex) &&
    pinnedIndex >= 0 &&
    pinnedIndex < itemCount
  ) {
    indices.add(pinnedIndex);
  }

  return [...indices].sort((a, b) => a - b);
}