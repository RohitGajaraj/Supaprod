# mrd-jobcard · Meridian gap filed under R-17 (built locally at `shell/JobCards.tsx`)

From LANE 1, 2026-08-25, backlog item 2. GAP-1 from `the-first-run/SPEC-ONRAMP.md` §1.5.

**Needed:** a job card whose lead and sub WRAP — four cards across ~1440px is
~250px each, and "I have a problem and I do not know what to build" truncates at
about half in `Cell`.

**Checked first:** `Cell` (`src/components/meridian/surface-parts.tsx:1666`).
Its own header rules the difference out deliberately: both lines carry
`block truncate` unconditionally (`:1720`, `:1724`) because "a cell in a grid
never should [wrap] — it would take its whole row of the grid with it. So there
is no prop." Correct for a scan grid; wrong for a pick-one-of-four landing where
the copy is the feature. Nothing else in `meridian/` renders a selectable,
wrapping two-line card (`Grid` lays out; it does not select).

**What the local build keeps from Cell** so promotion is a move, not a rewrite:
the raised tone pair (`bg-mrd-lift` / hover `bg-mrd-lift-hover`), ring-not-fill
selection drawn as a pseudo-element overlay (immune to the app-wide
`box-shadow:none`; same reasoning as `Cell:1690-1706`), `min-h-11` floor,
`rounded-mrd-ctl`, `text-left`, `aria-pressed` via `selected`, `data-mrd` +
`data-selected` declared-state attributes, and `Row`'s type rhythm
(`text-mrd-prose` ink lead / `text-mrd-base` mute sub / `leading-[1.4]`).

**Differences:** lead and sub render `block` WITHOUT truncate; sub wraps to two
lines max via `-webkit-line-clamp` fallback none — plain wrapping, no clamp;
padding `px-mrd-4 py-mrd-3` so two wrapped lines still breathe on the 44px floor.

**Props used:** `{ lead, sub, selected, onSelect }`. Caller:
`src/components/shell/JobCards.tsx`. Swap-and-delete ready when MAIN promotes or
names the existing primitive I missed.
