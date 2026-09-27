<script lang="ts">
  import Film from "@lucide/svelte/icons/film";
  import ImageIcon from "@lucide/svelte/icons/image";
  import CompanyIcon from "./company-icon.svelte";
  import {
    getLifelineEventEffect,
    getLifelineEventImage,
    getLifelineEventKey,
  } from "./lifeline-event";
  import LifelineEventText from "./lifeline-event-text.svelte";
  import { getLifelineFireworks } from "./lifeline-fireworks";
  import { getLifelineHoverImage } from "./lifeline-hover-image";
  import { aggregateLifelinePeople } from "./lifeline-people";
  import LifelinePeople from "./lifeline-people.svelte";
  import type { LifelineMarker } from "./types";
  import { cn } from "./utils";

  interface Props {
    marker: LifelineMarker;
    birthYear: number;
    minWidth: number;
    animateIntro?: boolean;
    introDelay?: number;
    introDuration?: number;
    ref?: (el: HTMLDivElement | null) => void;
  }

  let {
    marker,
    birthYear,
    minWidth,
    animateIntro = false,
    introDelay = 0,
    introDuration = 420,
    ref,
  }: Props = $props();

  const age = $derived(marker.age ?? marker.year - birthYear);
  const people = $derived(aggregateLifelinePeople(marker));
  const hoverImage = getLifelineHoverImage();
  const fireworks = getLifelineFireworks();

  let el: HTMLDivElement;

  $effect(() => {
    ref?.(el);
    return () => ref?.(null);
  });
</script>

<div
  bind:this={el}
  class="group relative shrink-0 pr-8 transition-opacity duration-300 ease-out will-change-opacity"
  style:width="{minWidth}px"
  aria-label={marker.label ?? `${marker.year}`}
>
  <div
    class={cn("relative", animateIntro && "lifeline-marker-intro")}
    style:animation-delay={animateIntro ? `${introDelay}ms` : undefined}
    style:--lifeline-marker-fade-ms={animateIntro ? `${introDuration}ms` : undefined}
  >
    <span
      class="absolute left-0 top-[var(--lifeline-rail)] z-10 h-[10px] w-px -translate-y-1/2 bg-zinc-400 transition-colors duration-300 group-hover:bg-zinc-600 dark:bg-zinc-700 dark:group-hover:bg-zinc-400"
      aria-hidden="true"
    ></span>

    <div class="flex w-full flex-col items-start text-left">
      <p
        class="mb-5 h-4 text-[11px] font-medium leading-4 tabular-nums text-zinc-500 transition-colors duration-300 group-hover:text-black dark:text-zinc-600 dark:group-hover:text-zinc-400"
      >
        {age}
      </p>

      <p
        class="mb-6 h-5 whitespace-nowrap text-[15px] font-medium leading-5 tabular-nums text-zinc-500 transition-colors duration-300 group-hover:text-black dark:group-hover:text-white"
      >
        {marker.label ?? marker.year}
      </p>

      <div
        class="relative w-full pb-10 text-zinc-500 transition-colors duration-300 group-hover:text-black dark:group-hover:text-zinc-300"
      >
        <!-- When this column carries people, the content block reserves
             the band's height as a floor: short and average columns put
             their portraits on the same line as every other column, and
             a column whose events run past the floor pushes its own
             portraits below them instead of under them. pb-6 is the gap
             in the overflow case, absorbed by the floor otherwise. -->
        <div
          class={cn(
            "flex w-full flex-col items-start pt-6",
            people.length > 0 && "min-h-[var(--lifeline-people-top)] pb-6",
          )}
        >
          {#if marker.badges && marker.badges.length > 0}
            <div class="mb-3 flex items-center justify-start gap-2">
              {#each marker.badges as badge (badge.src)}
                <img
                  src={badge.src}
                  alt={badge.alt}
                  class="h-6 w-6 object-contain opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                  style:width={badge.size ? `${badge.size}px` : undefined}
                  style:height={badge.size ? `${badge.size}px` : undefined}
                />
              {/each}
            </div>
          {/if}

          {#if marker.companies && marker.companies.length > 0}
            <div class="mb-2 flex items-center justify-start gap-1.5">
              {#each marker.companies as company (company.id)}
                <CompanyIcon
                  id={company.id}
                  label={company.name}
                  class="opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                />
              {/each}
            </div>
          {/if}

          <div class="min-h-[3.25rem] space-y-4">
            {#each marker.events as event, index (getLifelineEventKey(event, index))}
              {@const image = getLifelineEventImage(event)}
              {@const effect = getLifelineEventEffect(event)}
              <p
                class={cn(
                  "max-w-[18rem] text-left text-[14px] leading-[1.55] tracking-[-0.01em] text-inherit",
                  effect && "cursor-pointer",
                )}
                data-lifeline-interactive={effect ? "" : undefined}
                onmouseenter={image && hoverImage ? () => hoverImage.show(image) : undefined}
                onmouseleave={image && hoverImage ? () => hoverImage.hide() : undefined}
                onclick={effect && fireworks ? () => fireworks.launch(effect) : undefined}
              >
                <LifelineEventText {event} />
                {#if image}
                  <!-- Glued to the last word with a no-break space so
                       the icon can never wrap onto a line of its own. -->
                  <span class="whitespace-nowrap">
                    &nbsp;{#if image.video}<Film
                        class="ml-0.5 inline-block h-3 w-3 -translate-y-px text-zinc-400 transition-colors duration-300 dark:text-zinc-600"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />{:else}<ImageIcon
                        class="ml-0.5 inline-block h-3 w-3 -translate-y-px text-zinc-400 transition-colors duration-300 dark:text-zinc-600"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />{/if}
                  </span>
                {/if}
              </p>
            {/each}
          </div>
        </div>

        {#if people.length > 0}
          <div class="w-full">
            <LifelinePeople {people} />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
