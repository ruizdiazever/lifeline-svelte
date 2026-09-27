<script lang="ts">
  import LifelineDesktop from "./lifeline-desktop.svelte";
  import LifelineFireworksProvider from "./lifeline-fireworks-provider.svelte";
  import LifelineVertical from "./lifeline-vertical.svelte";
  import { LIFELINE_MOBILE_BREAKPOINT } from "./lifeline-layout";
  import type { LifelineProps } from "./types";
  import { cn } from "./utils";

  /**
   * `lifeline-typeset` carries the timeline's own font stack (Geist, falling
   * back to the system sans) rather than inheriting the host's `font-sans`.
   * A shadcn init writes a self-referential `--font-sans` into the theme
   * block, which resolves to the browser serif, and the timeline is dense
   * enough that the wrong face is the first thing you notice. Override
   * `--lifeline-font` to typeset it in something else.
   */
  let props: LifelineProps = $props();

  let isMobile = $state<boolean | null>(null);

  $effect(() => {
    // Matches Tailwind's md: breakpoint so JS and CSS can never disagree.
    const query = window.matchMedia(`(min-width: ${LIFELINE_MOBILE_BREAKPOINT}px)`);
    const update = () => (isMobile = !query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  });
</script>

{#if isMobile === null}
  <div class="invisible h-full" aria-hidden="true"></div>
{:else if isMobile}
  <LifelineFireworksProvider>
    <!--
      Embedded, the vertical timeline gets its own bounded scroller:
      the consumer's height lands here, and this element becomes the
      scroll parent the vertical hook looks for. Native overscroll
      chaining then releases to the page at either end, which is
      exactly the embed contract. Page mode is left alone. The host's
      own scroller owns it there, and `h-full` would only fight it.
    -->
    <div
      class={props.mode === "embed"
        ? cn("lifeline-typeset h-full overflow-y-auto pt-5", props.class)
        : "lifeline-typeset pt-5"}
    >
      <LifelineVertical {...props} />
    </div>
  </LifelineFireworksProvider>
{:else}
  <LifelineFireworksProvider>
    <LifelineDesktop {...props} class={cn("lifeline-typeset pt-5", props.class)} />
  </LifelineFireworksProvider>
{/if}
