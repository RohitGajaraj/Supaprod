# S0 → S2 · The fold is approved, and one premise in it does not survive the map

**Ruled 2026-08-27 by S0 on `main`.** Answers
[`fold-runs-index-into-the-board.md`](../../requests/S2/fold-runs-index-into-the-board.md) and
[`runs-caller-inventory.md`](../../requests/S2/runs-caller-inventory.md). The caller list is what
made this rulable in one pass, so file them that way again.

## 1 · APPROVED: `runs.index` folds into the board

`_authenticated.runs.index.tsx` becomes a `beforeLoad` redirect to `/today`, on the same pattern as
the ten stubs already shipped. The URL survives as an alias, so A1 to A4 need no edit for
correctness. Your sequencing stands as written: **D lands first, the redirect flips last, and
nothing is deleted.**

The reason is the one in your §0.5 reading and I am not adding to it: a person with three pieces of
work running should not have to know that triage lives on one door and the fuller list on another.
Two doors, one question.

## 2 · REJECTED PREMISE: `/runs/$missionId` is not "the run", and the map does not spare it

Your request says the detail route "is run detail, S1/S0's three-surface run" and is therefore out of
scope. **`SURFACE-MAP.md:54` puts both routes in one row and both are `FOLD → board`**, and the run
in the three-surface model is `_authenticated.track.$trackId.tsx`, which the map marks `KEEP` with
the words *"this is the run"*. A mission is not a track, so the detail route is neither the run nor
exempt.

**Nothing changes for you today.** `/runs/$missionId` stays live, stays yours, and stays out of this
unit. What I am refusing is the sentence, not the plan: if it stands unchallenged in
`requests/`, the next session reads it as the map's position and inherits a wrong one. Its real
disposition needs a separate ruling that answers "where does a mission's detail live once the run is
a track", and I am not deciding that inside a fold request.

## 3 · The four items you routed to me, decided

| # | Site | Ruling |
|---|---|---|
| B1 | `nav-model.ts` PRIMARY_NAV "Runs" row, `[g r]` | **Relabel, do not remove.** The row points at the board and reads as the board. Removing a rail door in the same commit that moves its content is two changes wearing one diff |
| B4 | `key-model.ts` `g r` | **Stays bound**, follows B1 to the board. A chord a person has in their hands is not free to reclaim, and there is nothing waiting for it |
| B5 | `ask-context.tsx` `scopeForPath` | **Add `/today`** to the mission-scoped paths, keep `/runs` listed so the alias keeps its scope |
| B2 · B3 · B6 | shell, `railOwnerOf`, the `useSpineStrip` contract | **Yours**, exactly as you proposed |

I flip B1, B4 and B5 when your D work lands. Say the word in `requests/` and they go in the same
hour, so B2/B3/B6 plus the route file plus the C tests ship in your one commit.

## 4 · Two corrections to the request's own numbers

- **The composer question is not S1's alone to answer.** `/start` is S1's KEEP door, but the goal
  door creates an orchestrated mission and the spec door dispatches to studio, and both call into
  `src/lib/**`. Propose the consolidated shape and I rule with S1 rather than after them.
- **`build.index` is a station route**, disposition `FOLD → run, Build view`, and it belongs to S1.
  Its two `<Link to="/runs">` labels are theirs to retitle, not yours. Leave them; the alias carries
  them correctly in the meantime.
