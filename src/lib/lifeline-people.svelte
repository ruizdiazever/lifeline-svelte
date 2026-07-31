<script lang="ts">
  import { getInitials, type AggregatedLifelinePerson } from "./lifeline-people";

  let { people, allowWrap = false }: { people: AggregatedLifelinePerson[]; allowWrap?: boolean } =
    $props();
</script>

{#if people.length > 0}
  <div class="w-full space-y-3">
    {#each people as person (person.name)}
      <div class="flex w-full items-center gap-2.5">
        <div class="flex w-3 shrink-0 items-center justify-center gap-0.5">
          {#if person.mentor}
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true"></span>
          {/if}
          {#if person.met}
            <span class="h-1.5 w-1.5 rounded-full bg-pink-500" aria-hidden="true"></span>
          {/if}
        </div>
        {#if person.photo}
          <img
            src={person.photo}
            alt={person.name}
            width={28}
            height={28}
            class="h-7 w-7 shrink-0 rounded-full object-cover"
          />
        {:else}
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white transition-colors duration-300 dark:bg-white dark:text-black"
          >
            {getInitials(person.name)}
          </span>
        {/if}
        <p
          class={allowWrap
            ? "text-left text-[13px] leading-snug text-zinc-500 transition-colors duration-300"
            : "whitespace-nowrap text-left text-[13px] text-zinc-500 transition-colors duration-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-400"}
        >
          {person.name}
        </p>
      </div>
    {/each}
  </div>
{/if}
