import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefCallback,
} from "react";
import { getFeedWindowIndices } from "@/lib/feed-windowing";
import { getAppScrollContainer } from "@/lib/app-scroll-container";

type FeedWindowItem = { key: string };

type VirtualizedFeedWindowProps<T extends FeedWindowItem> = {
  items: readonly T[];
  pinnedKey?: string | null;
  estimateHeight: (item: T) => number;
  renderItem: (item: T, index: number) => ReactNode;
};

export function VirtualizedFeedWindow<T extends FeedWindowItem>({
  items,
  pinnedKey = null,
  estimateHeight,
  renderItem,
}: VirtualizedFeedWindowProps<T>) {
  const [ready, setReady] = useState(false);
  const [centerKey, setCenterKey] = useState<string | null>(null);
  const [, setHeightVersion] = useState(0);
  const rowElements = useRef(new Map<string, HTMLDivElement>());
  const rowCallbacks = useRef(new Map<string, RefCallback<HTMLDivElement>>());
  const heights = useRef(new Map<string, number>());
  const resizeObserver = useRef<ResizeObserver | null>(null);

  const itemIndices = useMemo(
    () => new Map(items.map((item, index) => [item.key, index])),
    [items],
  );
  const centerIndex = centerKey === null ? 0 : itemIndices.get(centerKey) ?? 0;
  const pinnedIndex = pinnedKey === null ? null : itemIndices.get(pinnedKey) ?? null;
  const visibleIndices = useMemo(
    () => new Set(getFeedWindowIndices(items.length, centerIndex, pinnedIndex)),
    [centerIndex, items.length, pinnedIndex],
  );

  const recordHeight = useCallback((key: string, element: HTMLDivElement, adjustScroll: boolean) => {
    const nextHeight = Math.ceil(element.getBoundingClientRect().height);
    if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
    const previousHeight = heights.current.get(key);
    if (previousHeight !== undefined && Math.abs(previousHeight - nextHeight) < 2) return;

    heights.current.set(key, nextHeight);
    const scrollContainer = getAppScrollContainer();
    if (
      adjustScroll &&
      previousHeight !== undefined &&
      element.getBoundingClientRect().bottom <=
        (scrollContainer?.getBoundingClientRect().top ?? 0)
    ) {
      if (scrollContainer) scrollContainer.scrollBy(0, nextHeight - previousHeight);
      else window.scrollBy(0, nextHeight - previousHeight);
    }
    setHeightVersion((version) => version + 1);
  }, []);

  const getRowRef = useCallback((key: string): RefCallback<HTMLDivElement> => {
    const existing = rowCallbacks.current.get(key);
    if (existing) return existing;

    const callback: RefCallback<HTMLDivElement> = (element) => {
      const previous = rowElements.current.get(key);
      if (previous && previous !== element) {
        resizeObserver.current?.unobserve(previous);
        rowElements.current.delete(key);
      }
      if (element) {
        rowElements.current.set(key, element);
        resizeObserver.current?.observe(element);
      }
    };
    rowCallbacks.current.set(key, callback);
    return callback;
  }, []);

  useEffect(() => {
    const scrollContainer = getAppScrollContainer();
    const viewportTop = scrollContainer?.getBoundingClientRect().top ?? 0;
    const viewportHeight = scrollContainer?.clientHeight ?? window.innerHeight;
    const liveKeys = new Set(items.map((item) => item.key));
    for (const key of heights.current.keys()) {
      if (!liveKeys.has(key)) heights.current.delete(key);
    }
    for (const key of rowCallbacks.current.keys()) {
      if (!liveKeys.has(key)) rowCallbacks.current.delete(key);
    }

    const viewportCenter = viewportTop + viewportHeight / 2;
    let closestKey: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const item of items) {
      const element = rowElements.current.get(item.key);
      if (!element) continue;
      recordHeight(item.key, element, false);
      const rect = element.getBoundingClientRect();
      const distance =
        rect.top <= viewportCenter && rect.bottom >= viewportCenter
          ? 0
          : Math.min(Math.abs(rect.top - viewportCenter), Math.abs(rect.bottom - viewportCenter));
      if (distance < closestDistance) {
        closestKey = item.key;
        closestDistance = distance;
      }
    }

    if (closestKey) setCenterKey((current) => current ?? closestKey);
    setReady(true);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLDivElement;
          const key = element.dataset.feedWindowKey;
          if (key) recordHeight(key, element, true);
        }
      });
      resizeObserver.current = observer;
      for (const element of rowElements.current.values()) observer.observe(element);
    }

    let intersectionObserver: IntersectionObserver | null = null;
    const centralRows = new Map<string, DOMRectReadOnly>();
    const chooseCenter = () => {
      const centerY = viewportTop + viewportHeight / 2;
      let nearestKey: string | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const [key, rect] of centralRows) {
        const distance =
          rect.top <= centerY && rect.bottom >= centerY
            ? 0
            : Math.min(Math.abs(rect.top - centerY), Math.abs(rect.bottom - centerY));
        if (distance < nearestDistance) {
          nearestKey = key;
          nearestDistance = distance;
        }
      }
      if (nearestKey) setCenterKey((current) => current === nearestKey ? current : nearestKey);
    };

    if (typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const key = (entry.target as HTMLDivElement).dataset.feedWindowKey;
            if (!key) continue;
            if (entry.isIntersecting) centralRows.set(key, entry.boundingClientRect);
            else centralRows.delete(key);
          }
          chooseCenter();
        },
        { root: scrollContainer, rootMargin: "-42% 0px -42% 0px", threshold: 0 },
      );
      for (const element of rowElements.current.values()) intersectionObserver.observe(element);
    } else {
      let frame = 0;
      const updateCenter = () => {
        frame = 0;
        const centerY =
          (scrollContainer?.getBoundingClientRect().top ?? 0) +
          (scrollContainer?.clientHeight ?? window.innerHeight) / 2;
        let nearestKey: string | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const [key, element] of rowElements.current) {
          const rect = element.getBoundingClientRect();
          const distance =
            rect.top <= centerY && rect.bottom >= centerY
              ? 0
              : Math.min(Math.abs(rect.top - centerY), Math.abs(rect.bottom - centerY));
          if (distance < nearestDistance) {
            nearestKey = key;
            nearestDistance = distance;
          }
        }
        if (nearestKey) setCenterKey((current) => current === nearestKey ? current : nearestKey);
      };
      const onScroll = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(updateCenter);
      };
      scrollContainer?.addEventListener("scroll", onScroll, { passive: true });
      if (!scrollContainer) window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      updateCenter();
      return () => {
        scrollContainer?.removeEventListener("scroll", onScroll);
        if (!scrollContainer) window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (frame) window.cancelAnimationFrame(frame);
        resizeObserver.current?.disconnect();
        resizeObserver.current = null;
      };
    }

    return () => {
      intersectionObserver?.disconnect();
      resizeObserver.current?.disconnect();
      resizeObserver.current = null;
    };
  }, [items, recordHeight]);

  return (
    <>
      {items.map((item, index) => {
        const rendered = !ready || visibleIndices.has(index);
        const measuredHeight = heights.current.get(item.key);
        const placeholderHeight = measuredHeight ?? estimateHeight(item);

        return (
          <div
            key={item.key}
            ref={getRowRef(item.key)}
            data-feed-window-key={item.key}
            className="w-full shrink-0"
            style={rendered ? undefined : { height: `${placeholderHeight}px`, overflow: "hidden" }}
            aria-hidden={rendered ? undefined : true}
          >
            {rendered ? renderItem(item, index) : null}
          </div>
        );
      })}
    </>
  );
}