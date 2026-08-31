# QUEUE — S1 · THE RUN (`lane/run`)

> _Rewritten by S0 2026-08-31. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Take the top one that is not BLOCKED. Your brief is
> [`SESSION-1-THE-RUN.md`](../../the-first-run/SESSION-1-THE-RUN.md); the ranking is
> [`RANKED-BACKLOG.md`](../../the-first-run/RANKED-BACKLOG.md)._
>
> **Nothing frozen is in this queue** (§0.7). **Before starting either: grep for it first** — one
> coordination answer in six says the thing already existed (F-162).

---

## S1-Q1 · Open questions, answered in place — gap #29

**Goal.** The Discover artifact draws its `Open questions` section **always**, including when the
station filed none, and a person answers one **in the transcript** without leaving the run.

**What problem of mine does this kill?** I am handed work that reads confident and is not. The thing
nobody resolved surfaces three stations later as rework.
**What do I stop doing?** Reading a spec, sensing something is missing, and having nowhere to say so
except by rejecting the whole thing.

**Files.** `src/components/track/**` (yours). The reader is mine and queued — until it lands, build
against the shape, not against a client-side read of `payload` (you already ruled that out yourself
and you were right).

**The measurement that decides the design, and it is the whole point.** Of **161 `agent_messages`,
2 carry a non-empty `open_questions`** and 13 carry `constraints`.
`SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.1: *"An empty list is a DEFECT, not a clean bill. Discover
filing zero open questions means it did not look."* **So a section that hides when empty hides the
finding.** Draw it always; say the station filed none.

**Acceptance.** The section renders on a track with zero open questions and says so in plain words ·
answering one records the answer against the track and the transcript shows who answered · *proceed
anyway* is recordable **as an answer**, never as a dismissal (§4.3) · nothing on screen says
`intent.md`, `open_questions` or `payload`.

**Checked first, and say so in your unit file.** `TrackConsent` (shipped, in-place ask) and
`AskInPlace.tsx` (**zero call sites** — S3 filed that; it may be your mount). **Do not build a
second ask mechanism.**

## S1-Q2 · The value-audit surface — gap #17 / #7

**Goal.** *"Was it worth it"* has a surface, built from timestamps already stored.

**What problem of mine does this kill?** I authorise work and never learn what it cost against what
it promised.
**What do I stop doing?** Guessing whether the machine is earning its spend.

**Files.** `src/components/track/**` and the run's right pane. **Numbers are mine** — file the ask
and keep building the surface against a stub.

**The content is already written**: `SPEC-AI-NATIVE-SDLC.md` §3 D maps every one of Anthropic's
leading indicators onto rows we already hold. **Every row is a query, not a feature.**

**Acceptance.** Every number names its source when asked (§4.5) · no number appears that no writer
sets · a track with nothing to report says so rather than rendering zeros · **`studio.checks.run`
is NOT used as first-pass CI success rate** — it has run **once in the product's life** (F-148).

**BLOCKED-ISH, AND READ THIS BEFORE YOU START.** Another session pushed `d9acc36e3` *"S1 UNIT 7
PLANNING: value audit surface (gap #17)"* to `lane/run` and **filed a request to S0 for these very
queries** (F-161). **Do not start Q2 until the founder rules who is S1.** Take Q1, which nothing
else has touched.
