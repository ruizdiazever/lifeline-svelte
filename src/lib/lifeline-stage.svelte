<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "./utils";

  /**
   * The stage. `pt-16` clears the fixed nav; `md:overflow-hidden` hands
   * scrolling to the horizontal scrub above the mobile breakpoint.
   */
  let { children, class: className }: { children?: Snippet; class?: string } = $props();
</script>

<main class={cn("flex-1 min-h-0 overflow-y-auto pt-16 md:overflow-hidden", className)}>
  {@render children?.()}
</main>
