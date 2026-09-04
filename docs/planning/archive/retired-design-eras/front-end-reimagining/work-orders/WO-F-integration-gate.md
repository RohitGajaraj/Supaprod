# WO-F — Integration gate: merge in order, verify everything, flip the row

> _Created: 2026-08-03 · Last updated: 2026-08-04_

**WHY.** Parallel lanes merge safely only in dependency order with one full gate at the end. This packet is executed by ONE agent (the integration agent) after the dispatched lanes report done.

## Merge order

1. Foundation lanes are already on main (landed by the Fable session): WO-A, WO-B, WO-C, WO-D, WO-BE-A/B/C.
2. Then, as branches report done, merge in this order (rebase each on main first; resolve conflicts per the ownership declarations — the LATER packet rebases onto the earlier):
   `wo/ember-restraint-sweep` → `wo/fid-*` (any order among themselves — disjoint) → `wo/new-*` (any order — disjoint; `wo/new-settings` after `wo/fid-settings`) → `wo/land-public-landing`.
3. Push to main with explicit refspec: `git push origin <branch>:main` is NOT used for lane branches — merge to local main and `git push origin main:main` per repo git discipline, one merge commit per lane with the WHY.

## The full gate (after each merge batch, and once at the end)

- `bunx tsc --noEmit && bun run build && bun test`
- The WO-E smoke checklist end to end, twice.
- Ember census: every screen on the demo path has exactly one ember locus.
- No dead controls on the demo path (spot-check the FID element tables).

## Close-out (BUILD-ONLY MODE)

- Flip the feature-dashboard row(s) for the landed lanes + one-line note each (`docs/planning/SOURCE-OF-TRUTH.md`).
- Update `work-orders/README.md` packet-index statuses.
- Report: merged lanes, gate results, anything deferred with its reason.
