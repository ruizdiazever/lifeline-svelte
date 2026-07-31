<script lang="ts">
  import type { LifelineEvent } from "./types";
  import { getEventContent } from "./lifeline-event";

  let { event, class: className }: { event: LifelineEvent; class?: string } = $props();

  const content = $derived(getEventContent(event));
</script>

{#if typeof content === "string"}
  <span class={className}>{content}</span>
{:else}
  <span class={className}>
    {#each content as segment, index (index)}
      {#if segment.type === "link"}
        <a
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
          class="underline decoration-zinc-400 underline-offset-2 transition-colors duration-300 group-hover:text-black group-hover:decoration-zinc-600 dark:decoration-zinc-700 dark:group-hover:text-white dark:group-hover:decoration-zinc-400"
        >
          {segment.value}
        </a>
      {:else}
        <span>{segment.value}</span>
      {/if}
    {/each}
  </span>
{/if}
