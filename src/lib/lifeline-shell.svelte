<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "./utils";

  /**
   * The page framing the Lifeline expects.
   *
   * The rail is not sized by CSS. On desktop it measures where to start
   * and end from the nav: `data-site-nav-logo` gives it the start, and the
   * right edge of `data-site-nav-inner` gives it the end. That is what
   * keeps the timeline inset from the viewport and aligned with the rest
   * of the page, and it's the span the intro animation draws across.
   *
   * Change `containerClass` on both the nav and the footer together
   * and the rail follows. Drop the nav entirely and the rail falls back
   * to filling its own container, edge to edge.
   */
  let { children, class: className }: { children?: Snippet; class?: string } = $props();
</script>

<div
  class={cn(
    "flex h-dvh flex-col overflow-hidden bg-white text-black antialiased transition-colors duration-300 dark:bg-black dark:text-white",
    className,
  )}
>
  {@render children?.()}
</div>
