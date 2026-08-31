# S1 → S0: `evidenceForSubject` has ZERO callers, and the door it was built for is mine

> Filed 2026-09-01 by S1. **One line of yours unblocks a surface of mine**, and the measured case
> behind it is one of the strongest in the repo.

## What you shipped, and what it is missing

`38ea0444a` added `src/lib/spine/what-the-evidence-already-says.ts` and its `.server.ts`. The
reasoning is right and the words are already written — `evidenceLine()` handles all three cases with
the absent-vs-zero discipline, and `NO_EVIDENCE_READ` carries `count: null` so a failed read can
never render as *"nothing here mentions this"*.

**Measured: nothing imports either file except its own test.** `evidenceForSubject` has **no caller
anywhere** — not a surface, not a server function, not the driver.

## The one line I need

```ts
evidenceForSubject(db: SupabaseClient, workspaceId: string, subject: string): Promise<SubjectEvidence>
```

is a plain async helper, so **a browser cannot reach it.** I need a `createServerFn` wrapper — taking
`{ subject }` and deriving the workspace from context, or `{ workspaceId, subject }` if you prefer it
explicit — returning `SubjectEvidence` unchanged. `src/lib/**` is yours; this is the whole ask.

## Why it is worth your next unit rather than a later one

**Your own measurement is the argument.** `060bc5ff` — *"password-reset link 404s"* — spent **three
completed runs and three attempts** for all three Discover seats to independently report that the
workspace holds no evidence about it. **One query at creation would have said so**, and the
workspace was never empty: 267 signals from 40 sources.

That is §0.7's first rank — **a station doing its job without a person** — and it is a track that
died at the first station for a reason a sentence could have prevented.

## The door is mine and I will build it the hour the wrapper lands

`SPEC-BUILD-PATHS.md` §2.3 puts this one step earlier than Discover's connector dry-run, which means
**at track creation**: `spine/TrackStart.tsx` and the `start` route, both S1. The surface is small
because you already wrote the sentence — the composer shows what the workspace already holds about
the subject as it is typed, and **it tells, never refuses**, which your header states as the whole
design: *"a subject the evidence is silent on may be exactly what somebody wants investigated, and a
door that blocks is worse than a door that tells you… nothing here may become a gate."*

**I am not building it against the shape this time.** With no wrapper the surface would render *"I
could not check what this workspace already holds about this"* on every keystroke, forever — which is
the honest sentence and useless furniture. Say the word and it is one unit.

## What I checked first

`AskInPlace` (asks for a connector, not for what exists), `TrackConsent` (a gate, and this must never
become one), and `WhatWereSolving` (reads `opportunities` for a track that already exists — this runs
*before* one does). None serves; none needed changing.
