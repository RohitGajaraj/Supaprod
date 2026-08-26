# S4-051 · The dead backend test, and the rule for a negative claim

> _S4, 2026-08-27. Two verification rules formalised as procedures rather than principles, because a
> rule nobody can run is a slogan. Both came out of tonight's exchanges; neither is mine alone._

---

## RULE 1 · The dead backend test

**The question is not "is it animated". It is "does the motion correspond to a real state change".**
A timer-driven progress bar and a run-driven progress bar are the same picture and a different
product, and no screenshot can separate them.

**The procedure, and it costs one server lifecycle:**

1. `lsof -ti:8080` first. Declare `DEVSERVER` in your `NOW` line.
2. Write a `.env` whose database URL points at a port where **nothing is listening**
   (`http://localhost:54321` works; nothing runs there).
3. Start the dev server and open the surface.
4. **Watch the thing that moves.**
5. Kill the server, remove the dummy `.env`, confirm the port is clear.

**The verdict writes itself:**

| the motion | means |
| --- | --- |
| **stops, or never starts** | it is driven by data. Honest. |
| **keeps going** | it is driven by a clock. There is no row behind it. |

**This is not theoretical.** It is exactly how `S4-039` caught the landing hero: seven station bars,
all grey at ten seconds, first green and second blue at sixty, against a Supabase URL with nothing
listening. No track existed, no run existed, no network call could succeed, and the stations
completed anyway.

**Why it beats reading the source.** Reading found the same defect in `S4-028` and took a code review
to be convinced of. The dead backend test takes one lifecycle, needs no credentials, produces a
screenshot, and cannot be argued with. It also catches the case source review misses entirely: motion
driven by data that is *real but irrelevant*, which still stops when the backend dies and therefore
passes honestly.

**When it matters most, which is now.** The direction is that the visual aspects of the agentic
workflow should be SEEN, with stickiness and interactivity. That is the right instinct and it makes
theatre cheap to build with good intentions. **Every new animated surface should meet this test
before it ships**, and it is cheap enough that the lane building it can run it without S4.

**The limit, stated:** it proves motion is data-driven. It does not prove the data is *correct*, or
that the state shown is the one the user needs. Those are separate questions.

---

## RULE 2 · A negative claim carries its scope

**"X does not exist" is not a finding until it says where you looked.**

S3 offered the pattern against themselves tonight, three instances in one session: reporting no audio
MCP is callable after searching one session; reporting "autonomous" is not banned after reading one
canon file; reporting zero at-risk vouchers from a query that could not distinguish an empty table
from a hidden one.

**It is not theirs alone, and that is the point.** The same shape produced three other errors tonight:

- **Mine.** I wrote "autonomous is on the canon's banned list" without naming which file. Two files
  disagree (`S4-046`).
- **Mine again.** I reported "45 of 60 open tracks cannot move" without asking whose workspace they
  were on. 51 of 60 were demo fixtures (`S4-041`, corrected).
- **S2's.** Reported the acceptance as met from a `CLAUDE.md` snapshot injected at session start,
  while the file on disk said the opposite.

**The rule: every negative states its scope, and every count states its population.**

- Not *"no audio MCP is callable"* but *"no audio MCP in MY session's tool list"*.
- Not *"autonomous is banned"* but *"banned at `OPERATING-MODEL:32`; permitted at
  `positioning-locked:269`"*.
- Not *"45 of 60 cannot move"* but *"45 of 60, before filtering `is_sample`"*.

**And the reviewer's half:** when a peer states a negative, ask which surface they checked. That one
question would have caught five of the six errors above.

---

## Why these two belong in one document

They are the same failure at different layers. **The dead backend test asks whether a thing on screen
is backed by anything. The scope rule asks whether a claim about the world is backed by anything.**
Both are the difference between a statement that is true and a statement that has been checked, and
this session exists for exactly that distinction.
