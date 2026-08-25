# PRODUCT TRUTH — one page

> _Written 2026-08-25 by MAIN (Fable), under the founder's grant of architecture authority.
> The evidence behind every claim is [`AUDIT.md`](./AUDIT.md) and
> [`../the-first-run/START-HERE.md`](../the-first-run/START-HERE.md)._

## Who it is for

**The person accountable for work they no longer produce by hand.** A founder or product lead who
already uses AI to build faster than they can supervise. The market priced the neighbouring jobs:
producing code (~$4B Cursor), writing PRDs ($15/mo ChatPRD), running a lifecycle board (free,
bundled). The unpriced pain is theirs: **accepting** the output — code review time +441% while
throughput rose 34%, agent PRs sit 5.3x longer before pickup.

## The one painful job

*"Carry this sentence to a finished, checked change — without me becoming the pipeline."*
Today they are the message bus: they ferry context between chat, agent, tracker, CI and docs, and
every handoff is a place work silently dies. Nothing records what they believed would happen at the
moment they decided, so when the outcome lands there is nothing to grade it against.

## What Supaprod does instead

One sentence in. A crew walks it: evidence → decision **with a forecast** → spec → design → build
(a real PR) → a checked merge → a graded outcome. **Watchable the whole way** — the person sees who
is working, on what, right now, and is asked at most one question, in place, when the work needs
them. Proven this morning: a track walked `sense → decide → define` unaided on real evidence.

## Why it is 10x and not 10%

1. **You watch it work.** Agency you can see is the whole difference between "a tool I operate"
   and "a system that runs" — it removes the learning curve and it is the reason to believe.
   Nobody trusts an invisible employee.
2. **The check runs before you ever look.** The gap between what the change was supposed to do and
   what it did, judged by something that did not write it. Pays on the first run, not after a year.
3. **The forecast at decision time.** Recorded before the outcome is known, graded after. No
   competitor captures it, and it cannot be reconstructed later. (167 claims captured; the first
   honest grading is queued — never claim this in the present tense until it lands.)

## Architecture rulings (authority exercised, reversible)

- **The seven stations stay — as pipes, never as the face.** They walked unaided this morning; the
  route model is right. But no user-facing surface shows a station name or a seven-step diagram
  (upholds R-01, R-13). The product's face is three things:
  **the Composer** (one sentence), **the Workbench** (live transcript + the thing being made +
  consent in place), **the Character** (below).
- **The crew becomes ONE character.** Fifteen seat slugs are an org chart, not an experience. The
  user meets a single named worker who fronts the whole crew — it thinks, searches, decides, asks,
  and hands over; the seats are its hands. This is the founder's 2026-08-25 direction and the core
  of Phase 3: presence, not dashboards. Spec: [`../the-first-run/SPEC-PRESENCE.md`](../the-first-run/SPEC-PRESENCE.md).
- **"Company Brain" is a mechanism, not a room.** Learning surfaces only where it changes a call —
  quoted inside the run at the moment it is used ("last time you believed X; Y happened"). The
  trophy-case surface is cut.
- **Missions fold into tracks** (R-24 already ruled it). The app-wide composer creates a track,
  full stop. Item 16 is the P0 that makes it true.
- **84 routes collapse toward five doors**: `/start`, `/track/:id`, tracks list, engine room,
  settings. Deletion still happens only after a run finishes end to end (R-15).

## What we delete or refuse

- Status panels that only tell (the START-HERE test: *can the person DO something here?*).
- Seed theatre: the hand-placed `learn` row; 91 seed-graded forecasts polluting real workspaces;
  sample workspaces on investor accounts where the loop cannot run.
- The station widget, the mission/track front-door split, "operating system" framing.
- Any surface claiming accumulated learning in the present tense (R-06).

## The bar for every decision

*Would a real user feel this within 60 seconds, love it, and come back tomorrow?* If not, cut it.
The acceptance stands unchanged: one sentence enters, seven stations complete, no human touch
mid-run, watchable on one screen — and it has still never happened once. Everything above serves
exactly that.
