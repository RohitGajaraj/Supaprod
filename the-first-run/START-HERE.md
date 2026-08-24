# START HERE — every lane, every session, first file

> _If you read one thing, read this. It says what we are doing, why, and where the detail lives._

## This is not a feature sprint

**Supaprod is being transformed, not extended.** Three months of building produced a platform where
**59 tracks have existed, 58 entered the first station, and not one has ever reached the last.** The
founder has never seen a single journey run end to end. Four accelerators have declined.

**The defect is not missing features. It is unwired work.** Measured this week:

| Built | State |
| --- | --- |
| `TrackActivity` + `TrackChain` — built 2026-08-01 to a founder ruling asking for exactly "show visually which agent is working, the handoff, the outcome, like Claude Code" | **Zero importers for 24 days.** The founder re-requested the same thing on 08-25, unaware it existed |
| `resolveApprovalPolicy` — a whole approval-policy engine | **Zero callers.** Dead code |
| `run-rows.tsx` — 22.8KB of run vocabulary ported from beautifui.dev | **Zero importers**, while three surfaces each invented their own |
| `driveTrackOnce` — the thing that moves work | **One caller**, a cron. No person could move their own work |

**So the default move is always: wire what exists.** A unit that adds a component must name, in its
unit file, which existing one it checked first and why that did not serve. **A unit that cannot
answer that is rejected on review.**

## What we are actually building

**One composer and one workbench.** A person types one sentence. A run opens. On the left, what the
agent is doing now, as steps with state and a clock. On the right, **the thing being made, previewed
live, with an action available in place.** When the run needs a person it asks **inside the run**.
Everything else is Settings.

**The one test every screen must pass:** *can the person DO something here, or are they only being
told something?* A surface that only tells is a status panel and does not ship.

## Why this, and not something else

- **Producing work is finished and priced.** Cursor ~$4B ARR, Lovable $500M, Replit $525M.
- **Writing the PRD is a $15/month feature** with a measured ceiling — ChatPRD, 100,000 users, six
  figures.
- **Running a lifecycle is free** — OpenAI shipped Symphony on GitHub, Linear includes it at $16/seat.
- **Accepting work is where the pain moved and nobody is selling the cure**: code review time
  **+441.5%** while throughput rose 33.7%; agentic PRs **5.3x longer pickup**; DORA flat because
  output queued at review.

**So what Supaprod sells is the check between what a change was supposed to do and what it did, run
by something that did not write the change** — to the person now accountable for merging output they
did not write. **It pays on the first run, not after a year of data.**

## The two failures that cost three months, so nobody repeats them

**1. A question in a queue is a question nobody answers.** 90 approval requests were raised for one
internal tool since July: 42 cancelled, 38 expired, 10 pending, **zero ever approved**. They went to
`/approvals`, detached from the work they blocked. **Consent is asked in place, at the station that
raised it, or it does not get answered.**

**2. The system stops and cannot say so.** Every live track died at the attempt ceiling because
nothing in the agent prompt said what day it was, so a forecast horizon was refused as past and one
run burned 68,260 tokens guessing the year. Nothing anywhere surfaced that. **A run that stops must
say so where a person is looking.**

## Where everything lives

| File | What it settles |
| --- | --- |
| **[`RULINGS.md`](./RULINGS.md)** | **THE TIEBREAKER.** R-01…R-12. If two documents disagree, this wins. It also lists what is still OPEN — an open question is a request you file, never a call you make |
| [`BUILD-QUEUE.md`](./BUILD-QUEUE.md) | The single ordered backlog. Take the topmost item **you own by path** that is not blocked |
| [`DESIGN-DIRECTION.md`](./DESIGN-DIRECTION.md) | The workbench ruling, and what to take from each reference |
| [`../design-reference/mobbin-2026-08/`](../design-reference/mobbin-2026-08/) | **Nine reference images, committed** — lanes have no Mobbin access. Open the `.webp` files |
| [`SPEC-ARTIFACTS.md`](./SPEC-ARTIFACTS.md) · [`SPEC-LAYOUT.md`](./SPEC-LAYOUT.md) · [`SPEC-CONSENT.md`](./SPEC-CONSENT.md) · [`SPEC-ONRAMP.md`](./SPEC-ONRAMP.md) | Build specs with `file:line` on every claim. **Read the one for your item before starting it** |
| [`MERIDIAN-ADOPTION.md`](./MERIDIAN-ADOPTION.md) | 121 components, 95 adopted, 17 built with no door. Grep here before building |
| **[`FINDINGS-LEDGER.md`](./FINDINGS-LEDGER.md)** | **What was found, what was FIXED, what is still OPEN, and what was investigated and proved FALSE. Read it before re-investigating anything — if a symptom says FIXED, check the commit and move on** |
| [`GAP-AUDIT.md`](./GAP-AUDIT.md) | The full platform sweep: 40 findings across first-run, tenancy, failure states, settings and accessibility, each with `file:line` |
| [`FRONTIER-BRIEF.md`](./FRONTIER-BRIEF.md) | How the frontier labs actually ship, the user-lens validation, and the strategic angle |
| [`EVIDENCE.md`](./EVIDENCE.md) · [`ROOT-CAUSE.md`](./ROOT-CAUSE.md) · [`REIMAGINING.md`](./REIMAGINING.md) | The measurements and the strategy read, so nobody re-derives them |

## How the three lanes fit together

| | Runs on | Builds | Has | Lacks |
| --- | --- | --- | --- | --- |
| **MAIN** | Claude Code | Directs, rules, verifies, owns database + migrations + deploys, fixes minor lane defects | DB, Mobbin, deploy, the founder | — |
| **LANE 0** | OX Alpha | `src/components/**` except `meridian/`, `shell/` | Playwright, skills, repo | DB, Mobbin, deploy, founder |
| **LANE 1** | OX Alpha | `src/routes/**` except `api/`; `src/components/shell/**`; `src/styles/**` except `meridian.css` | Playwright, skills, repo | DB, Mobbin, deploy, founder |

**Never write outside your prefix.** Two writers on one path is what broke `main` on 2026-08-22.
Anything needing the database, a deploy, or a founder call is a `coordination/requests/` file — MAIN
answers in minutes. **Never work around a blocker by reaching into another lane's path.**

**You do not sign off your own work.** Finishing an item means filing
`coordination/requests/verify-<item>.md` naming the route, the thing to look for, and **what would
prove it false**. The other lane verifies with Playwright and reports separately.

## Done, for the whole mission

**A person types one sentence and, without navigating anywhere, watches the work carried from the
first station to the last — answering at most one question on the way — and is told whether it did
what it was supposed to do.**

Not one of those clauses is true today. That is the job.
