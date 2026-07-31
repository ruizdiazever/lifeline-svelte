<script lang="ts">
  import { createLifelineIntro } from "./lifeline-intro.svelte";
  import LifelineVerticalEntry from "./lifeline-vertical-entry.svelte";
  import { createLifelineVerticalScroll } from "./lifeline-vertical-scroll.svelte";
  import { getLifelineEventImage } from "./lifeline-event";
  import { getMarkerHeight } from "./lifeline-utils";
  import type { LifelineProps } from "./types";
  import { cn } from "./utils";

  const GRID_CLASS = "grid grid-cols-[2.5rem_1rem_1fr] gap-x-3";
  const RAIL_LEFT = "calc(2.5rem + 0.75rem + 0.5rem)";

  /**
   * Above this many entries the delay-armed intro fades would promote
   * every entry to a compositor layer at once and crash mobile Safari's
   * compositor. Long timelines fade entries in as they enter the
   * viewport during the auto-scroll instead — same look, but only a
   * handful of live animations at any moment.
   */
  const MAX_ARMED_ENTRIES = 80;

  let { markers, birthYear, title = "Lifeline", mode = "auto" }: LifelineProps = $props();

  // Only an explicit `mode` embeds the vertical layout. `"auto"` measures
  // scrollability on desktop, but the mobile layout *is* a vertical
  // scroller inside a scrolling stage, so that test would read every
  // full-page timeline as embedded and drop its intro.
  const isEmbed = $derived(mode === "embed");
  const heights = $derived(
    markers.map((marker, index) => getMarkerHeight(marker, markers[index + 1]?.year)),
  );

  const intro = createLifelineIntro(() => heights);
  const isIntroAnimating = $derived(intro.shouldPlay && intro.isPlaying);

  // Warm the event media posters during idle — the tap-to-open
  // lightbox measures its frame from these, and a cold fetch at tap
  // time reads as lag.
  $effect(() => {
    const sources: string[] = [];
    for (const marker of markers) {
      for (const event of marker.events) {
        const image = getLifelineEventImage(event);
        if (image) sources.push(image.src);
      }
    }
    if (sources.length === 0) return;

    const warm = () => {
      sources.forEach((src) => {
        const image = new window.Image();
        image.src = src;
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(warm);
      return () => window.cancelIdleCallback(handle);
    }
    const timeout = window.setTimeout(warm, 2000);
    return () => window.clearTimeout(timeout);
  });

  const scroll = createLifelineVerticalScroll(
    () => markers.length,
    () => ({
      isEmbed,
      introLocked: isIntroAnimating,
      introAnimating: isIntroAnimating,
      // Embedded, the sweep would play out unseen below the fold — and
      // lock the module's own scroller while doing it.
      introSkipped: !intro.shouldPlay || isEmbed,
      introRailMs: intro.railDuration,
      introGetTrackProgress: intro.getTrackProgressAtTime,
      onIntroScrollStart: intro.startIntroTimer,
      onIntroSettleComplete: intro.completeIntro,
    }),
  );

  const showIntro = $derived(isIntroAnimating && scroll.isLayoutReady && !isEmbed);
  const revealOnScroll = $derived(markers.length > MAX_ARMED_ENTRIES);
  const animateEntries = $derived(showIntro && !revealOnScroll);

  // Rail-synced fades for long timelines: entries render hidden and
  // each one fades in the moment the rail tip (--lifeline-intro-progress,
  // written every frame by the intro scroll) crosses its position —
  // desktop's choreography, but each entry drops its animation (and
  // compositor layer) as soon as its fade finishes.
  $effect(() => {
    if (!showIntro || !revealOnScroll) return;
    const section = scroll.refs.section;
    const ol = section?.querySelector("ol");
    if (!section || !ol) return;

    const entries = Array.from(ol.children) as HTMLElement[];
    const targets = entries.map((li) => li.firstElementChild as HTMLElement | null);

    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.animationName !== "lifeline-marker-in") return;
      (event.target as HTMLElement).classList.remove("lifeline-marker-intro");
    };
    section.addEventListener("animationend", onAnimationEnd);

    let next = 0;
    let frame = 0;
    const tick = () => {
      const progress = parseFloat(section.style.getPropertyValue("--lifeline-intro-progress") || "0");
      const tip = progress * ol.offsetHeight;

      while (next < entries.length && entries[next].offsetTop <= tip) {
        const el = targets[next];
        if (el) {
          el.classList.remove("opacity-0");
          el.classList.add("lifeline-marker-intro");
        }
        next++;
      }

      if (next < entries.length) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener("animationend", onAnimationEnd);
      targets.forEach((el) => {
        el?.classList.remove("opacity-0", "lifeline-marker-intro");
      });
    };
  });
</script>

<article
  bind:this={scroll.refs.section}
  aria-label={title}
  class={cn("relative select-none px-6 pb-10 pt-4 [&_a]:cursor-pointer", !scroll.isLayoutReady && "invisible")}
  style:--lifeline-labels-ms={showIntro ? `${intro.labelsDuration}ms` : undefined}
  style:--lifeline-rail-ms={showIntro ? `${intro.railDuration}ms` : undefined}
>
  <div class={cn(`${GRID_CLASS} mb-6 items-end`, showIntro && "lifeline-labels-intro")}>
    <p
      class="text-right text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-zinc-500 transition-colors duration-300 dark:text-zinc-600"
    >
      Age
    </p>
    <div aria-hidden="true"></div>
    <p
      class="text-[11px] font-medium uppercase leading-5 tracking-[0.08em] text-zinc-500 transition-colors duration-300 dark:text-zinc-600"
    >
      Years
    </p>
  </div>

  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute bottom-0 top-0 overflow-hidden -translate-x-1/2"
      style:left={RAIL_LEFT}
      style:width="1px"
    >
      <div
        class={cn(
          "h-full w-px border-l border-dashed border-zinc-300 transition-colors duration-300 dark:border-zinc-800",
          showIntro && "lifeline-rail-intro-vertical",
        )}
      ></div>
    </div>

    <ol class="relative">
      {#each markers as marker, index (marker.id)}
        <LifelineVerticalEntry
          ref={(node) => scroll.setEntryRef(index, node)}
          {marker}
          {birthYear}
          animateIntro={animateEntries}
          revealPending={showIntro && revealOnScroll}
          introDelay={intro.getMarkerDelay(index)}
          introDuration={intro.getMarkerFadeDuration(index)}
        />
      {/each}
    </ol>
  </div>
</article>
