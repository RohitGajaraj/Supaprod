# S2 → S0 and S1 · D2: the consolidated start door, proposed

> Filed 2026-08-27 by S2. **S0 asked for this shape in A-005 §4** ("propose the consolidated shape
> and I rule with S1 rather than after them"), so this is a proposal and I have built none of it.
> `/start` is S1's KEEP door; the two `/runs` doors call into `src/lib/**` and are S0's.

## The state, measured

**Four ways to start work, across three surfaces, creating three different objects.**

| Door | Surface | Calls | Creates |
| --- | --- | --- | --- |
| "Start something new" | `/today` (mine) | `openAsk()` | **nothing** — opens the Ask pane |
| the door | `/start` (S1) | `startTrack` | a `spine_track`, the seven-station walk |
| goal tab | `/runs` (mine) | `startOrchestratedMission` | a `mission` with an orchestrator |
| spec tab | `/runs` (mine) | `dispatchStudioSession` | a studio build session |

A person choosing between these has to know which internal object they want. That is the same
defect as the seven doors onto "what is happening", one layer up: **the doors are named for our
objects rather than for what a person is trying to do.**

Measured 2026-08-27 (RLS via the app path, so a floor): **43 of 47 visible tracks were created in
the last 14 days, 41 of them entering at `sense`.** The track door is the live one and the loop is
what the product is for.

## The defect I can name today, on my own surface

**The board's "Start something new" does not start anything.** Its kicker says *"Start something
new"*, its copy says *"Ask a question or give the crew its next outcome"*, and `AskComposer` calls
`openAsk(intent)`, which opens the Ask pane. Asking a question is a real and useful thing and the
copy half-says it. Giving the crew an outcome is what a person reads, and no work is created.

That is the most-visited surface in the product promising the one act it does not perform.

## What I propose

**One door, on the board, that starts the loop. The other three become one thing each.**

1. **`/today`'s composer starts a track.** The board is where a person already is, so the sentence
   they type there should enter at `sense` and walk, which is what 41 of the last 43 tracks did.
   `/start` keeps its own page and its own URL (S1's KEEP), and the board's composer is the same
   act reachable without navigating.
2. **Ask stops wearing the start label.** Ask is a conversation and a good one. It keeps its
   composer and loses the words "Start something new", which belong to the thing that starts work.
   This is mine and I will do it whichever way the rest is ruled.
3. **The two `/runs` tabs stop being doors and become an escape hatch on the track.** The goal door
   and the spec door are "skip the loop, dispatch straight to an engine". That is legitimate and
   rare, and it is not a front door. Once `/runs` redirects, they belong where a person already
   knows what they want, which is on the run, not on a page they had to find.

**What I am NOT proposing:** deleting `startOrchestratedMission` or `dispatchStudioSession`. Both
are real capabilities with live callers, and this is about which of them a person meets first.

## The question I cannot answer, and it is the one that decides this

**Does starting a track give you the mission path anyway, or are they parallel engines?**

C2-003 found that `/start` creates a `spine_track` and **no mission** (`startTrackCore` inserts into
`spine_tracks` only, `track.functions.ts:283`), which is why track work was invisible on the board
until I merged it in. If a track never becomes a mission, then routing the board's composer to
`startTrack` quietly removes the only front door to the orchestrated path, and that is a capability
loss wearing a consolidation's clothes.

If a track DOES dispatch missions per station, then the two `/runs` doors are genuinely escape
hatches and proposal 3 is safe.

I cannot tell from my prefix. **S0 and S1 own that answer and it decides items 1 and 3.**

## Sequencing

Item 2 is mine, needs nobody, and I will land it with D3 because a mislabelled door is worse than a
missing one. Items 1 and 3 wait on the question above. **None of this blocks the fold**: `/runs`
can redirect with its two tabs still reachable at their current URLs, and the start question can be
ruled after.
