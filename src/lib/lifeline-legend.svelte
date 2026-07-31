<script lang="ts">
  import type { LifelineLegendItem } from "./types";

  const LEGEND_DOT_CLASS: Record<LifelineLegendItem["type"], string> = {
    mentor: "bg-blue-500",
    met: "bg-pink-500",
  };

  const DEFAULT_ITEMS: LifelineLegendItem[] = [
    { type: "mentor", label: "Mentors" },
    { type: "met", label: "Met in person" },
  ];

  let { items = DEFAULT_ITEMS }: { items?: LifelineLegendItem[] } = $props();
</script>

<ul class="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-zinc-500">
  {#each items as item (item.type)}
    <li class="flex items-center gap-2">
      <span
        class="h-1.5 w-1.5 shrink-0 rounded-full {LEGEND_DOT_CLASS[item.type]}"
        aria-hidden="true"
      ></span>
      <span>{item.label}</span>
    </li>
  {/each}
</ul>
