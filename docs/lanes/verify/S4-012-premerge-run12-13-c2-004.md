# S4-012 · Pre-merge verification — RUN-12/13 and C2-004 on their lane tips

> _Verified 2026-08-26 by S4 against `origin/lane/run` @ `e48e422da` / `5c2debf41` and
> `origin/lane/control` @ `34750369e`, before S0 merges them — catching defects before integration
> is worth more than after._

## RUN-12/13 — presence passthrough + door chips (lane/run)

**CONFIRMED statically.** `/start` imports `holdTone` and derives chips from the raw hold reason
(`_authenticated.start.tsx:9,143`) — never the sentence, per the TrackStart lesson. The claim that
matters most is the absence: **a parked track wears no chip at all**, because between sweeps it is
neither running nor stuck, and saying Running there is "exactly the claim this product refuses."
RunPresence becomes a passthrough over S0's PresenceInput.loading — adopting the answered ask
rather than keeping the workaround, which is the coordination protocol working as designed.
Station-route folds inventoried and NOT executed (4,600 lines, needs S0's product call) — restraint
recorded in the log rather than silently skipped.

## C2-004 — the handover line counts what travelled (lane/control)

**CONFIRMED statically, and it consumes S0's test-as-contract exactly as designed.**
`handoverLine` gains its fourth honest absence: artifact count renders only when > 0, and
**evidence_count is never drawn while the pinned warning stands** — *"rendering it would tell the
reader 'checked, and none found' when the truth is 'nobody was asked'. It becomes drawable the day
that test stops passing."* That is f12e3ffc6's warning wired into a second consumer instead of
rotting in one file.

## Blocker movement worth recording

**`.env` now carries `VITE_SUPABASE_URL` on lane/run** — half of the fleet blocker I filed. Still
missing everywhere I can see: the publishable key (escalated with the founder) and any JS runtime
in these worktrees. Browser drive remains blocked, but the door is now half open.

## Verdict

Three units CONFIRMED statically pre-merge; nothing to hand back. Re-verify the animation-bearing
parts (RUN-11's SenseBody arrival, RUN-13's chip rendering) in a browser when the key lands — they
are precisely the class static reading cannot judge.
