# Lifeline (Svelte 5)

A timeline component for the stories that unfold over time: a career, a company, a journey.

Lifeline lays milestones on a single rail: horizontal and scrubbed by scroll on desktop, vertical on mobile. Years carry events, links, and the people who mattered; media attaches as hover reveals or floating cards that expand into a lightbox. On first load, an intro draws the rail across the years.

Svelte 5 (runes) port of [evilrabbit/lifeline](https://github.com/evilrabbit/lifeline), packaged as an installable library.

## Install

From npm:

```bash
pnpm add lifeline-svelte
# or: npm install lifeline-svelte
```

The package ships prebuilt (`dist/`), so nothing compiles on install. Peer dependencies: `svelte@^5` and `tailwindcss@^4`.

To install straight from GitHub instead: `pnpm add github:ruizdiazever/lifeline-svelte`.

## Setup

The components are styled with Tailwind classes. Tailwind 4 does not scan `node_modules` by default, so point it at the package once in your CSS:

```css
@import "tailwindcss";
@source "../node_modules/lifeline-svelte/dist";

/* Intro keyframes + rail/label/print styles */
@import "lifeline-svelte/style.css";

@custom-variant dark (&:is(.dark *));
```

If your bundler resolves package imports in CSS differently, import the file by relative path instead: `@import "../node_modules/lifeline-svelte/dist/lifeline.css";`.

Dark mode is class-based (`.dark` on `<html>`), matching the `dark:` variants the components use.

## Usage

```svelte
<script lang="ts">
  import { Lifeline, defineLifeline } from "lifeline-svelte";

  const record = defineLifeline({
    slug: "me",
    name: "Me",
    birthYear: 1990,
    description: "My story.",
    milestones: {
      1990: { id: "born", events: ["I was born."] },
      2020: {
        id: "job",
        events: [
          {
            text: "Joined Acme as designer.",
            image: { src: "/images/acme.jpg", alt: "Acme office" },
          },
        ],
        companies: [{ id: "acme", name: "Acme" }],
        mentors: [{ name: "Jane Doe", role: "Design lead" }],
      },
    },
  });
</script>

<Lifeline markers={record.markers} birthYear={record.birthYear} mode="page" />
```

`mode`: `"page"` (the timeline owns the wheel), `"embed"` (hands the wheel back at the rail's ends), `"auto"` (measured at runtime).

### Month granularity

By default the rail is one column per year. For young stories such as a company or a product, `granularity: "months"` makes it one column per month, keyed `YYYYMM`:

```ts
const record = defineLifeline({
  slug: "acme",
  name: "Acme",
  birthYear: 2024,
  granularity: "months",
  // endMonth: 202607 (defaults to the current month)
  description: "Acme, month by month.",
  milestones: {
    202405: { id: "founded", events: ["Founded."] },
    202501: { id: "seed", events: ["Raised a seed round."] },
  },
});
```

Columns label themselves `May 2024`, then `Jun`, `Jul`…, repeating the year each January. The Age row shows the company age at January columns, or at each founding-month column if you pass `birthMonth` (e.g. `birthMonth: 5` shows 0 at May 2024, 1 at May 2025). Empty months render as air, which is the point.

The vertical (mobile) layout measures itself against the nearest ancestor whose `overflow-y` is `auto` or `scroll`. Give it one. Desktop scrubs sideways and wants no scroller of its own.

Typography: the timeline typesets itself in Geist via `.lifeline-typeset`; set `--lifeline-font` to use your own face.

## Framing (optional shell)

The rail aligns itself with the host chrome via two markers: `data-site-nav-logo` (start) and `data-site-nav-inner` (end). The shell components carry them:

```svelte
<script lang="ts">
  import { LifelineShell, LifelineNav, LifelineStage, LifelineFooter } from "lifeline-svelte";
</script>

<LifelineShell>
  <LifelineNav logoLabel="Home">
    {#snippet logo()}<strong>Site</strong>{/snippet}
  </LifelineNav>
  <LifelineStage>
    <Lifeline markers={record.markers} birthYear={record.birthYear} />
  </LifelineStage>
  <LifelineFooter>© 2026</LifelineFooter>
</LifelineShell>
```

Drop the nav and the rail falls back to filling its own container, edge to edge.

## Company icons

Unregistered company ids fall back to the name's initial in a ring. Register your own marks (any Svelte component accepting `class`):

```ts
import { registerCompanyIcons } from "lifeline-svelte";
import AcmeIcon from "./AcmeIcon.svelte";

registerCompanyIcons({
  acme: { icon: AcmeIcon, sizeClassName: "h-4 w-4" },
});
```

## Events

An event is a string, a list of segments (text/links), or an object with `text`, `image` (hover reveal on desktop, tap-to-open lightbox on mobile), and `effect` (`"fireworks"` | `"fireworks-argentina"`). `photos` on a marker render floating, draggable cards that expand into a lightbox.

## Development

```bash
pnpm install
pnpm dev       # demo app (Vite)
pnpm check     # svelte-check
pnpm package   # svelte-package + publint → dist/
```

## Publishing

```bash
npm version patch   # bump version
npm publish         # prepublishOnly runs build + publint
```

The demo data lives in `demo/data/`; assets in `public/images/` are demo-only and not part of the package.

## License

MIT. Original project by [evilrabbit](https://github.com/evilrabbit/lifeline).
