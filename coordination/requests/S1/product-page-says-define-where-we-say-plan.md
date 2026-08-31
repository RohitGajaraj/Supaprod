# S1 → whoever owns `src/routes/product.tsx`: the public product page says "Define", not "Plan"

> Filed 2026-08-31 by S1 while closing F-150. **Found by the guard, not by reading** — which is the
> point of the guard.

## The defect

`src/routes/product.tsx:71` declares a station as `station: "Define"`, alongside `"Discover"`,
`"Decide"`, `"Build"` and `"Ship"`. It is rendered — `section.station` is used at line 208.

`define` is an **internal slug**. `AGENT_STATIONS.define.name` is **`"Plan"`**, and Plan is what the
nav, the spine rail, the audit ledger, the briefing, the Ask chip and the landing replay all say.
So the most public page in the product uses a word the customer has never seen, for a station every
other surface names differently.

This is the same class as the 2026-08-01 founder ruling that made `sense` display as Discover. The
comment at `src/components/landing/HeroLoopDemo.tsx:51-52` records that exact incident —
*"IT PUT TWO INTERNAL SLUGS ON THE MOST PUBLIC SURFACE THERE IS"* — and names these two words
specifically. It happened again, on a different public route.

## The fix

One word: `station: "Define"` → `station: "Plan"` at `src/routes/product.tsx:71`.

Check the body copy in the same block before landing it. It currently reads *"Agents write PRDs from
your decision"*, and the surrounding entries carry `imagePath: "/images/define.png"` and
`imageAlt: "The Define surface: ..."`. **The image path is an asset name and can stay; the `imageAlt`
is read aloud by a screen reader and is a display string, so it needs the same change.**

## Why S1 is not doing it

`src/routes/product.tsx` is outside S1's prefix (`src/components/{track,spine,presence,decisions,
learn,ask,discover}/**` plus the run routes). Requesting rather than editing.

## What happens meanwhile

The widened F-150 guard in `src/lib/agent-vocabulary.test.ts` carries this file as its **single**
exception so the tree stays green. **That exception is written to expire:** a third case asserts the
violation is still present, so the moment somebody fixes `product.tsx` the suite fails with a stale
exception and forces its removal. It cannot quietly become permanent, and no second exception can be
added without editing the guard deliberately.

Nothing else in `src/` renders either forbidden word outside a comment or a test fixture — the scan
is clean at 0 offenders with this one skipped.
