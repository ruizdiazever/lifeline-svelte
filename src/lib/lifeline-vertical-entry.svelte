<script lang="ts">
  import CompanyIcon from "./company-icon.svelte";
  import { getLifelineEventKey } from "./lifeline-event";
  import { aggregateLifelinePeople } from "./lifeline-people";
  import LifelinePeople from "./lifeline-people.svelte";
  import LifelinePhotoCard from "./lifeline-photo-card.svelte";
  import LifelineVerticalEvent from "./lifeline-vertical-event.svelte";
  import type { LifelineMarker } from "./types";
  import { hasMarkerContent } from "./lifeline-utils";
  import { cn } from "./utils";

  const GRID_CLASS = "grid grid-cols-[2.5rem_1rem_1fr] gap-x-3";

  interface Props {
    marker: LifelineMarker;
    birthYear: number;
    animateIntro?: boolean;
    introDelay?: number;
    introDuration?: number;
    revealPending?: boolean;
    ref?: (el: HTMLLIElement | null) => void;
  }

  let {
    marker,
    birthYear,
    animateIntro = false,
    introDelay = 0,
    introDuration = 420,
    revealPending = false,
    ref,
  }: Props = $props();

  const age = $derived(marker.age ?? marker.year - birthYear);
  const people = $derived(aggregateLifelinePeople(marker));
  const photos = $derived(marker.photos ?? []);
  const hasContent = $derived(hasMarkerContent(marker) || photos.length > 0);

  // Fresh tilts per visit; stacked neighbors lean apart.
  const photoTilts = (marker.photos ?? []).map((_, index) => {
    const sign =
      (marker.photos?.length ?? 0) > 1 ? (index % 2 === 0 ? -1 : 1) : Math.random() > 0.5 ? 1 : -1;
    return sign * (2 + Math.random() * 4);
  });

  let el: HTMLLIElement;

  $effect(() => {
    ref?.(el);
    return () => ref?.(null);
  });
</script>

<li bind:this={el} class={hasContent ? "pb-10" : "pb-3"} aria-label={marker.label ?? `${marker.year}`}>
  <div
    class={cn(animateIntro && "lifeline-marker-intro", revealPending && "opacity-0")}
    style:animation-delay={animateIntro ? `${introDelay}ms` : undefined}
    style:--lifeline-marker-fade-ms={animateIntro ? `${introDuration}ms` : undefined}
  >
    <div class="{GRID_CLASS} items-center">
      <p
        class="text-right text-[11px] font-medium leading-4 tabular-nums text-zinc-500 transition-colors duration-300 dark:text-zinc-600"
      >
        {age}
      </p>

      <div class="flex items-center justify-center">
        <span
          aria-hidden="true"
          class="block h-px w-[10px] bg-zinc-400 transition-colors duration-300 dark:bg-zinc-700"
        ></span>
      </div>

      <p
        class="whitespace-nowrap text-[15px] font-medium leading-5 tabular-nums text-zinc-500 transition-colors duration-300 dark:text-zinc-400"
      >
        {marker.label ?? marker.year}
      </p>
    </div>

    {#if hasContent}
      <div class="{GRID_CLASS} mt-6">
        <div aria-hidden="true"></div>
        <div aria-hidden="true"></div>
        <div class="min-w-0 text-zinc-500 transition-colors duration-300 dark:text-zinc-400">
          {#if marker.badges && marker.badges.length > 0}
            <div class="mb-3 flex items-center justify-start gap-2">
              {#each marker.badges as badge (badge.src)}
                <img
                  src={badge.src}
                  alt={badge.alt}
                  class="h-6 w-6 object-contain opacity-80"
                />
              {/each}
            </div>
          {/if}

          {#if marker.companies && marker.companies.length > 0}
            <div class="mb-2 flex items-center justify-start gap-1.5">
              {#each marker.companies as company (company.id)}
                <CompanyIcon id={company.id} label={company.name} class="opacity-70" />
              {/each}
            </div>
          {/if}

          {#if marker.events.length > 0}
            <div class="space-y-4">
              {#each marker.events as event, index (getLifelineEventKey(event, index))}
                <LifelineVerticalEvent {event} />
              {/each}
            </div>
          {/if}

          {#if photos.length > 0}
            <div class="mt-6 flex flex-wrap items-start">
              {#each photos as photo, index (`${photo.src}-${index}`)}
                <LifelinePhotoCard
                  {photo}
                  rotate={photo.rotate ?? photoTilts[index] ?? 0}
                  width={160}
                  class={cn("relative", index > 0 && "-ml-8 mt-6")}
                />
              {/each}
            </div>
          {/if}

          {#if people.length > 0}
            <div
              class="mt-6 border-t border-zinc-200/70 pt-5 transition-colors duration-300 dark:border-zinc-800/70"
            >
              <LifelinePeople {people} allowWrap />
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</li>
