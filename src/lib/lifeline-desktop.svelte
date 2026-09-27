<script lang="ts">
  import LifelineHoverImageProvider from "./lifeline-hover-image-provider.svelte";
  import { createLifelineIntro } from "./lifeline-intro.svelte";
  import LifelineStickyLabels from "./lifeline-labels.svelte";
  import { LIFELINE_STICKY_SHIELD_WIDTH } from "./lifeline-labels";
  import LifelineMarkerColumn from "./lifeline-marker.svelte";
  import LifelineFloatingPhotos from "./lifeline-photos.svelte";
  import { createLifelineScroll } from "./lifeline-scroll.svelte";
  import { getLifelineEventImage } from "./lifeline-event";
  import { getMarkerWidth } from "./lifeline-utils";
  import type { LifelineEventImage, LifelineProps } from "./types";
  import { cn } from "./utils";

  let { markers, birthYear, class: className, title = "Lifeline", mode = "auto" }: LifelineProps =
    $props();

  const widths = $derived(
    markers.map((marker, index) => getMarkerWidth(marker, markers[index + 1]?.year)),
  );

  // Left edge of each marker's slot within the track: anchors for the
  // floating photo cards.
  const offsets = $derived.by(() => {
    const result: number[] = [];
    let sum = 0;
    for (const width of widths) {
      result.push(sum);
      sum += width;
    }
    return result;
  });

  const hoverImages = $derived.by(() => {
    const images: LifelineEventImage[] = [];
    for (const marker of markers) {
      for (const event of marker.events) {
        const image = getLifelineEventImage(event);
        if (image) images.push(image);
      }
    }
    return images;
  });

  const intro = createLifelineIntro(() => widths);
  const isIntroAnimating = $derived(intro.shouldPlay && intro.isPlaying);

  const scroll = createLifelineScroll(
    () => markers.length,
    () => ({
      mode,
      introLocked: isIntroAnimating,
      introAnimating: isIntroAnimating,
      introSkipped: !intro.shouldPlay,
      introRailMs: intro.railDuration,
      introGetTrackProgress: intro.getTrackProgressAtTime,
      onIntroScrollStart: intro.startIntroTimer,
      onIntroSettleComplete: intro.completeIntro,
    }),
  );

  // Embedded, the open waits for the module to come into view: the marker
  // fades are CSS animations that start the moment their class lands, so
  // applying it early would spend them below the fold.
  const introWaitingInView = $derived(scroll.isEmbed && intro.shouldPlay && !scroll.introArmed);
  const showIntro = $derived(isIntroAnimating && scroll.isLayoutReady && !introWaitingInView);

  const trackWidth = $derived(
    LIFELINE_STICKY_SHIELD_WIDTH + widths.reduce((sum, width) => sum + width, 0),
  );
</script>

<section
  bind:this={scroll.refs.section}
  data-lifeline-mode={scroll.isEmbed ? "embed" : "page"}
  tabindex={scroll.isEmbed ? 0 : undefined}
  class={cn(
    "relative h-full min-h-0 select-none overflow-hidden [&_a]:cursor-pointer",
    // `pan-y` lets the browser start a vertical page scroll on the
    // first frame instead of waiting on the JS axis lock; horizontal
    // panning stays ours.
    scroll.isEmbed &&
      "touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    // Hold it blank rather than showing a settled timeline that then
    // resets itself to play the intro. Below the fold there is nothing
    // to see anyway, and the arming margin means it fills in before it
    // reaches the reader.
    (!scroll.isLayoutReady || introWaitingInView) && "invisible",
    className,
  )}
  aria-label={title}
  style:--lifeline-labels-ms={showIntro ? `${intro.labelsDuration}ms` : undefined}
  style:--lifeline-rail-ms={showIntro ? `${intro.railDuration}ms` : undefined}
>
  <LifelineHoverImageProvider preload={hoverImages}>
    <!--
      Centered, but `safe center` where the browser understands it, which
      matters once the height is the consumer's to choose. A track taller
      than its box would otherwise overflow equally top and bottom, and
      since the section clips, the first thing lost is the row nearest the
      top: the Age/Years label column and the year labels. `safe` falls
      back to start-alignment exactly in that case, so the labels and the
      rail stay put and only the tail of a long column clips. Declared
      inline so browsers without it simply keep the `items-center` class.
    -->
    <div
      class="flex h-full items-center overflow-hidden"
      style:align-items={scroll.isEmbed ? "safe center" : undefined}
    >
      <div
        bind:this={scroll.refs.track}
        class="relative flex w-max items-start will-change-transform [--lifeline-people-top:calc(14.5rem+40px)] [--lifeline-rail:5rem]"
        style:width="{trackWidth}px"
      >
        <!--
          LIFELINE_STICKY_SHIELD_WIDTH reserves this column at the head of
          the track, and the column has to actually paint it: once the
          track scrolls, marker text passes underneath and would otherwise
          read straight through "Age" and "Years".

          `bg-white dark:bg-black` to match the framing the shell puts
          around this. Reframe the page on a different surface and this
          wants overriding with it. The transition is not decoration
          either: without it the shield snaps between the two while the
          page behind it is still crossfading, which flashes a hard box
          for the length of a theme switch. 300ms on the default curve is
          what `LifelineShell` fades on, so the two move as one.
        -->
        <div
          bind:this={scroll.refs.labels}
          class="lifeline-labels shrink-0 bg-white transition-colors duration-300 will-change-transform dark:bg-black"
          style:width="{LIFELINE_STICKY_SHIELD_WIDTH}px"
        >
          <div class={cn(showIntro && "lifeline-labels-intro")}>
            <LifelineStickyLabels />
          </div>
        </div>

        <div class="relative">
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-0 top-[var(--lifeline-rail)] h-px overflow-hidden"
          >
            <div
              class={cn(
                "h-px w-full border-t border-dashed border-zinc-300 transition-colors duration-300 dark:border-zinc-800",
                showIntro && "lifeline-rail-intro",
              )}
            ></div>
          </div>

          <div class="relative flex items-start">
            {#each markers as marker, index (marker.id)}
              <LifelineMarkerColumn
                ref={(node) => scroll.setMarkerRef(index, node)}
                {marker}
                {birthYear}
                minWidth={widths[index]}
                animateIntro={showIntro}
                introDelay={intro.getMarkerDelay(index)}
                introDuration={intro.getMarkerFadeDuration(index)}
              />
            {/each}
          </div>

          <LifelineFloatingPhotos
            {markers}
            {offsets}
            {widths}
            animateIntro={showIntro}
            getIntroDelay={intro.getMarkerDelay}
            getIntroDuration={intro.getMarkerFadeDuration}
          />
        </div>
      </div>
    </div>
  </LifelineHoverImageProvider>
</section>
