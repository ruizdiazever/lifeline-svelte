<script lang="ts">
  import LifelinePhotoCard from "./lifeline-photo-card.svelte";
  import type { LifelineMarker, LifelinePhoto } from "./types";

  /** Tweak these */
  const CARD_WIDTH = 180;
  /** Matches the events column's pt-6 — cards align with the first event's text. */
  const EVENT_TOP = 24;
  const MAX_TILT_DEG = 6;
  /**
   * How far along a card the next one in the stack starts — 0.6 leaves
   * a solid margin of every card visible under its neighbor.
   */
  const STACK_OVERLAP = 0.6;
  /**
   * Stacks cascade diagonally: the last card sits level with the event
   * text and each one before it hangs this much lower, so neighbors
   * overlap corner-to-corner instead of side-by-side.
   */
  const CASCADE_Y = 170;
  /** Event text column: max-w-[18rem] plus breathing room. */
  const TEXT_ZONE = 288 + 24;

  /** A fresh tilt on every visit — rolled once per card mount. */
  function randomTilt() {
    return 2 + Math.random() * (MAX_TILT_DEG - 2);
  }

  /**
   * Always-visible media scattered over the timeline — anchored to their
   * marker's slot, tilted and overlapping like photos in a notebook.
   * Rendered inside the transformed track, so they ride the scroll;
   * dragging repositions a card for the session.
   */
  interface Props {
    markers: LifelineMarker[];
    offsets: number[];
    widths: number[];
    animateIntro?: boolean;
    getIntroDelay?: (markerIndex: number) => number;
    getIntroDuration?: (markerIndex: number) => number;
  }

  let {
    markers,
    offsets,
    widths,
    animateIntro = false,
    getIntroDelay,
    getIntroDuration,
  }: Props = $props();

  const trackEnd = $derived(
    offsets.length > 0
      ? offsets[offsets.length - 1] + widths[widths.length - 1]
      : 0,
  );

  // Intro sync: a card fades in when the rail tip reaches it, i.e. on
  // the schedule of the marker whose slot its center sits over — which
  // is usually days past its anchor.
  function markerIndexAt(x: number) {
    for (let index = offsets.length - 1; index >= 0; index--) {
      if (offsets[index] <= x) return index;
    }
    return 0;
  }

  // Rolled once per photo: solo cards flip a coin for direction;
  // neighbors in a stack lean away from each other so the pile reads
  // as scattered.
  const tilts = new WeakMap<LifelinePhoto, number>();
  function mountTilt(photo: LifelinePhoto, stackIndex: number, stackCount: number) {
    let tilt = tilts.get(photo);
    if (tilt === undefined) {
      const sign =
        stackCount > 1
          ? stackIndex % 2 === 0
            ? -1
            : 1
          : Math.random() > 0.5
            ? 1
            : -1;
      tilt = sign * randomTilt();
      tilts.set(photo, tilt);
    }
    return tilt;
  }

  /**
   * The stack's shared geometry: steps along the pile and total width.
   * Stacks center as a group so a lone card sits in the middle of the
   * gap and a pile spreads evenly around it. Each card starts
   * STACK_OVERLAP of the way along the one beneath it.
   */
  function stackLayout(photos: LifelinePhoto[]) {
    const steps: number[] = [];
    let fan = 0;
    for (const stacked of photos) {
      steps.push(fan);
      fan += (stacked.width ?? CARD_WIDTH) * STACK_OVERLAP;
    }
    const groupWidth = steps[steps.length - 1] + (photos[photos.length - 1].width ?? CARD_WIDTH);
    return { steps, groupWidth };
  }
</script>

<div aria-hidden="true" class="pointer-events-none absolute inset-0">
  {#each markers as marker, index (marker.id)}
    {#if marker.photos && marker.photos.length > 0}
      {@const photos = marker.photos}
      <!-- The card's free run: after this day's own text column, up to
           the start of the next day that has text of its own. -->
      {@const zoneStart = offsets[index] + (marker.events.length > 0 ? TEXT_ZONE : 0)}
      {@const nextTextIndex = markers.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex > index && candidate.events.length > 0,
      )}
      {@const zoneEnd = nextTextIndex === -1 ? trackEnd : offsets[nextTextIndex]}
      {@const { steps, groupWidth } = stackLayout(photos)}
      {@const photoCount = photos.length}
      {#each photos as photo, photoIndex (`${marker.id}-${photoIndex}`)}
        {@const width = photo.width ?? CARD_WIDTH}
        <!-- Default home: centered in the text-free run between this
             day's events and the next day that has text — comfortably
             away from both columns. -->
        {@const x =
          photo.x !== undefined
            ? offsets[index] + photo.x * widths[index]
            : Math.max(
                zoneStart,
                zoneStart + (zoneEnd - zoneStart - groupWidth) / 2 + steps[photoIndex],
              )}
        {@const introIndex = markerIndexAt(x + width / 2)}
        <!-- The last card of a stack sits level with the event text;
             earlier cards hang progressively lower — the diagonal. -->
        {@const defaultY = EVENT_TOP + (photoCount - 1 - photoIndex) * CASCADE_Y}
        {@const y = photo.y ?? defaultY}
        <LifelinePhotoCard
          {photo}
          rotate={photo.rotate ?? mountTilt(photo, photoIndex, photoCount)}
          {width}
          class="absolute"
          style="left: {x}px; top: calc(var(--lifeline-rail) + {y}px);"
          {animateIntro}
          introDelay={getIntroDelay?.(introIndex) ?? 0}
          introDuration={getIntroDuration?.(introIndex) ?? 420}
        />
      {/each}
    {/if}
  {/each}
</div>
