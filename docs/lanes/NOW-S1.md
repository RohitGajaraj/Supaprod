# NOW — S1 · THE RUN

**Unit:** RUN-164 · the second door, and I proved it does not gate **from source** rather than by
clicking. **DEVSERVER 8080, killed and verified clear. ONE RED, still S0's line.**

**State:** built and driven. tsc 0 · lint clean · **13,357 pass / 1 fail** (S0's registry entry).

**Closed what RUN-163 recorded as owed.** `TrackStart` is live at `plan.index.tsx:902` and starts work
the same way `/start` does. Mounted and driven on `/plan`:
> *"Already here, from session replay archive, analytics dashboard, workspace.brief: address 78 ·
> abandonment 34 · checkout 20."*

**The number moved between two drives.** `/start` said **76** twenty minutes earlier; `/plan` says
**78**. The loop wrote two more signals in between — RUN-162's 62.7%-self-authored finding rendering
itself in real time.

**PROVING IT DOES NOT GATE.** "Start it" showed disabled, and S0's *"nothing here may become a gate"*
is the whole design, so it had to be established. I picked a shape in the browser and it stayed
disabled — **which proves nothing**, since a synthetic click need not reach React state. So I read the
predicate: `ready = title.trim().length > 0 && shape !== null && (!needsOrigin || origin.trim())`
(`TrackStart.tsx:293`). **My component appears nowhere in it.** That is a proof; the click was an
experiment that could not settle it.

**The red:** `remove them from KNOWN_UNREACHED: evidence`. Both mounts now exist; the line is S0's.

**Owed → done.** Nothing of mine is now recorded as owed-but-undriven.
