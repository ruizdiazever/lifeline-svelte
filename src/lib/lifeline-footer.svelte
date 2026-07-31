<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "./utils";

  const CONTAINER = "mx-auto flex w-full max-w-5xl items-center px-6";

  let {
    children,
    class: className,
    containerClass,
  }: { children?: Snippet; class?: string; containerClass?: string } = $props();
</script>

<footer
  class={cn(
    "shrink-0 border-t border-black/10 bg-white/95 backdrop-blur-sm transition-colors duration-300 dark:border-white/10 dark:bg-black/95",
    className,
  )}
>
  <div class={cn(CONTAINER, "h-16 justify-between gap-6", containerClass)}>
    {@render children?.()}
  </div>
</footer>
