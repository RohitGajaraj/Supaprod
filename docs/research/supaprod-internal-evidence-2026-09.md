# What the repo proves about Supaprod, as of the strategy reset

> _Created: 2026-09-23 · Last updated: 2026-09-23_

**Part of the 2026-09-23 strategy reset** ([`../strategy/strategy-reset-2026-09.md`](../strategy/strategy-reset-2026-09.md)).
This file answers one question from inside the repo only: **what do we actually know about
Supaprod's problem, customer and product, as opposed to what we believe?** Every row points at the
file that holds the evidence. Nothing here was re-queried against production on 2026-09-23. The
database numbers are the last recorded measurements, with their dates.

Labels: **[FACT]** has a file or query behind it. **[ASSUMPTION]** is something the plan depends on
that nothing in the repo tests. **[HYPOTHESIS]** is testable and untested.

---

## 1. Facts

### Users, revenue, customers

| Fact | Source |
| --- | --- |
| **[FACT]** 16 auth users, **4 with a real Google identity, none signed in since 2026-07-19**. Every sign-in in the 30 days to 2026-09-02 was a `*@supaprod.ai` persona account | [`../../the-first-run/A1-REPORT.md`](../../the-first-run/A1-REPORT.md) §1.2 |
| **[FACT]** Zero revenue. Billing built and switched off. YC form: *Are people using your product? No. Revenue? No.* | [`../pitch/yc/APPLICATION-FINAL.md`](../pitch/yc/APPLICATION-FINAL.md) |
| **[FACT]** The design-partner kit named 25 targets. **0 of 25 were ever contacted.** Retired by the founder on 2026-09-23 | [`../pitch/design-partner-kit.md`](../pitch/design-partner-kit.md) |
| **[FACT]** No recorded customer interview, paid pilot, letter of intent or waitlist. The GTM audit found *"Waitlist ✗ — zero code"* | [`../growth/07-gtm-ground-truth.md`](../growth/07-gtm-ground-truth.md) |
| **[FACT]** The founder, 2026-09-23: *"I myself have not even seen one provable application completely, I have not exposed it to the outside world."* | [`../prompts/strategy-reset.md`](../prompts/strategy-reset.md) |

### Whether the product does what it says

| Fact | Source |
| --- | --- |
| **[FACT]** Exactly **one** run has walked all seven stations. Its Ship station declined, its changeset was abandoned, and its forecast was about Supaprod's own paperwork (*"the PRD will be approved within 3 business days"*) | A1-REPORT §0 item 3, §1.1 |
| **[FACT]** Of 60 non-sample tracks: 45 abandoned, 38 never left the first station | A1-REPORT §1.2 |
| **[FACT]** **No real user's forecast has ever been graded.** `forecast_resolution_log` had 0 rows; all 12 "resolved" forecasts were seed rows | A1-REPORT §1.2 |
| **[FACT]** Ship has never fired for a non-sample workspace; 42 deployment rows, 0 non-sample | A1-REPORT §1.2 |
| **[FACT]** On 2026-08-25, 9 tracks had been waiting on a person for weeks with nothing telling anyone | [`../../the-first-run/EVIDENCE.md`](../../the-first-run/EVIDENCE.md) §2 |

### Size of what was built

| Fact | Source |
| --- | --- |
| **[FACT]** 2,508 files under `src/`, **~630,000 lines** of TypeScript, **634 migrations**. Measured 2026-09-23 with `git ls-files` | this session |
| **[FACT]** 5,000+ commits in about eleven weeks, almost all written by agents directed by one founder | APPLICATION-FINAL.md |
| **[FACT]** On 2026-08-25 the repo found whole systems with zero importers, e.g. `TrackActivity`, built 24 days earlier and re-requested by the founder because he did not know it existed | [`../../the-first-run/START-HERE.md`](../../the-first-run/START-HERE.md) |

### Positioning history

| Date | What the product was said to be | Source |
| --- | --- | --- |
| 2026-07-23 (YC filing) | **"Cursor for PMs, the whole product org"**, under the name Cadence | [`../pitch/yc/OUTCOME.md`](../pitch/yc/OUTCOME.md) |
| 2026-08-19 | "Supaprod tells a team what to build next and why", with a critic and a locked forecast | APPLICATION-FINAL.md |
| 2026-08-25 | "The check between what a change was supposed to do and what it did" | START-HERE.md |
| 2026-09-02 | Three layers: director, operating system, brain | [`../../README.md`](../../README.md) |
| 2026-09-02 | *"Say what it should do. Watch it get done. Find out if it worked."* | A1-REPORT §2 |

