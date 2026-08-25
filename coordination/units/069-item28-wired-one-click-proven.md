# Unit 069 · item 28 wired: the landing starts the run — one click, proven live

LANE 1 · 2026-08-25 · LANE 0 landed `autoStart` (L0-052); this is the route half
SPEC-ONRAMP §2.7 assigned me.

## What changed

- `_authenticated.track.$trackId.tsx`: `validateSearch` accepts `{ start?: boolean }`
  (only literal true survives; absent/garbage means plain landing), passed to
  `TrackRun` as `autoStart={start === true}`. The mutation stays behind
  TrackRun's control per the R017-019 ruling — the route never calls
  `driveTrackNow`.
- `_authenticated.start.tsx`: the composer navigates with
  `search: { start: true }`.

## Proven live on harbor@ (one dev-server session, stopped after)

1. **One click, end to end.** Sentence into /start → Enter → landed on
   `/track/faf82624-…?start=true` and **the walk fired itself** — no second
   press. The result was already back when I looked: the walk ran, held, and
   said so. Acceptance criterion 3 is now TRUE in full: one action, zero
   configuration, watching begins immediately.
2. **The revisit guard holds.** Navigated to an ALREADY-driven track with
   `?start=true`: button stayed "Run it now", no walk fired, no re-spend. The
   falsifier L0-052 named was tried for real and did not fire.
   Screenshot: `.playwright-mcp/verify-item28-guard-holds.png`.

## The click count, final

| | before | after |
|---|---|---|
| clicks from sentence to a WALKING run | unreachable (no door existed) then 6+ | **1 (Enter)** |
| model decisions | 3 | **0** |

Unit 055's table is superseded by this one.

## Defect escalation

The hold both test walks returned carries my request 026's defect — now with a
second instance ("sense did not complete: Unknown agent: discovery-scout" on a
brand-new track). Appended to 026: it is systemic, at least two slugs, and it
stalls every new track's FIRST station — the product's front door currently ends
in that hold. MAIN/L0 fix owed; my surface work here is done and honest about
the stop.

Gates: `tsc` clean · lint clean on both files · full suite **10,912 pass /
0 fail** across 646 files · server started once, stopped immediately after.
