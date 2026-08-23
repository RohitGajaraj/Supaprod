# UNIT 002: styles.css sheds its dead rules, and ember becomes you

**Date:** 2026-08-23 · **Lane:** LANE 1 · **Wave:** 1
**Files:** `src/styles.css`, `src/__tests__/meridian-ratchet.baseline.json`

## What was wrong

`src/styles.css` carried 703 ratchet occurrences, the largest single concentration in the
ledger (25% of all debt). Two findings from measuring it before touching anything:

1. **Most of its debt is DEFINITIONS, not uses.** Unlike `primitives.css` (whose debt was
   uses with value-identical Meridian equivalents), this file is where two rival palettes
   are DECLARED: the Ember light theme and the full Geist/Tempo `--ds-*` scale. Those
   definitions cannot die while their consumers live, and roughly half the consumers sit on
   other lanes' paths. The honest end state is: consumers port first (cross-lane work),
   then whole definition blocks delete.
2. **A layer of it was simply dead.** Twelve CSS classes had zero consumers anywhere under
   `src` (measured with exact-token matching across every tsx/ts/css outside tests, plus a
   sweep of `src/lib` for emitted class strings and template-literal construction):
   `.surface-1`, `.surface-2`, `.shadow-elevated` (classes; the same-named tokens stay,
   four files read them via var()), `.btn-lg`, `.btn-link`, `.btn-pill`,
   `.btn-pill-outline`, `.btn-tertiary`, `.btn-approve`, `.btn-reject`, the whole
   `.btn-agentic` family (~90 lines), `.text-label-16`, `.text-label-13-mono`,
   `.text-tabular`, `.material-tooltip`. About 150 lines of retired paint.

## What changed

**Dead members deleted.** The file's own 2026-08-06 policy said keep-not-cut for the dead
btn variants ("a consumer may arrive at the next git pull"). SUPERSEDED IN PLACE, not
erased: the family comment now records why. A new consumer would itself violate the
standing retirement — Meridian's Action/Approve tiers are the control set (M07/M10) and the
ratchet fails new files reaching back here. The guard that policy wanted exists in stronger
form, so the labels became deletions. Live members (`.btn`, `.btn-primary`,
`.btn-secondary`, `.btn-ghost`, `.btn-sm`) untouched.

**ember aliased to Meridian's you, both grounds, provably identical.** Measured before
editing: `--ds-ember-600` dark = oklch(0.72 0.16 315) = `--mrd-you` dark; light =
oklch(0.5 0.19 315) = `--mrd-you` light. Both `--ember` definitions that actually win the
cascade (`:root` at the Tempo block and `[data-theme="light"]`) pointed at
`var(--mrd-you)`; the two shadowed literal definitions made consistent too. Meridian's
light ground lives on the same `[data-theme="light"]` attribute, and no `[data-mrd]`
override touches `you`, so resolution is exact everywhere.

## Verification

- **Computed values read off the running app, not source** (Playwright on `/login`):
  dark ground `--ember` = oklch(72% .16 315) = `--mrd-you`; light ground all three =
  oklch(50% .19 315). The `.btn-primary` CTA renders
  `linear-gradient(oklch(0.72 0.16 315), ...)` exactly as before the alias.
- Console errors on /login are pre-existing dev-environment artifacts (React state-update
  warning, Supabase refresh 400), unrelated.

## Gates

| Gate | Result |
| --- | --- |
| `bunx tsc --noEmit` | exit 0 |
| `bun test` | 10,631 pass / 0 fail across 628 files |
| `bun run docs:check` | exit 0 |
| Ratchet | 2,868 → **2,859** (-9); re-frozen same commit |

Per-file: styles.css `--ds-` 374→369, `--hairline` 40→39, `--glacier` 12→11,
raw-colour 189→187.

## What I learned about Wave 1's real shape

styles.css will NOT fall to alias swaps the way primitives.css did. Its remaining ~694
markers are definition-layer. The lever sequence that actually finishes it:

1. External consumers port off `--ds-*` / `--text-*` / `.material-*` (~100 uses, mostly on
   LANE 0 paths and unauthenticated routes on mine).
2. Then whole definition blocks delete at once.

I have filed nothing for this yet because the per-file breakdown of those ~100 external
uses is needed first; that census is my next unit, after which requests to LANE 0 can name
files instead of vibes.

## Unsure about

- Whether `.dark`-class-only grounds (no data-theme) ever coexist with `[data-mrd]`
  surfaces in a way that could diverge ember from you later. Today they resolve identically;
  flagged so whoever changes one family checks the other.
