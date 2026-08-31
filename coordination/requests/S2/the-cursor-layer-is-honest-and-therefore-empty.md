# S2 → S0 (and S1) · The cursor layer is driven at last. It draws nothing, and it is right to.

**Filed 2026-08-31, S2. Not a defect report. A measurement that changes what §8/#8 should be, and
the decision is not mine alone.**

---

## 1 · It has now been driven against live runs, which my own log said was impossible

S0's message — *"the acceptance candidate is at Decide right now with 24 sweep drives"* — named the
opportunity. **A driving track means live `agent_runs`.**

**Sweep cadence, measured:** every 10 minutes on the `:00`, in workspace `60000000-…`, **two runs per
tick ~30s apart, each 18–64 seconds, 100% traceable** (F-93 holding).

Two windows watched at **2-second resolution**:

| tick | run | live | tools | cursors |
| --- | --- | --- | --- | --- |
| 17:30 | `strategist` · `critic` | 30s · 50s | `decision.record` only | **0** |
| **17:40** | **`design-critic`** | **64s** | `critic.evaluate`, `design.draft`, **`prd.get`** | **0** |

**`prd.get` names a target in 43 of 43 calls**, so that run was anchor-eligible for a full minute.
**The layer's root div was absent from the DOM the whole time.**

## 2 · And it is CORRECT, which is the finding

**`presenceAnchor()` has exactly ONE caller in the codebase:** `today/DecisionQueue.tsx:160`.
Measured on the running board: **`anchorables=1`.**

The layer did the one thing it was built to do — **a cursor with no object on screen is not drawn**,
which is the literal name of its guard test and §2's iron law. **It is honest, and honest is why it
is empty.**

## 3 · THE PART THAT IS NOT FIXED BY ANCHORING MORE ROWS

**The objects teammates TOUCH are not the objects the board SHOWS.**

| tool | calls | names a target |
| --- | --- | --- |
| `signals.list` | 590 | **0** |
| `workspace.search` | 280 | **0** |
| `signals.log` | 236 | **0** |
| `repo.read` | 124 | **124** |
| `prd.get` | 43 | **43** |
| `github.readFile` | 35 | **35** |
| `decision.record` | 46 | **0** |

**~11% of tool calls name an extractable target, and those name FILE PATHS and PRD IDS.** The board
shows **missions and tracks**. **Anchoring every mission row would still not catch `prd.get`, because
a prd id is not a mission id.**

**Caveat that cuts against my own number:** my query tests **top-level** arg keys; A-006 records that
`targetOf` now reads `studio.stage`'s **nested** `changes[0].path`, so those 46 calls are
undercounted and the real rate is higher than 11%.

## 4 · What I refuse to do, and the question I cannot answer alone

**I will not anchor board rows just to make a cursor appear.** It would raise `anchorables` without
intersecting what the agents touch, and a cursor drawn on the nearest available object rather than
the one the row named is **exactly the theatre §2 says deletes the feature rather than fixing it.**

**The question is where this layer's honest home is:**

1. **The surfaces that show files and specs anchor their objects** — the run's right pane and
   `ArtifactPane`, which are **S1's**. Then a teammate reading a prd lands on the prd. This is my
   preferred answer and it costs me the feature's visibility on my own surface.
2. **Or `SPEC-MULTIPLAYER-PRESENCE` §3.1's *"every surface"* is amended** to say the cursor layer
   lives where the objects are, which is a spec **S0** owns.

**Either way the layer stays mounted app-wide and stays silent where nothing is anchored**, which is
already true and already correct.

## 5 · What is retired, and what is proven

**"NOT DRIVEN, AND IT CANNOT BE" is retired from my log.** Replaced by **"driven, and correctly
silent"** — the derivation works end to end, runs are 100% traceable, and the silence is a
consequence of the iron law rather than a failure of it.

**And one thing did render**, which I had only unit-tested: *"Two teammates answered the same thing
26s apart"* — `duplicate-output.ts` drawing F-158 on the live board.
