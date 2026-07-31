<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    LIFELINE_FIREWORKS_NIGHTFALL_MS,
    LIFELINE_FIREWORKS_PALETTES,
    setLifelineFireworksContext,
  } from "./lifeline-fireworks";
  import LifelineFireworksCanvas from "./lifeline-fireworks-canvas.svelte";
  import { getTheme, setTheme } from "./theme";
  import type { LifelineEventEffect } from "./types";

  let { children }: { children?: Snippet } = $props();

  let playing = $state(false);
  let activeEffect = $state<LifelineEventEffect>("fireworks");
  let restoreTheme: "light" | null = null;
  let nightfall = 0;

  function launch(nextEffect: LifelineEventEffect) {
    if (playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    activeEffect = nextEffect;

    // Fireworks belong in the dark: switch a light page to dark for
    // the show, and restore afterwards.
    if (getTheme() === "light") {
      restoreTheme = "light";
      setTheme("dark");
      window.clearTimeout(nightfall);
      nightfall = window.setTimeout(() => (playing = true), LIFELINE_FIREWORKS_NIGHTFALL_MS);
      return;
    }

    restoreTheme = null;
    playing = true;
  }

  function done() {
    playing = false;
    if (restoreTheme) {
      setTheme(restoreTheme);
      restoreTheme = null;
    }
  }

  setLifelineFireworksContext({ launch });

  $effect(() => {
    return () => window.clearTimeout(nightfall);
  });
</script>

{@render children?.()}

{#if playing}
  <LifelineFireworksCanvas palette={LIFELINE_FIREWORKS_PALETTES[activeEffect]} onDone={done} />
{/if}
