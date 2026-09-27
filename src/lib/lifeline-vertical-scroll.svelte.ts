import { clamp } from "./lifeline-utils";

function getScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;

  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }
    node = node.parentElement;
  }

  // Nothing on the way up scrolls, so the document does, which is the
  // ordinary case for a page-mode timeline in a page that just scrolls.
  // Returning null here left the whole rail `invisible` with no error.
  return (document.scrollingElement as HTMLElement | null) ?? null;
}

export interface LifelineVerticalScrollOptions {
  /**
   * Embedded, the timeline opens at its start rather than where a skipped
   * intro would have settled it. The reader is arriving at a module in a
   * page, not returning to a timeline that already played.
   */
  isEmbed?: boolean;
  introLocked?: boolean;
  introAnimating?: boolean;
  introSkipped?: boolean;
  introRailMs?: number;
  introGetTrackProgress?: (elapsedMs: number) => number;
  onIntroSettleComplete?: () => void;
  onIntroScrollStart?: () => void;
}

export function createLifelineVerticalScroll(
  getMarkerCount: () => number,
  getOptions: () => LifelineVerticalScrollOptions,
) {
  const refs: { section: HTMLElement | null } = { section: null };
  const entryRefs: (HTMLLIElement | null)[] = [];

  let maxScroll = 0;
  let scrollParent: HTMLElement | null = null;
  let initialized = false;
  let introStarted = false;
  let introScrollId = 0;
  let introScrollStart = 0;
  let introWasAnimating = false;
  let scheduleMeasureImpl: () => void = () => {};

  let isLayoutReady = $state(false);

  function setEntryRef(index: number, node: HTMLLIElement | null) {
    entryRefs[index] = node;

    if (index === getMarkerCount() - 1 && node) {
      scheduleMeasureImpl();
    }
  }

  function applyScroll(value: number) {
    if (!scrollParent) return;

    scrollParent.scrollTop = clamp(value, 0, maxScroll);
  }

  function measureLayout() {
    const section = refs.section;
    if (!section) return 0;

    scrollParent = getScrollParent(section);

    if (!scrollParent) return 0;

    const markerCount = getMarkerCount();
    const heights = entryRefs.map((entry) => entry?.offsetHeight ?? 0);
    if (heights.length < markerCount || heights.some((height) => height <= 0)) {
      return 0;
    }

    const max = Math.max(0, scrollParent.scrollHeight - scrollParent.clientHeight);
    maxScroll = max;

    return max;
  }

  $effect(() => {
    entryRefs.length = getMarkerCount();
  });

  // Initial measure + first paint position.
  $effect(() => {
    const max = measureLayout();

    if (!scrollParent) return;

    if (!initialized) {
      const opts = getOptions();
      scrollParent.scrollTop = (opts.introSkipped ?? false) && !(opts.isEmbed ?? false) ? max : 0;
      initialized = true;
    }

    isLayoutReady = entryRefs.every((entry) => Boolean(entry));
  });

  // Intro sweep: rAF-driven native scroll while the intro plays.
  $effect(() => {
    if (!isLayoutReady) return;

    const opts = getOptions();

    if (opts.introSkipped || !opts.introAnimating) {
      cancelAnimationFrame(introScrollId);
      introScrollId = 0;
      introStarted = false;
      return;
    }

    introWasAnimating = true;
    const railMs = opts.introRailMs ?? 3200;

    const step = (now: number) => {
      const max = maxScroll;

      if (!introStarted) {
        introStarted = true;
        introScrollStart = now;
        getOptions().onIntroScrollStart?.();
        refs.section?.style.setProperty("--lifeline-intro-progress", "0");
        if (max > 0) applyScroll(0);
      }

      const elapsed = now - introScrollStart;
      const getProgress = getOptions().introGetTrackProgress;
      const progress = getProgress
        ? clamp(getProgress(elapsed), 0, 1)
        : clamp(elapsed / railMs, 0, 1);

      refs.section?.style.setProperty("--lifeline-intro-progress", String(progress));

      if (max > 0) {
        applyScroll(progress * max);
      }

      if (progress < 1) {
        introScrollId = requestAnimationFrame(step);
        return;
      }

      refs.section?.style.setProperty("--lifeline-intro-progress", "1");
      if (max > 0) applyScroll(max);
      introScrollId = 0;
    };

    introScrollId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(introScrollId);
      introScrollId = 0;
      introStarted = false;
    };
  });

  // Intro settle.
  $effect(() => {
    const opts = getOptions();

    if (opts.introSkipped) return;
    if (opts.introAnimating) return;
    if (!introWasAnimating) return;

    introWasAnimating = false;
    refs.section?.style.removeProperty("--lifeline-intro-progress");
    opts.onIntroSettleComplete?.();
  });

  // Resize handling + scroll lock during the intro.
  $effect(() => {
    getMarkerCount();

    const section = refs.section;
    if (!section) return;

    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const measure = () => {
      measureLayout();

      if (!scrollParent) return;

      if (!((getOptions().introAnimating ?? false) && introStarted)) {
        scrollParent.scrollTop = clamp(scrollParent.scrollTop, 0, maxScroll);
      }

      isLayoutReady =
        entryRefs.length === getMarkerCount() && entryRefs.every((entry) => Boolean(entry));
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    };

    scheduleMeasureImpl = scheduleMeasure;

    scheduleMeasure();
    frameId = requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure);
    });

    resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(section);

    window.addEventListener("resize", scheduleMeasure);

    const isScrollLocked = () => (getOptions().introLocked ?? false) && introStarted;

    const preventScroll = (event: Event) => {
      if (!isScrollLocked()) return;
      event.preventDefault();
    };

    scrollParent = getScrollParent(section);

    scrollParent?.addEventListener("wheel", preventScroll, { passive: false });
    scrollParent?.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      scrollParent?.removeEventListener("wheel", preventScroll);
      scrollParent?.removeEventListener("touchmove", preventScroll);
      initialized = false;
    };
  });

  return {
    refs,
    setEntryRef,
    get isLayoutReady() {
      return isLayoutReady;
    },
  };
}
