# Planning

> _Created: 2026-08-04 · Last updated: 2026-08-04_

**Twelve live documents. Three are the ones you read; nine are build bibles you open only when working on that initiative.**

This folder held 51 loose files as recently as 2026-08-03. Most were session write-ups nobody linked to, and finished plans that still read as current. They are in [`archive/`](./archive/README.md) with a note on each saying why it went.

---

## The three you actually read

| File | What it is |
| --- | --- |
| **[`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md)** | **§0 is the only live cursor in the repo.** What is in flight, what is next, what needs the founder. If a second file ever claims to hold status, that file is wrong. |
| **[`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md)** | **The live board: 31 open rows, and nothing else.** Flip a row when its state changes, and move it to the shipped register when it goes green. That row flip is the one documentation trace required during BUILD-ONLY MODE. |
| **[`known-issues.md`](./known-issues.md)** | Open bugs and blockers. |

Plus [`cross-cutting-gaps.md`](./cross-cutting-gaps.md) for non-functional gaps that belong to no single feature. It was called `considerations.md`, which told a reader nothing.

## Build bibles, one per open initiative

Open one only when you are building that thing. Each carries per-ID specs: context, files, migration, steps, acceptance, how to verify.

**Start at [`initiatives/README.md`](./initiatives/README.md) — it answers "is my question already answered?" before you open anything here, and lists what each bible settles.**

| Initiative | Bible |
| --- | --- |
| Workspaces, accounts, tenancy, monetization | [`workspace-tenancy-and-monetization-plan.md`](./initiatives/workspace-tenancy-and-monetization-plan.md) |
| BYO repo and the all-in-one platform | [`byo-build-implementation-plan.md`](./initiatives/byo-build-implementation-plan.md) |
| The managed end-to-end runtime | [`byo-p5-managed-runtime-plan.md`](./initiatives/byo-p5-managed-runtime-plan.md) (founder-gated) |
| Analytics and failure detection | [`analytics-and-failure-detection-plan.md`](./initiatives/analytics-and-failure-detection-plan.md) (founder-gated; read before adding any vendor SDK) |
| Admin console v2 | [`admin-console-v2-plan.md`](./initiatives/admin-console-v2-plan.md) |
| Decision Brain, increment 1 | [`ambient-precedent-plan.md`](./initiatives/ambient-precedent-plan.md) |
| Decision Brain, the supersession engine | [`supersession-engine-plan.md`](./initiatives/supersession-engine-plan.md) |
| Builder reliability and the codegen direction | [`builder-reliability-and-codegen-direction.md`](./initiatives/builder-reliability-and-codegen-direction.md) (a proposal; the founder owns the decision) |
| Forecast resolution, the grading half of FC-01 | [`forecast-resolution-plan.md`](./initiatives/forecast-resolution-plan.md) |
| What is broken, half-wired, or dark across the whole app | [`functionality-audit-2026-08.md`](./initiatives/functionality-audit-2026-08.md) (2026-08-14; every number carries its query) |
| **What ~60 agents found on 2026-08-19, as a durable register** | [`agent-audit-2026-08.md`](./initiatives/audit-reports/agent-audit-2026-08.md) (every finding verified against code or production, grouped by the agent that found it, with what is still open and has no queue item) |
| **The agent-first redesign of the whole platform** | [`agent-first-platform.md`](./initiatives/agent-first-platform.md) (2026-08-19; first principles, not a reskin. Why the approval queue is the worst-scaling failure, why the forecast half of the moat is a scoreboard, and what to build in what order) |

## The current rebuild

[`rebuild-2026-07/`](./rebuild-2026-07/) is live, not archived. It holds the two documents that outrank most things written before them:

- **[`rebuild-2026-07/GOVERNANCE-PRINCIPLE.md`](./rebuild-2026-07/GOVERNANCE-PRINCIPLE.md)** — policy is set in advance and does not block; permission is asked in the moment and does. Canonical.
- **[`rebuild-2026-07/FOUNDER-VERDICT-2026-07-29.md`](./rebuild-2026-07/FOUNDER-VERDICT-2026-07-29.md)** — the rejection of all four design directions, with the reasoning that replaced them.

---

## Launch, and the gaps still open against it

| File | What it holds |
| --- | --- |
| [`LAUNCH-EXECUTION-TRACKER.md`](./LAUNCH-EXECUTION-TRACKER.md) | **The single execution tracker for launch week.** Every workstream with an owner, a status, a deadline, its evidence, its next action and its risk. Two rival trackers were folded into it on 2026-08-07 and moved to `archive/`; if you are about to start a third, read its header first. |
| [`launch-audit/GAP-CLOSURE-REGISTER.md`](./launch-audit/GAP-CLOSURE-REGISTER.md) | The register of gaps found by the pre-launch audits and whether each is closed. Read it beside [`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md) section 0, which owns status; this owns the audit's own list. |
| [`launch-audit/station-chain-audit.md`](./launch-audit/station-chain-audit.md) | The seven stations measured against production lineage, demo data excluded. Answers where work actually flows and where it stops: Discover leaks 83 of 86 themes, Build→Ship writes no real edges, and Learn→Discover is the healthiest link in the product. |
| [`launch-audit/cold-start-and-agent-path.md`](./launch-audit/cold-start-and-agent-path.md) | Whether a person, and an agent, can get in at all. First run is five phases against a 60-second bar and promises ten minutes. The agent surface reads 11 things and writes one, and has never been called: zero tokens, zero API calls, write gate off. |
| [`3-gaps-implementation-plan.md`](./3-gaps-implementation-plan.md) | The plan for three named gaps carried into launch week. Subject to the rule below: it moves to `archive/` the moment its work is done. |

## The rule that keeps this folder small

**A plan stops being a plan the moment its work is done.** When an initiative closes, or its campaign is archived, or its status line reads SHIPPED, the bible moves to [`archive/`](./archive/README.md) with a line saying which of those happened. It does not sit at the top level looking live.

The failure this prevents: on 2026-08-03 this folder still offered a plan whose own header said `Status: SHIPPED 2026-07-15`, two spec sets for a campaign that had been archived, and lane briefs for git worktrees that no longer existed. An agent reading top-to-top could not tell those from the eight that are genuinely open.
