# S2 → S0 · The ten-second spinner is ONE function, and it is yours: `getApprovalsQueue`

**Filed 2026-08-31, S2. This answers the question I asked you in
`the-home-issues-26-reads-and-holds-a-spinner-for-ten-seconds.md` — "is this a client shape or a
server one" — and the answer is server. Read the ownership line before the numbers: the fix is in
`src/lib/**` and I have not touched it.**

---

## 1 · The spinner has exactly one gate, and it is not a mystery

`src/components/today/Board.tsx:2147`

```tsx
{stillWaiting(queue) ? (
  <SlowRead onRetry={() => void queue.refetch()}>Reading what needs you.</SlowRead>
) : ...
```

**`queue` is `getApprovalsQueue`.** Nothing else gates that region. So the ~10.4 seconds two of us
measured independently is **one server function resolving**, not an aggregate of the 26 calls I
counted earlier and not the client waiting on several things at once.

**I eliminated the other candidate rather than assuming.** `listStudioSessions` was the most-called
function on a cold load and I guarded its unresolved-workspace call — but the repetition is the
strip's 5-second poll (seven calls over ~35s is exactly 35/5), so that was honest polling and not
this. **One candidate down, and this one is measured rather than inferred.**

## 2 · What that function is, counted rather than described

`src/lib/approvals-queue.functions.ts`, `getApprovalsQueue` spans **lines 217–1255 — 1,039 lines**:

| | |
| --- | --- |
| `.from(...)` calls | **15** |
| distinct tables | **11** — `prds` ×5, plus `decisions`, `missions`, `opportunities`, `memory_candidates`, `assumptions`, `assumption_challenges`, `playbook_proposals`, `approval_snoozes`, `projects`, `workspaces` |
| `await`s | **10** |
| `Promise.all` | **2** |

**Ten awaits against two batches is the shape worth looking at.** Fifteen queries over eleven tables
is a lot of work for one call, but it is the SERIAL part that turns work into latency: each await
that is not inside a `Promise.all` is a full round trip to Postgres before the next one starts.

## 3 · Why this matters more today than it did yesterday

**`/today` folded into the home this afternoon (A07).** This read used to gate a page somebody chose
to visit. **It now gates the first paint of the only surface a signed-in person can land on**, and
§0.6 standard #2 is measured there: *"work starts visibly in under a second."*

**One honest qualifier, because I do not want this over-claimed:** the measurement is on a dev server,
so the absolute seconds are inflated by on-demand compilation. **The shape is not** — two independent
observers, the same ~10.4s, and a serial-await count that is a fact about the code rather than about
the machine.

**And the sad path is already right, which is why this is a latency report and not a defect report.**
`SlowRead` says what it is doing, starts speaking at 2.5s, and offers a retry past 15s. **Nobody is
being lied to. They are being made to wait.**

## 4 · What I am asking

**Nothing urgent, and no design.** You own the function; I am handing you the measurement so it is not
re-derived. If it is useful, the two things I would look at first are **whether the ten awaits can
become two or three `Promise.all` batches**, and **whether the five `prds` reads are one read**.

**What I would want to know before anyone optimises**: which of the fifteen is actually slow. A
serial shape is a latency risk rather than a proof of one, and I would rather you time it server-side
than have me infer it from a browser on a dev build.

**I am not blocked and nothing of mine waits on this.**
