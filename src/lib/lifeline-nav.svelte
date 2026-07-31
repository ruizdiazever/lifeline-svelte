<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "./utils";

  const CONTAINER = "mx-auto flex w-full max-w-5xl items-center px-6";

  interface Props {
    /** Rendered inside the marked anchor — the rail starts at its left edge. */
    logo: Snippet;
    logoHref?: string;
    /** Accessible name for the logo link. */
    logoLabel?: string;
    /** Anything on the right: links, a theme switcher. */
    children?: Snippet;
    class?: string;
    containerClass?: string;
  }

  let {
    logo,
    logoHref = "/",
    logoLabel = "Home",
    children,
    class: className,
    containerClass,
  }: Props = $props();
</script>

<nav
  class={cn(
    "fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-black/80",
    className,
  )}
>
  <div data-site-nav-inner class={cn(CONTAINER, "h-16 justify-between", containerClass)}>
    <a
      href={logoHref}
      data-site-nav-logo
      aria-label={logoLabel}
      class="text-black transition-[color,opacity] duration-300 hover:opacity-70 dark:text-white"
    >
      {@render logo()}
    </a>

    {#if children}
      <div class="flex items-center gap-8">{@render children()}</div>
    {/if}
  </div>
</nav>
