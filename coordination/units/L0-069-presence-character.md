# UNIT L0-069 — Phase 3 presence: the character, mounted in the run

**Lane:** LANE 0 · **Item:** SPEC-PRESENCE (component + mount 1) · **Date:** 2026-08-25

## What changed

- **`src/components/presence/Character.tsx` (new)** — the one worker who fronts
  the crew: mark (initial disc, lift ground, edge stroke), state chip, and ONE
  line under the name. Seven states per SPEC-PRESENCE's table. Motion budget:
  three equalizer bars on Thinking/Working only, on Meridian's own `mrd-eq`
  keyframes; every other state is still; ember stays in the logo.
- **Mounted first in `TrackRun`** (spec mount 1 — top of the run, where its
  asking voice is the consent card below it).

## The iron law, kept at the pixels

The derivation reads ONLY what the page already holds: `spine_tracks.hold`,
`DriveNowResult.stopped/more`, last step's driver-written line, legs remaining.
No new polls, no timers, no authored flavour lines — a state without a
provenance renders the state word alone. Mapping:

| State | Derives from |
| --- | --- |
| done | track done, or drive returned `finished` |
| asking | hold = `waiting-on-a-person` |
| blocked | hold = `tools-refused` |
| working / thinking | walk in flight, with / without a step yet |
| resting | `out-of-window` + more (legs spent or between presses) |
| awake | everything else |

## Deliberate scope notes for MAIN

1. **`lib/presence/character.ts` has not landed.** This component ships against
   the spec'd state contract with a local placeholder name constant
   (`CHARACTER_NAME = "Supa"`, one file, founder-replaceable). When MAIN's
   module lands, the derivation input upgrades to it (tool-call verb map,
   richer lines) and my mapping shrinks into it — flagged here so the swap is
   expected, not a surprise.
2. The verb-line grammar under a step count ("Step N of M") is Rox's pattern;
   needs MAIN's tool_calls read to be honest. Not faked locally.

## Gates

`tsc` 0 · full suite **10,947 pass / 0 fail** · eslint 0 errors · no dev server.

What would prove it false: a state showing that no row proved (e.g. Working
while no walk is in flight); bars animating during Asking/Blocked; a flavour
line substituting for an honest hold sentence.
