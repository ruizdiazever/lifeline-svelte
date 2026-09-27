<script lang="ts">
  import Film from "@lucide/svelte/icons/film";
  import ImageIcon from "@lucide/svelte/icons/image";
  import LifelineEventText from "./lifeline-event-text.svelte";
  import { getLifelineEventEffect, getLifelineEventImage } from "./lifeline-event";
  import { getLifelineFireworks } from "./lifeline-fireworks";
  import LifelineLightbox from "./lifeline-lightbox.svelte";
  import type { LifelineLightboxStart } from "./lifeline-lightbox";
  import type { LifelineEvent } from "./types";
  import { cn } from "./utils";

  /**
   * One event line. Touch layouts have no hover reveal, so an event with
   * attached media becomes tappable: the media expands into the lightbox
   * from the event's text, framed by the poster image's real aspect.
   */
  let { event }: { event: LifelineEvent } = $props();

  const fireworks = getLifelineFireworks();
  const image = $derived(getLifelineEventImage(event));
  const effect = $derived(getLifelineEventEffect(event));

  let textEl: HTMLParagraphElement;
  let aspect = 3 / 4;
  let lightboxStart = $state<LifelineLightboxStart | null>(null);

  // The event text has no card geometry. Synthesize a small seed
  // centered on the text, carrying the media's aspect so the lightbox
  // expands into the right frame.
  function measureText(): LifelineLightboxStart | null {
    if (!textEl) return null;
    const rect = textEl.getBoundingClientRect();
    const w = 96;
    return {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      w,
      h: w * aspect,
    };
  }

  function openMedia() {
    if (!image || lightboxStart) return;
    // The poster sets the frame; for videos it shares the clip's aspect.
    const probe = new window.Image();
    probe.src = image.src;
    const open = () => {
      if (probe.naturalWidth > 0) {
        aspect = probe.naturalHeight / probe.naturalWidth;
      }
      lightboxStart = measureText();
    };
    if (probe.complete) {
      open();
    } else {
      probe.onload = open;
      probe.onerror = open;
    }
  }
</script>

<p
  bind:this={textEl}
  class={cn(
    "max-w-[18rem] text-left text-[14px] leading-[1.55] tracking-[-0.01em] text-inherit",
    (image || effect) && "cursor-pointer",
  )}
  onclick={image ? openMedia : effect && fireworks ? () => fireworks.launch(effect) : undefined}
>
  <LifelineEventText {event} />
  {#if image}
    <!-- Glued to the last word with a no-break space so the icon
         can never wrap onto a line of its own. -->
    <span class="whitespace-nowrap">
      &nbsp;{#if image.video}<Film
          class="ml-0.5 inline-block h-3 w-3 -translate-y-px text-zinc-400 transition-colors duration-300 dark:text-zinc-600"
          strokeWidth={1.75}
          aria-hidden="true"
        />{:else}<ImageIcon
          class="ml-0.5 inline-block h-3 w-3 -translate-y-px text-zinc-400 transition-colors duration-300 dark:text-zinc-600"
          strokeWidth={1.75}
          aria-hidden="true"
        />{/if}
    </span>
  {/if}
</p>

{#if lightboxStart && image}
  <LifelineLightbox
    photo={image}
    rotate={0}
    start={lightboxStart}
    getHome={measureText}
    onClosed={() => (lightboxStart = null)}
  />
{/if}
