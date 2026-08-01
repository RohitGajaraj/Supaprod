# Station design audits, 2026-08-01

> **PROVENANCE WARNING, read before using any file in this folder.**
> These eight documents were written by autonomous audit subagents during the 2026-08-01 spine
> depth session. **They are raw, UNVERIFIED agent output.** They were not reviewed line by line
> before being committed, and they are kept because the raw material is useful, not because it
> is trusted.

## Why the warning is not boilerplate

In the same session, agent-written material landed in the app and contained two defects of
exactly the kind this repo exists to remove:

- a raw cosine similarity rendered to the user as `72% match` (a 0.72 cosine is not 72% of
  anything a reader recognises, and no product in this category ships a similarity score at all);
- workspace-wide source coverage printed under the heading "Backed by 3 sources" on one specific
  bet, which would have read identically on a bet with no evidence whatsoever.

Both were caught and corrected. Assume the same error rate in these documents.

## How to use them

1. **Treat every claim as a lead, not a finding.** Verify against the code before acting.
   Several claims in the first audit round were wrong: Plan was reported as having "zero
   mutations" when `RoadmapColumns` carries five, and Build was reported as having no door when
   its rows are clickable into their run.
2. **File:line citations are the useful part.** They point at real code; the interpretation
   around them may not hold.
3. **Do not cite these as canon** in a commit message, a doc, or an investor surface.

## What is in here

| File | Covers |
| --- | --- |
| `SEVEN-STATIONS-BLUEPRINT.md` | the end-to-end loop, station by station. Its own header notes only Discover and Decide were complete when it was written. |
| `discover-station-audit.md` | Discover, the station that then received a full depth pass |
| `discover-prototype-specs.md` | proposed Discover prototypes, largely not built |
| `decide-station-audit.md` | Decide |
| `plan-station-audit.md` | Plan |
| `design-station-audit.md` | Design |
| `build-station-audit.md` | Build |
| `ship-and-learn-stations-audit.md` | Ship and Learn |

## What was actually shipped from this session

The verified, gated work is in the commit history from `771c2606` onward, and the durable
account is [`../operations/session-handoff.md`](../operations/session-handoff.md). Read that
first; read these only for the underlying detail.
