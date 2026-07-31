<script lang="ts">
  import { getCompanyIcon, type CompanyIconId } from "./company-icon";
  import { cn } from "./utils";

  let { id, label, class: className }: { id: CompanyIconId; label: string; class?: string } =
    $props();

  const entry = $derived(getCompanyIcon(id));
</script>

{#if entry}
  <span
    class={cn(
      "inline-flex shrink-0 items-center justify-center text-black transition-colors duration-300 dark:text-white",
      entry.sizeClassName ?? "h-4 w-4",
      className,
    )}
    aria-label={label}
    title={label}
  >
    <entry.icon class="h-full w-full" />
  </span>
{:else}
  <span
    title={label}
    aria-label={label}
    class={cn(
      "inline-flex h-5 w-5 select-none items-center justify-center rounded-full text-[10px] font-semibold uppercase leading-none ring-1 ring-current/30",
      className,
    )}
  >
    {label.charAt(0)}
  </span>
{/if}
