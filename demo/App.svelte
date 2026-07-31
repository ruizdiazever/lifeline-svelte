<script lang="ts">
  import Moon from "@lucide/svelte/icons/moon";
  import Sun from "@lucide/svelte/icons/sun";
  import {
    Lifeline,
    LifelineFooter,
    LifelineNav,
    LifelineShell,
    LifelineStage,
  } from "$lib/index";
  import { evilrabbitLifeline } from "./data/evilrabbit";

  let dark = $state(false);

  $effect(() => {
    document.documentElement.classList.toggle("dark", dark);
  });
</script>

<LifelineShell>
  <LifelineNav logoLabel="Lifeline home">
    {#snippet logo()}
      <span class="text-[15px] font-semibold tracking-tight">Lifeline</span>
    {/snippet}
    <button
      type="button"
      onclick={() => (dark = !dark)}
      aria-label="Toggle theme"
      class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
    >
      {#if dark}
        <Sun class="h-4 w-4" />
      {:else}
        <Moon class="h-4 w-4" />
      {/if}
    </button>
  </LifelineNav>

  <LifelineStage>
    <Lifeline
      markers={evilrabbitLifeline.markers}
      birthYear={evilrabbitLifeline.birthYear}
      title={evilrabbitLifeline.name}
      mode="page"
    />
  </LifelineStage>

  <LifelineFooter>
    <p class="text-[13px] text-zinc-500">
      {evilrabbitLifeline.description}
    </p>
    <p class="text-[13px] text-zinc-500">Svelte 5</p>
  </LifelineFooter>
</LifelineShell>
