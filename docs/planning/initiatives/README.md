# Initiatives — the groundwork already done

> _Created: 2026-08-22_

**Read this before proposing a redesign, an audit, or a platform-wide change.** Every question below is
already answered somewhere on this disk. Two sessions have paid to rediscover the same 986-line design
because nothing at any entry point pointed at it, and that is what this file exists to stop.

An initiative here is a **bible**: the durable thinking behind one area. It is not status — status lives in
[`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md), and there is only one board.

---

## Start here: is your question already answered?

| If you are about to ask… | It is answered in | Dated |
| --- | --- | --- |
| *How should the whole platform be reshaped around agents?* | [`agent-first-platform.md`](./agent-first-platform.md) — **the current platform direction** | 2026-08-19 |
| *What is actually broken, half-wired or dark right now?* | [`audit-reports/agent-audit-2026-08.md`](./audit-reports/agent-audit-2026-08.md) — the findings register, ~60 agents, every claim carrying a query or a `file:line` | 2026-08-19 |
| *What is the case AGAINST all of this?* | [`adversarial-review-2026-08.md`](./adversarial-review-2026-08.md) — a hostile read through six lenses (product, design, agent architecture, engineering, psychology, enterprise buyer), plus what each of the four big labs would delete. **Deliberately one-sided**, measured against production on 2026-08-22 | 2026-08-22 |
| *What does each screen do, and what is missing on it?* | [`functionality-audit-2026-08.md`](./functionality-audit-2026-08.md) | 2026-08-14 |
| *How does a forecast get graded once its horizon passes?* | [`forecast-resolution-plan.md`](./forecast-resolution-plan.md) — the grading half of FC-01 | 2026-08-12 |
| *What should a station's surface look and behave like?* | [`../../design/agent-first-surface-brief.md`](../../design/agent-first-surface-brief.md), plus the six per-station audits in [`../../design/`](../../design/README.md) — **the audits are unverified agent output; treat every claim as a lead, not a finding** | 2026-08-19 |
| *Should we copy an open-source agent harness into this product?* | [`deepseek-harness-read-2026-08.md`](./deepseek-harness-read-2026-08.md) — the DeepSeek Harness read in full. **Answer: no, and licensing is not why.** Also the four live defects of ours that the read found | 2026-08-22 |
| *What was built, verified or rejected in the last build push?* | [`../../operations/ledger/kiro-log.md`](../../operations/ledger/kiro-log.md) and [`claude-log.md`](../../operations/ledger/claude-log.md). The queue itself, [`../../operations/kiro-queue.md`](../../operations/kiro-queue.md), is **empty and closed** — K-01 through K-97 are all resolved | 2026-08-21 |

**The design contract is separate and it is not optional:**
[`../../design/DESIGN-SYSTEM.md`](../../design/DESIGN-SYSTEM.md). Meridian is the only design system. Take
the **rules** from that contract and the **inventory** from `src/components/meridian/` — the contract's
component and token counts go stale between passes.

---

## What `agent-first-platform.md` settles, so you do not re-derive it

It is long. This is what is in it, so you can jump rather than read:

| § | Settles |
| --- | --- |
| 1 | The evidence: production numbers behind every claim, and two corrections to canon found while measuring |
| 2 | The object model — Question → Bet → Run → Verdict — and why a work-shaped model commoditizes |
| 2.3 | **Context scope, founder-ruled:** evidence is product-scoped, method is workspace-scoped, default is product |
| 3 | The four surfaces, stations as lenses rather than doors, and the commitment moment |
| 4 | Navigation, the composer, multi-product, progressive disclosure |
| 5 | **Every surface traced** Purpose → Intent → Inputs → Agent → Backend → Writes → Handoff → Next → Learning |
| 6 | Roster, the approval policy engine, autonomy, memory tiers, checkpoints, failure recovery, observability |
| 7 | Meridian extensions, each argued against Meridian's own law |
| 8 | 27 catalogued capability gaps with class and cost |
| 9 | Seven implementation slices, ordered by leverage per unit of risk |
| 10 | 19 behavioural validation criteria, measured in production, plus the counter-metric |

**Three things in it are now out of date, verified 2026-08-22:**

1. **Slice 7 (navigation collapse) has shipped.** The rail is already Today · Runs · Brain · Guardrails.
2. **Most of §7's "missing" Meridian primitives now exist** — `RunTimeline`, `ToolStream`, `RunMap`,
   `PlanGate`, `PlanCard`, `AgentInbox` — but each is mounted **only** in the gallery at
   `_authenticated.meridian.tsx`. Built, and unreachable. `stopRun` has also shipped.
3. **§10's forecast criteria read as progress and are not.** All 146 decisions carrying a forecast and all 91
   resolutions sit in the two seeded demo tenants. Across all six real workspaces the count is **0 of 131**.
   Split every criterion by demo versus real workspace or the number means nothing.

---

## The rule that makes this file work

**Anything that takes more than an hour of research gets written down here and linked from
[`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md) in the same commit.** A document nobody is routed to is
work that will be paid for twice. `docs-doctor` fails a commit that adds an unlinked file, which catches the
mechanical half; the routing half is a judgement call and it is this file's job.

## The rest of the initiatives

| Initiative | Bible |
| --- | --- |
| Workspaces, accounts, tenancy, monetization | [`workspace-tenancy-and-monetization-plan.md`](./workspace-tenancy-and-monetization-plan.md) |
| BYO repo and the all-in-one platform | [`byo-build-implementation-plan.md`](./byo-build-implementation-plan.md) |
| The managed end-to-end runtime | [`byo-p5-managed-runtime-plan.md`](./byo-p5-managed-runtime-plan.md) (founder-gated) |
| Analytics and failure detection | [`analytics-and-failure-detection-plan.md`](./analytics-and-failure-detection-plan.md) (founder-gated; read before adding any vendor SDK) |
| Admin console v2 | [`admin-console-v2-plan.md`](./admin-console-v2-plan.md) |
| Decision Brain, increment 1 | [`ambient-precedent-plan.md`](./ambient-precedent-plan.md) |
| Decision Brain, the supersession engine | [`supersession-engine-plan.md`](./supersession-engine-plan.md) |
| Builder reliability and the codegen direction | [`builder-reliability-and-codegen-direction.md`](./builder-reliability-and-codegen-direction.md) (a proposal; the founder owns the decision) |
| Raw audit passes | [`audit-reports/`](./audit-reports/README.md) |
