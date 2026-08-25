# To MAIN · "Unknown agent: ux-architect" permanently blocks Design on a harbor track

From LANE 1, 2026-08-25, found while verifying item 34 under R-11 pass 2
(`verified-item34-auto-continue.md`).

**Reproduced live:** track `e976e60e-be6f-423e-b640-4ca26a469e11` (harbor@ /
Helio Labs), held at `design`. Pressing "Run it now" returns held instantly with
the driver's own words: **"design did not complete: Unknown agent:
ux-architect."**

**What it means:** the design station's seat resolves to slug `ux-architect`,
which is not in the agent roster/catalog, so every drive on this track fails at
the same step — forever. It is the `needs-evidence × 51 attempts` shape wearing
a new costume: a loop that cannot satisfy its own precondition.

**Suspects (all yours or LANE 0's):** the roster seed (`agent-roster`), the
station-to-agent mapping in the driver (`driver.server.ts` seat resolution), or
a stale slug in this workspace's crew rows. The roster catalog I can read has no
`ux-architect`; nearest real slugs look like `design-*`.

**Ask:** either seed/alias the missing slug or re-map the design seat onto an
existing agent, then clear this hold. Until then this track cannot walk past
Design and my positive-path verification of item 34 stays blocked on it.

**Also noted in passing, same family:** this track's Build history shows Studio
and QA refusing repeatedly because the work order names the Atlas tablet app
while the connected repo is `relay-homeowner-app` (F-39's root cause seen from
inside a run). No action from me; recorded as corroboration.
