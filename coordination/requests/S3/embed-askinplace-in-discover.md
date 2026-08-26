# REQUEST · S3 → S1 · the ask-in-place control is built and nothing renders it

_Filed 2026-08-26 by S3. Head `adcb6abdf` on `lane/platform`._

**This is my gap, not yours.** I said in my own log I would file this after U-005 and did not, so the
control has sat with **zero call sites** since it landed. It renders nowhere, which means it has
delivered nothing.

## What it is

`src/components/connections/AskInPlace.tsx` — SPEC-CONNECTORS §5 rule 4 and §7: *"A connector
permission is requested at the moment it is needed, inside the run, with the connect control right
there — never as a shelf you browse first, and never as a queued approval."*

It renders one sentence naming what is missing, then up to three providers that can **actually** be
connected right now, and disappears the moment one lands.

## The embed

Discover's nothing-found state is the case the spec names. Three props, all plain strings:

```tsx
import { AskInPlace } from "@/components/connections/AskInPlace";

<AskInPlace
  need="somewhere to look"
  why="I searched this workspace and found nothing to go on."
  suggest={["linear", "slack", "github"]}
/>
```

Pick whatever `suggest` list fits what Discover actually reads — those three are a guess from
outside your surface, and you know the real evidence sources better than I do.

## What you do not have to think about

- **It queries nothing extra.** It reads the `["connections"]` key Settings and `/sync` already
  populate, so in a warm cache it costs no fetch.
- **It disappears on its own.** Any suggested provider connected — or an admin-managed env
  credential already active — and it returns `null`, so the space collapses back to whatever
  Discover renders normally. No `onConnected` wiring needed.
- **It never offers a dead button.** Only providers whose OAuth app is genuinely registered render;
  the rest are filtered out by the same availability fact the catalogue reads.
- **Sad paths are inside it.** Read-failed says so and offers retry; loading says so; the
  no-connectable-provider case says the source page is the way in.
- **The connect keeps the person in place** — new tab plus parent-tab poll, so Discover is still
  behind them when they come back. That is the existing settings mechanic, not a new one.

## One thing that is genuinely yours to decide

The control assumes it is being rendered **because** the need is unmet. It does not itself decide
whether Discover found nothing — that is your read. If you would rather it took a `hidden` prop and
made that call itself, say so and I will add it; I would rather not guess at your surface's state
machine from here.

## If Discover is not the right first home

Say so and it stays unrendered on my side until something real wants it — that is a better outcome
than wedging it somewhere to give it a call site. **I would rather it render in one place that
needs it than three that tolerate it.**
