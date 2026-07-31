<script lang="ts">
  import type { Snippet } from "svelte";
  import { setLifelineHoverImageContext } from "./lifeline-hover-image";
  import { clamp, snapToDevicePixel } from "./lifeline-utils";
  import type { LifelineEventImage } from "./types";

  /** Tweak these */
  const FOLLOW_EASE = 0.16;
  const TILT_FACTOR = 0.14;
  const TILT_MAX_DEG = 7;
  const TILT_EASE = 0.1;
  const CURSOR_OFFSET_X = 24;
  const CURSOR_OFFSET_Y = 96;

  let { children, preload }: { children?: Snippet; preload?: LifelineEventImage[] } = $props();

  let container: HTMLDivElement | undefined;
  let img: HTMLImageElement | undefined;
  let video: HTMLVideoElement | undefined;

  const s = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    tilt: 0,
    visible: false,
    hoverCapable: false,
    frame: 0,
  };

  function step() {
    if (!container) return;

    const dx = s.targetX - s.x;
    s.x += dx * FOLLOW_EASE;
    s.y += (s.targetY - s.y) * FOLLOW_EASE;

    const targetTilt = clamp(dx * TILT_FACTOR, -TILT_MAX_DEG, TILT_MAX_DEG);
    s.tilt += (targetTilt - s.tilt) * TILT_EASE;

    // The ease is asymptotic — it never actually arrives, so the card
    // rests on a fractional offset with a residual tilt and the browser
    // resamples it soft. Land it: snap sub-threshold deltas to done.
    if (Math.abs(s.targetX - s.x) < 0.1 && Math.abs(s.targetY - s.y) < 0.1 && Math.abs(s.tilt) < 0.05) {
      s.x = s.targetX;
      s.y = s.targetY;
      s.tilt = 0;
    }

    const rotate = s.tilt === 0 ? "" : ` rotate(${s.tilt}deg)`;
    container.style.transform = `translate3d(${snapToDevicePixel(s.x + CURSOR_OFFSET_X)}px, ${snapToDevicePixel(s.y - CURSOR_OFFSET_Y)}px, 0)${rotate}`;

    if (s.visible) {
      s.frame = requestAnimationFrame(step);
    }
  }

  function show(image: LifelineEventImage) {
    if (!s.hoverCapable || !container || !img) return;

    if (image.video && video) {
      // Video takes over the card; the image element sits this one out.
      img.style.display = "none";
      video.style.display = "block";

      const targetVideo = new URL(image.video, window.location.origin).href;
      if (video.src !== targetVideo) {
        video.src = targetVideo;
        video.poster = image.src;
      }
      video.play().catch(() => {
        // Autoplay rejection just leaves the poster frame showing.
      });

      if (!s.visible) {
        s.x = s.targetX;
        s.y = s.targetY;
        s.tilt = 0;
      }

      s.visible = true;
      container.style.opacity = "1";
      video.style.transform = "scale(1)";

      cancelAnimationFrame(s.frame);
      s.frame = requestAnimationFrame(step);
      return;
    }

    if (video) {
      video.pause();
      video.style.display = "none";
    }
    img.style.display = "block";

    const targetSrc = new URL(image.src, window.location.origin).href;

    if (img.src !== targetSrc) {
      // Kill the previous bitmap instantly — the browser would keep
      // showing it until the new file decodes.
      img.style.visibility = "hidden";
      img.src = targetSrc;
      img.alt = image.alt;

      const reveal = () => {
        // Only reveal if this image is still the requested one.
        if (img && img.src === targetSrc) {
          img.style.visibility = "visible";
        }
      };

      if (img.complete) {
        reveal();
      } else {
        img.decode().then(reveal, reveal);
      }
    } else {
      img.style.visibility = "visible";
    }

    if (!s.visible) {
      // Materialize at the cursor instead of flying in from the
      // last resting point.
      s.x = s.targetX;
      s.y = s.targetY;
      s.tilt = 0;
    }

    s.visible = true;
    container.style.opacity = "1";
    img.style.transform = "scale(1)";

    cancelAnimationFrame(s.frame);
    s.frame = requestAnimationFrame(step);
  }

  function hide() {
    if (!container || !img) return;

    s.visible = false;
    container.style.opacity = "0";
    img.style.transform = "scale(0.94)";
    if (video) {
      video.pause();
      video.style.transform = "scale(0.94)";
    }
  }

  setLifelineHoverImageContext({ show, hide });

  $effect(() => {
    s.hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const onMouseMove = (event: MouseEvent) => {
      s.targetX = event.clientX;
      s.targetY = event.clientY;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(s.frame);
    };
  });

  // Warm hover images into the browser cache during idle so swaps are instant.
  $effect(() => {
    const images = preload;
    if (!images?.length || !s.hoverCapable) return;

    const warm = () => {
      images.forEach(({ src }) => {
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
</script>

{@render children?.()}

<div
  bind:this={container}
  aria-hidden="true"
  class="pointer-events-none fixed left-0 top-0 z-[60] opacity-0 transition-opacity duration-200 ease-out will-change-transform"
>
  <img
    bind:this={img}
    alt=""
    class="w-[280px] scale-95 rounded-xl shadow-2xl ring-1 ring-black/10 transition-[transform,box-shadow] duration-200 ease-out dark:ring-white/15"
    decoding="async"
  />
  <video
    bind:this={video}
    muted
    loop
    playsinline
    preload="none"
    class="max-h-[320px] w-auto max-w-[280px] scale-95 rounded-xl shadow-2xl ring-1 ring-black/10 transition-[transform,box-shadow] duration-200 ease-out dark:ring-white/15"
    style="display: none"
  ></video>
</div>
