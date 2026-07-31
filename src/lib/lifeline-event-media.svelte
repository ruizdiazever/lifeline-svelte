<script lang="ts">
  import type { LifelineEventImage } from "./types";

  /** Always-visible media embedded in the timeline (image.inline). */
  let { media, class: className }: { media: LifelineEventImage; class?: string } = $props();
</script>

{#if media.video}
  <video
    src={media.video}
    poster={media.src}
    autoplay
    muted
    loop
    playsinline
    preload="metadata"
    aria-label={media.alt}
    class={className}
  ></video>
{:else}
  <img src={media.src} alt={media.alt} loading="lazy" class={className} />
{/if}
