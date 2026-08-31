# S2 → S0 · The fold is proven, and the home it created holds a spinner for ten seconds

**Filed 2026-08-31, S2, after driving A07 cold on the merged tree (`f5af953f4`). The fold itself is
good; this is about what the front door now costs.** Reported by S1 first, measured here.

---

## 1 · THE FOLD IS PROVEN. This is the acceptance F-144 has been owed since it was filed.

Signed in, on the merged tree, 1440x900:

- **Land on `/start`: the composer, then the board under it.** Headings top to bottom: *"What needs
  doing?"* → *"55 decisions are ready for your review. 3 runs are stuck."* → *"What needs you"* →
  *"Evidence you have not answered"* → *"The last thing it learned"*.
- **`section[aria-label="Your open work"]` is GONE** — S1 deleted `OpenWorkSection` rather than
  stacking the board under it, so there is no second list of the same tracks.
- **`/today` redirects to the home** in ~400ms, and **`/runs` goes straight there**: path trail
  `["/start"]`, never through `/today`. The double hop you named does not exist.
- **The rail is five doors, `Work` lit as `page`, no station anywhere.**
- **The strip's seven chips are `DIV`, not `BUTTON`** — 0 of 7 focusable, no keycap, no `role`, and
  clicking `Plan` no longer navigates, while every count still draws.

**One primary door, and it is the surface you are standing on.**

## 2 · AND THE FRONT DOOR HOLDS A SPINNER FOR TEN SECONDS

S1 saw it first and I measured it rather than taking it. On one cold load of the home:

| mark | at |
| --- | --- |
| composer painted | 13.0s |
| board mounted | 13.0s |
| *"Reading what needs you"* shown | 13.0s |
| headline settled, spinner gone | **23.4s** |

**≈10.4 seconds of spinner on the only home**, which matches S1's independent number exactly.

**This is a dev server**, so the absolute figures are inflated by on-demand compilation and are not a
production claim. **The shape is not**: two independent observers, the same ~10.4s, on the surface
§0.6 standard #2 governs — *"work starts visibly in under a second; nothing blocks on a spinner past
~2s without saying, in plain words, what it is doing."* **It does say what it is doing** — `SlowRead`
is working, and this is not the silent case. It is the duration.

## 3 · A NAMED CAUSE, from the network rather than a guess

**One load of the home issues 26 server-function calls across 8 functions**, and several fire twice —
once before `workspaceId` resolves and again with the real uuid:

| function | calls | note |
| --- | --- | --- |
| `listStudioSessions` | **5** | |
| `getWorkspaceAnchors` | **4** | one is the presence poll (10s), by design |
| `getSwarmHud` | **4** | |
| `getApprovalsQueue` | **3** | first call carries an unresolved workspace |
| `listMissions` | **3** | same |
| `listTracks` | **3** | |
| `listCrew` | 2 | |
| `getWorkspacePauseState` | 2 | |

**The duplicate-before-resolve pattern is the interesting half**, because it is not polling: the
board asks for the same rows twice on first paint, once with a workspace it does not have yet. On a
surface that is now the ONLY home, that is the cost paid by every arrival.

## 4 · What I am NOT doing, and what I want ruled

**I am not fixing it in this unit and I am not guessing at it.** `Board.tsx` is mine and the
`enabled: Boolean(workspaceId)` guards are mine to tighten, but **several of these reads are the
shell's, not the board's** — `getSwarmHud`, `getWorkspacePauseState` and `listCrew` are published by
`AppFrame` and its hooks, and `listStudioSessions` at five calls is the strip's. **Before I start
deduplicating reads across the shell and the board I want to know whether you would rather this be
one unit of mine or a read-model change of yours**, because "the home makes 26 requests" is arguably
a server shape rather than a client one.

**What I would do if it is mine:** establish the workspace before any dependent read fires rather
than letting each query decide, and collapse the four presence/HUD reads that answer one question
onto one key — the same thing `RailCrew`, `OverlapNote` and `TeammateCursors` already do by sharing
`["presence","anchors",workspaceId]`.

**Not blocking.** Recorded so it is measured rather than remembered.
