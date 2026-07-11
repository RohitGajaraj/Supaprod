# Status Dot

> "Display an indicator of deployment status."

Source: https://vercel.com/geist/status-dot (Vercel Geist Design System)

## Sections documented

- **Default** — five `StatusDot` instances stacked vertically (`QUEUED`, `BUILDING`, `ERROR`, `READY`, `CANCELED`), dot only, no visible text label. Each has a "Show code" toggle revealing the JSX source.
- **Label** — the same five states, this time rendered with `label` set, so a sentence-cased state word (`Queued`, `Building`, `Error`, `Ready`, `Canceled`) sits to the right of the dot. Also has its own "Show code" toggle.
- **Best Practices** — an accordion-style prose block with four subsections: **When to use**, **Behavior**, **Content**, **Accessibility** (see below).

No separate "Sizes", "Types", "Variants", or "States" demo sections exist for this component — Default and Label are the only two live demos on the page. `DELETED` is mentioned in the prose as a valid `state` value but is not shown in either demo.

## API

Single component, no documented subcomponents.

```tsx
import { StatusDot } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-stretch justify-start gap-6 flex-initial">
      <StatusDot state="QUEUED" />
      <StatusDot state="BUILDING" />
      <StatusDot state="ERROR" />
      <StatusDot state="READY" />
      <StatusDot state="CANCELED" />
    </div>
  );
}
```

```tsx
import { StatusDot } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-stretch justify-start gap-6 flex-initial">
      <StatusDot label state="QUEUED" />
      <StatusDot label state="BUILDING" />
      <StatusDot label state="ERROR" />
      <StatusDot label state="READY" />
      <StatusDot label state="CANCELED" />
    </div>
  );
}
```

**Props (inferred from code samples + prose, exhaustive per the page):**

- `state` (required) — enum, deployment lifecycle only: `QUEUED | BUILDING | READY | ERROR | CANCELED | DELETED`.
- `label` (boolean, optional) — when present, renders a sentence-cased text label next to the dot (`Queued`, `Building`, `Error`, `Ready`, `Canceled`). When absent, only the dot renders (state still exposed via `aria-label` + `title`).
- `titlePrefix` (string, optional, mentioned only in prose, not in the two code samples) — a noun phrase prefixed to the composed tooltip/aria text. Default is `"This deployment"` (yields tooltips like "This deployment is queued."). For list contexts pass the specific entity, e.g. `titlePrefix="vercel-site production"`.

**Composition pattern:** the component is used standalone, typically stacked in a `flex flex-col` list of dots (one per deployment/state), or a single dot inline next to other text (in which case the docs recommend `aria-hidden` on the dot — see Accessibility below).

**Rendered DOM shape observed** (from the live demo markup, both variants):

```html
<span
  aria-label="Queued"
  class="inline-flex items-center"
  title="This deployment is queued."
  data-testid="geistcn/status-dot"
>
  <span class="inline-block size-2.5 rounded-full bg-[var(--accents-2)]"></span>
  <!-- only present when label is set: -->
  <span class="text-label-14 ml-2 leading-[16px]">Queued</span>
</span>
```

**Exact tooltip/aria strings per state** (the `title` attribute and the `aria-label`, composed from `titlePrefix` + state message):

| `state`    | `aria-label` | `title`                       |
| ---------- | ------------ | ----------------------------- |
| `QUEUED`   | Queued       | This deployment is queued.    |
| `BUILDING` | Building     | This deployment is building.  |
| `ERROR`    | Error        | This deployment had an error. |
| `READY`    | Ready        | This deployment is ready.     |
| `CANCELED` | Canceled     | This deployment was canceled. |

(`DELETED` is documented as a valid enum value but its copy is not shown anywhere on the page.)

## Best practices (paraphrased)

**When to use**

- Reserve this component strictly for deployment lifecycle status — don't repurpose it for anything else.
- For other kinds of status (workflow runs, queue messages, sandboxes, cron jobs) use `Badge` with that domain's own state vocabulary instead of stretching Status Dot to fit.
- If you need a quantified health metric (uptime %, hit rate), reach for `Gauge`; for in-progress work with a known total, use `Progress` — Status Dot is for discrete lifecycle state, not measurement.

**Behavior**

- The dot should animate only while the deployment is actively `BUILDING` or `QUEUED`; once it reaches any terminal state it goes static. Don't pair it with a separate spinner — the dot's own animation is the loading signal.
- Avoid cycling the dot's color through every transitional state on each poll; update it only when the underlying `readyState` actually changes, to avoid visual noise/flicker.
- When timing matters, pair the dot with a `RelativeTimeCard` (e.g. "Building · 12s ago") — the dot by itself carries no duration information.

**Content**

- `titlePrefix` must read as a noun phrase, never a full sentence or something ending in a verb/punctuation. Default (`"This deployment"`) suits single-deployment views; in list views pass the specific entity name (e.g. `titlePrefix="vercel-site production"`).
- Only turn on `label` when the dot has to stand alone without adjacent text explaining the state — Geist sentence-cases the state text for you automatically.
- Don't wrap the dot in redundant prose like "Status: Ready" — the label (or tooltip) already names the state; that would be double-saying it.

**Accessibility**

- The component builds its own `aria-label` out of `titlePrefix` + the state's message — don't override it with something generic like `aria-label="status"`.
- If the dot sits inline next to text that already states the same status, mark the dot `aria-hidden` so assistive tech doesn't announce the state twice.
- Color is never the sole signal — every state ships with its own distinct title/label text so colorblind users get the same information non-visually.

## Design notes

- **Dot size:** `size-2.5` (Tailwind) = 10px diameter circle, `rounded-full`.
- **Label typography:** `text-label-14` class, `ml-2` (8px) left margin from the dot, `leading-[16px]` line height.
- **Container/layout in demos:** dots stacked with `flex flex-col items-stretch justify-start gap-6` (24px gap) inside a `w-full p-6` demo card, itself in a `rounded-lg border border-gray-alpha-400 bg-background-100` panel.
- **Color tokens by state** (all via `bg-[var(--token)]` on the inner dot span):
  - `QUEUED` → `var(--accents-2)` (neutral gray)
  - `BUILDING` → `var(--geist-warning)` (amber/yellow)
  - `ERROR` → `var(--geist-error)` (red)
  - `READY` → `var(--geist-cyan)` (cyan/teal — not green)
  - `CANCELED` → `var(--accents-2)` (same neutral gray as `QUEUED`)
  - `DELETED` → not shown; likely also neutral (`--accents-2`) by analogy with the other terminal-but-non-error/non-ready states, but unconfirmed on the page.
- **Markup:** the whole dot (+ optional label) is a single `<span aria-label="..." class="inline-flex items-center" title="..." data-testid="geistcn/status-dot">` wrapping an inner `<span class="inline-block size-2.5 rounded-full bg-[...]">` (the visual dot) and, when `label` is set, a sibling `<span class="text-label-14 ml-2 leading-[16px]">` with the sentence-cased state word.
- **Motion:** described only in prose, not visible in static markup/CSS from this fetch — animate (pulse/glow, exact easing not specified on the page) while `BUILDING` or `QUEUED`; freeze on reaching a terminal state (`READY`, `ERROR`, `CANCELED`, presumably `DELETED`). No separate spinner component should be layered on top.
- **Package import path:** `@vercel/geistcn/components` (note: `geistcn`, not `geist`, in the actual import — likely the shadcn-style code-distribution package for Geist).
