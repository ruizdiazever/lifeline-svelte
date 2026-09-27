<script lang="ts">
  import LifelineEventMedia from "./lifeline-event-media.svelte";
  import LifelineLightbox from "./lifeline-lightbox.svelte";
  import type { LifelineLightboxStart } from "./lifeline-lightbox";
  import type { LifelinePhoto } from "./types";
  import { cn } from "./utils";

  /** Pointer travel below this is a click (opens the lightbox), not a drag. */
  const CLICK_SLOP = 4;
  /** Fingers wobble more than mice: touch presses get extra tap room. */
  const TOUCH_CLICK_SLOP = 10;

  /**
   * The interactive photo card, positioning-agnostic: drag moves it for
   * the session, a press without travel expands it into the lightbox.
   * Desktop floats it over the track (absolute + left/top); the vertical
   * layout drops it into normal flow.
   */
  interface Props {
    photo: LifelinePhoto;
    /** Resolved resting tilt, degrees. */
    rotate: number;
    width: number;
    /** Positioning context from the caller (e.g. "absolute"). */
    class?: string;
    /** Positioning style from the caller (e.g. left/top). */
    style?: string;
    animateIntro?: boolean;
    introDelay?: number;
    introDuration?: number;
  }

  let {
    photo,
    rotate,
    width,
    class: className,
    style,
    animateIntro = false,
    introDelay = 0,
    introDuration = 420,
  }: Props = $props();

  let offset = $state({ x: 0, y: 0 });
  let active = $state(false);
  let lightboxStart = $state<LifelineLightboxStart | null>(null);
  let cardEl: HTMLDivElement;
  let drag = {
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    moved: false,
    slop: CLICK_SLOP,
  };

  const cardStyle = $derived(
    `${style ?? ""} width: ${width}px; transform: translate(${offset.x}px, ${offset.y}px) rotate(${rotate}deg);`,
  );

  function handlePointerDown(event: PointerEvent) {
    // The desktop track scrubs on drag; a card drag must not reach it.
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    drag = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y,
      moved: false,
      slop: event.pointerType === "touch" ? TOUCH_CLICK_SLOP : CLICK_SLOP,
    };
    active = true;
  }

  function handlePointerMove(event: PointerEvent) {
    if (!active) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > drag.slop) drag.moved = true;
    offset = { x: drag.baseX + dx, y: drag.baseY + dy };
  }

  // The card's real geometry: bounding-box center (rotation preserves
  // it) plus untransformed layout size, never the rotated hull, which
  // is what made the lightbox clone jump on open.
  function measureCard(): LifelineLightboxStart | null {
    const el = cardEl;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    // Recover the rendered scale (hover grows the card 3%) from the
    // rotated hull: for tilt θ, hullWidth = (w·cosθ + h·sinθ)·scale.
    const w0 = el.offsetWidth;
    const h0 = el.offsetHeight;
    const rad = Math.abs((rotate * Math.PI) / 180);
    const hull = w0 * Math.cos(rad) + h0 * Math.sin(rad);
    const scale = hull > 0 ? rect.width / hull : 1;
    return {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      w: w0 * scale,
      h: h0 * scale,
      mediaTime: el.querySelector("video")?.currentTime,
    };
  }

  function handlePointerUp(event: PointerEvent) {
    (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    active = false;
    // A press that never travelled is a click. Expand to the lightbox.
    if (!drag.moved && !lightboxStart) {
      lightboxStart = measureCard();
    }
  }

  // The browser claiming the gesture (a vertical pan-y scroll on
  // touch) is not a click. Reset without opening.
  function handlePointerCancel(event: PointerEvent) {
    (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    active = false;
    offset = { x: drag.baseX, y: drag.baseY };
  }
</script>

<div
  bind:this={cardEl}
  data-lifeline-interactive={photo.plain ? undefined : ""}
  class={cn(
    // pan-y keeps page scrolling alive on touch: a vertical swipe
    // starting on a card scrolls the timeline (the browser claims
    // the gesture and fires pointercancel); horizontal drags move
    // the card.
    photo.plain
      ? "pointer-events-none"
      : "group/photo pointer-events-auto cursor-grab touch-pan-y",
    !photo.plain && (active ? "z-50 cursor-grabbing" : "z-20 hover:z-40"),
    lightboxStart && "invisible",
    className,
  )}
  style={cardStyle}
  onpointerdown={photo.plain ? undefined : handlePointerDown}
  onpointermove={photo.plain ? undefined : handlePointerMove}
  onpointerup={photo.plain ? undefined : handlePointerUp}
  onpointercancel={photo.plain ? undefined : handlePointerCancel}
>
  {#if photo.plain}
    <LifelineEventMedia
      media={photo}
      class="pointer-events-none block w-full {animateIntro ? 'lifeline-marker-intro' : ''}"
    />
  {:else}
    <div
      class={cn(
        "overflow-hidden rounded-xl shadow-xl ring-1 ring-black/10 transition-[transform,box-shadow] duration-200 ease-out dark:ring-white/15",
        animateIntro && "lifeline-marker-intro",
        active
          ? "scale-[1.05] shadow-2xl"
          : "group-hover/photo:scale-[1.03] group-hover/photo:shadow-2xl",
      )}
      style:animation-delay={animateIntro ? `${introDelay}ms` : undefined}
      style:--lifeline-marker-fade-ms={animateIntro ? `${introDuration}ms` : undefined}
    >
      <LifelineEventMedia media={photo} class="pointer-events-none block w-full" />
    </div>
  {/if}
</div>

{#if lightboxStart}
  <LifelineLightbox
    {photo}
    {rotate}
    start={lightboxStart}
    getHome={measureCard}
    onClosed={() => (lightboxStart = null)}
  />
{/if}
