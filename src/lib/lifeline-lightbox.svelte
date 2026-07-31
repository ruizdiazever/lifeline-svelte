<script lang="ts">
  import { untrack } from "svelte";
  import { cn } from "./utils";
  import { portal, type LifelineLightboxStart } from "./lifeline-lightbox";
  import type { LifelinePhoto } from "./types";

  const OPEN_MS = 520;
  /**
   * Gentle start, soft landing — the quint curve front-loaded nearly all
   * of the travel into the first 120ms, which read as a jump.
   */
  const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
  /** Fraction of the viewport the expanded media may occupy. */
  const FIT = 0.85;

  interface Target {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  let {
    photo,
    rotate,
    start,
    getHome,
    onClosed,
  }: {
    photo: LifelinePhoto;
    /** The card's resting tilt — animated away as the media centers. */
    rotate: number;
    /** The card's geometry at click time. */
    start: LifelineLightboxStart;
    /** Re-measures the card at dismiss time. */
    getHome: () => LifelineLightboxStart | null;
    onClosed: () => void;
  } = $props();

  function computeTarget(start: LifelineLightboxStart): Target {
    if (typeof window === "undefined") {
      return { left: 0, top: 0, width: start.w, height: start.h };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aspect = start.h / start.w;
    const width = Math.min(vw * FIT, (vh * FIT) / aspect);
    const height = width * aspect;
    return { left: (vw - width) / 2, top: (vh - height) / 2, width, height };
  }

  /**
   * Expands a floating card's media from its spot on the timeline to the
   * center of the screen and back — a FLIP animation on a fixed clone
   * portaled to <body> (the track is transformed, so fixed positioning
   * inside it would break). The original card stays in layout, hidden,
   * and is re-measured on dismiss so the media returns wherever the card
   * now is, even if the timeline moved.
   */
  const { left, top, width, height } = untrack(() => computeTarget(start));

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Center-anchored FLIP: rotation and scale about the center match
  // how the card itself is transformed, so the first frame is
  // pixel-identical to the card underneath.
  const toTransform = (home: LifelineLightboxStart) =>
    `translate(${home.cx - (left + width / 2)}px, ${
      home.cy - (top + height / 2)
    }px) scale(${home.w / width}) rotate(${rotate}deg)`;

  let entered = $state(reduceMotion);
  let transform = $state(reduceMotion ? "none" : untrack(() => toTransform(start)));
  let closing = false;
  // Playback waits for the open transition to finish — a playing
  // video decodes frames while the transform animates and drops
  // transition frames on mobile; a paused, pre-seeked frame is a
  // static layer and animates cheaply.
  let settled = $state(reduceMotion);

  let figureStyle = $derived(
    `left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; ` +
      `transform: ${transform}; transform-origin: center; will-change: transform;` +
      (reduceMotion ? "" : ` transition: transform ${OPEN_MS}ms ${EASE};`),
  );

  let root: HTMLDivElement;
  let video: HTMLVideoElement | undefined = $state();
  let seeded = false;

  // Videos mount paused, pre-seeked to the card's playback position —
  // a static frame the compositor can scale without decoding — and only
  // play once `settled` flips after the open transition settles.
  // Dismissing pauses again for the return flight.
  $effect(() => {
    const el = video;
    if (!el) return;
    if (settled) {
      // Seek only now, stationary — a seek during the transition
      // decodes a new frame mid-flight and visibly swaps the image.
      if (!seeded) {
        seeded = true;
        if (start.mediaTime !== undefined) el.currentTime = start.mediaTime;
      }
      el.play().catch(() => {
        // Autoplay rejection just leaves the poster frame showing.
      });
    } else {
      el.pause();
    }
  });

  // Safety net if transitionend never fires for the open.
  $effect(() => {
    if (reduceMotion) return;
    const timeout = window.setTimeout(() => {
      if (!closing) settled = true;
    }, OPEN_MS + 80);
    return () => window.clearTimeout(timeout);
  });

  // FLIP: first paint sits over the card, next frame eases to center.
  $effect(() => {
    if (reduceMotion) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        entered = true;
        transform = "translate(0px, 0px) scale(1) rotate(0deg)";
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  });

  // No gesture may pan while the lightbox is up — iOS otherwise
  // rubber-bands the body behind the fixed overlay and can leave the
  // whole page stuck offset after dismiss. This needs a native
  // non-passive touch listener.
  $effect(() => {
    const block = (event: TouchEvent) => event.preventDefault();
    root.addEventListener("touchmove", block, { passive: false });
    return () => root.removeEventListener("touchmove", block);
  });

  // The press that opens the card dispatches one more click right
  // after pointerup — by then the clone is mounted underneath the
  // pointer and would dismiss itself. Swallow exactly that click;
  // every later click dismisses normally.
  $effect(() => {
    const swallow = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
    };
    window.addEventListener("click", swallow, { capture: true, once: true });
    const timeout = window.setTimeout(() => {
      window.removeEventListener("click", swallow, { capture: true });
    }, 500);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("click", swallow, { capture: true });
    };
  });

  function dismiss() {
    if (closing) return;
    closing = true;
    if (reduceMotion) {
      onClosed();
      return;
    }
    settled = false; // freeze the video so the return flight is cheap
    entered = false;
    transform = toTransform(getHome() ?? start);
    // transitionend is the primary signal; this is the safety net.
    window.setTimeout(onClosed, OPEN_MS + 120);
  }

  $effect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  use:portal
  bind:this={root}
  class="fixed inset-0 z-[999] touch-none overscroll-contain"
  role="dialog"
  aria-modal="true"
  aria-label={photo.alt}
  tabindex={-1}
  onpointerdown={(event) => event.stopPropagation()}
  onpointermove={(event) => event.stopPropagation()}
  onpointerup={(event) => event.stopPropagation()}
  onclick={(event) => event.stopPropagation()}
>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class={cn(
      "absolute inset-0 cursor-zoom-out bg-black/70 transition-opacity",
      entered ? "opacity-100" : "opacity-0",
    )}
    style="transition-duration: {OPEN_MS}ms"
    onclick={dismiss}
  ></div>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <figure
    class="absolute cursor-zoom-out overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/15"
    style={figureStyle}
    onclick={dismiss}
    ontransitionend={(event) => {
      if (event.propertyName !== "transform") return;
      if (closing) onClosed();
      else settled = true;
    }}
  >
    {#if photo.video}
      <video
        bind:this={video}
        src={photo.video}
        poster={photo.src}
        muted
        loop
        playsinline
        preload="auto"
        aria-label={photo.alt}
        class="block h-full w-full object-cover"
      ></video>
    {:else}
      <img src={photo.src} alt={photo.alt} class="block h-full w-full object-cover" />
    {/if}
  </figure>
</div>
