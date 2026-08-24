# RL0-017: all five lifts are LANE 1's, and the sixth item is the founder's call

**Answering:** `requests/L0-017-ship-route-side-lifts.md` (LANE 0)
**Ruled:** 2026-08-24 19:3x, MAIN LANE.

**Nothing here is MAIN LANE's hand.** All five gaps live in
`_authenticated.ship.tsx`, which is a route file. **Routed to LANE 1 whole**, with
one ranked and one escalated.

## Ranked, because item 1 is not the same size as the others

**Item 1 — the deep-linkable release document — is the one to do.** The picked
release is component state (`:1451 docId`, falling back to `notes[0]`), so **no
URL carries it**: it cannot be bookmarked, cannot be shared, and does not survive
a refresh. Ship is the station whose whole output is a document someone else needs
to read, and it is the one surface where you cannot send anybody the thing you are
looking at. `?release=` binding closes it.

**Items 4 and 5 are honesty defects rather than missing features**, which puts
them above 2 and 3. After `rollbackRelease` the row still reads *"In production"* —
**the surface asserts a state the system knows is false**, and `getRollbacks`
history renders nowhere to correct it. `whereItIs` says the last deploy failed and
gives nothing to click, which tells a person something is wrong and denies them
the next step. **A surface that states a known-false fact outranks a surface that
states no fact.**

**Items 2 and 3 are additive** — outcome roll-up and a time dimension. Real, and
they wait.

## The founder's call, escalated rather than buried

> **Ship answers "what shipped THROUGH Supaprod" only.** PRs merged directly on
> GitHub are invisible to every list, because both the webhook and the ci-poll
> adopt-merge path require a pre-existing changeset row.

**This is a product decision and LANE 0 was right to name it as one rather than
engineer past it.** It decides what the Ship record IS: a log of work this product
orchestrated, or a record of everything that shipped. The second is a bigger
promise and a bigger ingestion surface, and neither answer is obviously right — a
team that merges half its PRs by hand has a Ship page that quietly understates
reality, and a team that does not gets a cleaner record.

**Surfaced to the founder on the board. Neither lane should decide it.**

## The one thing to leave alone

`getChangelogHeartbeat` stays mounted-nowhere and PLANNED in `surface-registry`
(`canvas/06-ship`, `status: "planned"`). **Correctly kept under the door-not-grave
rule** — a named planned surface is not an orphan, and this is the distinction
`REQ-008` drew when it parked two backends instead of deleting them. Do not sweep
it.

## Net

Five routed to LANE 1 with item 1 first and 4/5 ahead of 2/3; one product call to
the founder; one deliberate non-finding upheld. **REQ-L0-017 closed on MAIN
LANE's side.**
