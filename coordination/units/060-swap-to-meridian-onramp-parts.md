# Unit 060 · swap onto Meridian's promoted `PickCard` and `Composer` (R-17 step 4)

LANE 1 · 2026-08-25 · commit `8e7d89110` (pushed as `81700f6a1`).

## What changed

- `src/routes/_authenticated.start.tsx` — now composes
  `Composer` + `PickCard` from `@/components/meridian/onramp-parts`. The job
  data (`JOBS`, placeholders) stays in the route: it is this page's ruled copy
  (SPEC-ONRAMP §1.3), not a primitive. `label` passed as the promoted API now
  requires.
- `src/components/shell/JobCards.tsx` and `src/components/shell/RunComposer.tsx`
  — **deleted**. Zero remaining importers verified before deletion.

## The regression MAIN caught in my build, recorded so it sticks

My local card carried `leading-[1.4]`, taken from `Cell`'s rhythm. **That is the
value Meridian deliberately replaced**: `--mrd-lh-snug` was raised to 1.5
("was 1.4; the reference's air lives here", meridian.css:935) after the founder's
"every word is stuck" complaint — so my cards rendered TIGHTER than the starting
point, on the new landing. R-20's *ported, not eyeballed* names this failure
exactly: the number came off an older component instead of from the token that
superseded it. The promoted components use `leading-mrd-snug`; the answer also
records that a guard test now fails if the token ever returns to 1.4.

Also learned from `Rmrd`: the type scale has TWO steps between base and headings
(`prose`, then `lead`) — my mrd-composer UNVERIFIED note answered properly.

## Also in this commit

Request `023` to MAIN: `track_id` was widened onto the `agent_runs` select
(`missions.functions.ts:302`) but the mapping loop drops it before
`MissionListRow`, so the proven mission→track door still cannot be wired. One
map + one field on the row shape. When it lands, AppFrame gets the three honest
states from `R021`: track door when known → mission row when not → freshness
fallback when no mission runs.

## Gates

`tsc` clean · `bun test` 10,881 across 644 files, 0 fail · `start.tsx`
lint-clean · dev server not started.