**[FACT]** Five framings in ten weeks, none tested with a buyer.

### Funding

| Fact | Source |
| --- | --- |
| **[FACT]** Five decisions, five rejections: EF (3 days), Hub71 (7), Campus Founders (8), South Park Commons (11), **YC F26 at the application screen, 2026-08-29** (37). Only Hub71 named criteria | [`../pitch/yc/OUTCOME.md`](../pitch/yc/OUTCOME.md) |
| **[FACT]** The funding tracker lists **571 programmes** | [`../pitch/applications/FUNDING-TRACKER.csv`](../pitch/applications/FUNDING-TRACKER.csv) |

### What earlier research in this repo already said

| Fact | Source |
| --- | --- |
| **[FACT]** On 2026-08-11 the repo's own outside-in validation concluded: *"Outside evidence confirms the problem, confirms the default, and contradicts the business."* | [`./market-validation-2026-08.md`](./market-validation-2026-08.md) §1 |
| **[FACT]** Same file: there is **no analyst category for product-management software** and none for forecast capture or decision provenance | market-validation §8.1, §8.2 |
| **[FACT]** Same file: forecast capture *"creates a legible record of who was wrong, and the people with authority to buy it are the people it exposes"*. Google's internal prediction markets worked and still died | market-validation §8.5 |
| **[FACT]** Same file: **AI governance** got its inaugural Gartner Magic Quadrant on 2026-06-16, forecast at $492M in 2026 and >$1B by 2030 (45.3% CAGR), *"bought by risk and legal rather than product"* | market-validation §8.4 |
| **[FACT]** Anthropic's CPO said on 2025-06-05 that the upstream product-decision layer is *"the next one to go"* | [`../strategy/frontier-lab-defense.md`](../strategy/frontier-lab-defense.md) §1 |
| **[FACT]** The repo's own answer to lab absorption was that the durable part is *"an enterprise governance product"*: cross-tool permissions, an audit surface, someone accountable | frontier-lab-defense §2 ②③ |

**[FACT] The decisive finding existed six weeks before this reset and building continued.**

## 2. Assumptions the plan rests on, and nothing tests

| Assumption | Why it is dangerous |
| --- | --- |
| **[ASSUMPTION]** A product manager, or the person accountable for merging agent-written work, will pay for a closed loop from decision to graded outcome | No one has been asked. The repo's own research says the buyer is the person the record exposes |
| **[ASSUMPTION]** Deciding what to build is the bottleneck teams will pay to remove | Confirmed as a belief everyone shares, which is why it is not a business on its own: Notion shipped it as a free template (market-validation §1) |
| **[ASSUMPTION]** The whole lifecycle has to be one product ("each layer is the precondition for the next") | It makes the first sale depend on a buyer adopting seven stations at once. Nobody buys that from a solo founder |
| **[ASSUMPTION]** A better run screen will make the value felt | Three weeks of surface work since 2026-09-02 did not add a user, because the product was never put in front of one |
| **[ASSUMPTION]** Labs will not ship the decision layer | Anthropic's CPO said they want to. Labs, Linear and Atlassian are all moving onto the lifecycle |

## 3. What the repo built that has value outside this product

**[FACT]** These exist and are wired. Each happens to be a control that regulated buyers are asked to
evidence for AI systems. Whether any of it is worth porting is decided in the verdict, not here.

| Piece | Where | Why it might travel |
| --- | --- | --- |
| One chokepoint for every model call, with guardrails, budget, fallback, and a logged cost/latency/status event per call | `src/lib/ai/runtime.server.ts` (2,961 lines), `ai_events`, `guardrail_hits` | An inventory and monitoring trail per AI call is table stakes for AI governance |
| A forecast that cannot be edited once written, enforced by a `BEFORE UPDATE` trigger and by the write path | migrations incl. `20260814140000_a_wrong_verdict_nobody_can_correct_is_also_a_false_entry.sql` | A prediction recorded before the outcome, then compared against it, is back-testing |
| A verdict seat that did not produce the work it judges | build and verify stations | Independence of the checker from the builder is "effective challenge" in model-risk language |
| Audit lineage from decision to evidence | `src/lib/audit-lineage.functions.ts` | Traceability of an AI-influenced decision |
| Nine OAuth connectors with per-workspace encrypted secrets; E2B sandboxes with secret redaction; a GitHub App | `src/lib/**connector*`, sandbox and GitHub modules | Plumbing any agent product needs |

**[INFERENCE]** None of this is a product. It is the plumbing of one. The code is ~630k lines
maintained by one person, tuned to a lifecycle product, so carrying the codebase forward costs more
than it saves. The patterns are what travel.
