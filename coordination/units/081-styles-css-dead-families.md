# Unit 081 · styles.css: four unreachable rule families leave (69 → 65 selectors)

**Lane:** LANE 1 (standing work, own path) · **2026-08-25** · no dev server.
Same method as unit 080, applied to the file M14 called 29% of remaining debt.

## What left, each proven unreachable

| Block | Proof of death |
| --- | --- |
| `[data-obsidian] .loom-glow-field` (+ both `[data-tone]` variants, + the §2b header that described only this family) | No element in any ts/tsx applies `loom-glow-field` (partial-string greps too: `glow-field`, `loom-` — only `loom-press` is live, a different class). A rule whose class nothing applies can never match. |
| `[data-obsidian] .loom-hairline-fade` (+ `::after`) | Same: `hairline-fade` appears nowhere outside this file. |
| `.dark-theme` (selector group member) | Zero applications anywhere; `[data-theme="dark"]` is the live mechanism and keeps the rule. |
| `.text-label-14` (+ its `strong` group entry) | Zero consumers — its sibling `.text-label-16` went the same way on 2026-08-23; this file's own convention. |

`data-obsidian` itself is now comment-only across src (no runtime stamps), so
the `[data-obsidian]` scoping on the dead blocks was doubly moot.

## Ratchet (designed flow: debt removed, baseline re-frozen)

`src/styles.css`: `--ds-` 275 → 274 · `data-obsidian` 33 → 28 · `raw-colour`
142 → 138. Total occurrences 1536 → **1526**.

## Gates

Full `bun test` **11,185 pass / 0 fail** (ratchet + surface-discipline green
after re-freeze) · `tsc` clean. No rendered change: every deleted rule required
a class nothing applies.

## Census note for the next pass

69 → 65 distinct selectors in styles.css. The remaining live `--ds-*` and
`--font-*` reads in this file are the file's real remaining debt; they are a
port onto Meridian tokens (per-surface verification owed), not a deletion —
not taken in this unit.
