# Session handoff

> _Last updated: 2026-08-27, S0 CONDUCTOR_

## The finding that matters most: F-124

**The critical path is one action, and the "missing mechanism" is not missing.**

F-36 has stood for weeks as *"`release.publish` requires a `deployments` row the
loop cannot produce"*, and [`SESSION-0-CONDUCTOR.md`](../../the-first-run/SESSION-0-CONDUCTOR.md)
§1b calls the preview deploy **"the missing mechanism"** and ranks building it
second of five. Measured against the live database, every link in that chain
exists and every one has worked before:

| Link | Evidence it has run |
| --- | --- |
| `ci-poll-tick` | active on `*/2 * * * *` |
| Deno preview deploy | **13 rows**, written by `ci-poll-tick` |
| `studio.pr.merge` | **14 approvals EXECUTED** |
| Production promotion | **1 row**, by `promote` |

**Nothing on that list needs building.** What stopped is the merge, and two dates
say it exactly: the last executed merge was **2026-07-10 17:14** and the last
Deno preview was **2026-07-10 21:22**. Since then, of every merge approval filed:
**21 expired undecided, 8 rejected** (most recently 2026-08-25 18:11, which is
F-79's row), **7 still pending, 0 executed.** All six real changesets sit at
`pr_open` with zero deployment rows, including two opened on 2026-08-27.

So the loop files a merge approval and waits for a person. **That is precisely
what F-75 fixed** — `studio.pr.merge` was pinned to `review` regardless of
`STUDIO_AUTO_SHIP`, so every merge queued. With F-75 deployed and the arc at
`trusted` (all 93 rows, and `loadAgentArc` defaults the other 190 agents to
trusted), it executes inline.

**The whole critical path is therefore: deploy `main`.** Production serves from
`main`; all four lanes sit 9 to 16 commits ahead of it; F-75 and everything from
F-114 to F-126 is inert until then. After the deploy the chain is merge → preview
within two minutes → `release.publish` → Ship → Learn, and every one of those
steps has a row proving it has run before.

**This session did not merge to `main`.** It is production, it is outward-facing,
and doing it while three other lanes hold unmerged work would be out of step with
how they are running. It is the founder's call, and F-124 exists to make it a
single one.

### The one unknown that could still stall it

Whether `Supaprod/relay-homeowner-app` carries a **`supaprod.json`** marker at its
root. `ci-poll-tick` deploys a preview only for a repo that has one. That repo is
private to the App installation and invisible to this session's GitHub identity,
so it could not be checked from here, and — until F-125 — the tick had never
recorded what it found. If the marker is absent, that is one file at the repo
root, not a code change. Worth confirming beside the deploy rather than
discovering after it.

---

## The structural finding: F-116

**R-18's acceptance was impossible by construction, and three columns say so.**

The path from Define to Ship passes three states, and a person is the only writer
of every one:

| Gate | Live state | Who can write it |
| --- | --- | --- |
| `prds.status` | 61 draft, 1 review, 43 approved | The human tray at `approvals-queue.functions.ts:1403`. **No `prd.approve` tool exists.** |
| `prds.design_gate_status` | **116 of 119 `pending`** | `decideDesignGate`, behind `requireSupabaseAuth`, stamping `design_decided_by: userId` |
| the success metric | **117 of 119 specs carry none** | nothing was writing one (F-117) |

`design_stage_enabled` is true on all 21 workspaces, so `pending` really does mean
nobody answered.

**The cause was not a missing permission.** `design-critic` is already in Design's
crew doing exactly this judgement, and its filing line said *"say plainly if it is
sound as it stands"* — **so a pass left no trace.** Only a change wrote anything,
and `pending` therefore meant both "nobody looked" and "the critic looked and it
was fine". The station was doing the work and had nowhere to put it.

[`src/lib/spec-gate.ts`](../../src/lib/spec-gate.ts) is the place the verdict
lands. It is modelled on `decision-gate.ts` and deliberately **stricter**, because
that module's argument for auto-approving is that a `decisions` row is a RECEIPT —
and **a spec is a LEVER**. A human's `rejected` is read first and can never be
overturned; nine gates each name a different next action; confidence is tested
positively so null, NaN and out-of-range all ask. No seat calls it: an agent can
only ask for its spec to be **argued against**, and a clearance is a consequence
of surviving that.

---

## The recurring shape, found six times in one session

**A failed read and an empty result were the same value**, and every instance
produced a surface stating a confident falsehood rather than an error.

- the forecast desk reported no overdue calls and then **vanished from the page**,
  because its panel returns null when all three reads come back empty (F-120)
- Guardrails said "Nothing checks your AI calls yet" over a table it could not
  read (F-118)
- the autonomy dial returned `trusted` on a failed read, granting more
  independence than the operator had set (F-119)
- `getTrack` **did not destructure `error` at all**, so an unreadable track
  rendered as "this piece of work does not exist" on the run screen (F-126)

[`src/lib/read-failure.ts`](../../src/lib/read-failure.ts) now holds the one rule
that tells them apart, and it holds the counter-argument too: four tests defended
the old soft-fail with a better reason than the first fix that replaced it —
*"Migrations and deploys are two switches with no enforced order, and PostgREST
answers an unknown column with an error rather than a null."* Both are right, and
they are about different errors. `42703`/`PGRST204` is a deployment-ordering fact
and falls soft; anything else is a runtime fact and raises.

---

## What is still open, and whose it is

| Item | Owner |
| --- | --- |
| Deploy `main`, which is the whole critical path (F-124) | **Founder** |
| Confirm `supaprod.json` exists at the repo root | **Founder** |
| `AppFrame`'s live-work strip has no `isError` branch, so it will still show nothing when the read fails | **S2** (told) |
| Adopt `src/lib/track-origin.ts` and delete the local copy | **S1** (told, ready) |

**Do not press `a30238f5`.** It sits at `ship` on `given-up`, is already
disqualified by seven presses from before the Discover fixes, and is the proving
ground for whether the Ship fixes work. A press costs the only evidence it can
still give.

Full detail on every finding: [`the-first-run/FINDINGS-LEDGER.md`](../../the-first-run/FINDINGS-LEDGER.md),
F-114 through F-126.
