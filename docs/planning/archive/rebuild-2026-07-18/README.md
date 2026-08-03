# The 2026-07-18 rebuild, and the July waves

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Historical record. None of this is current.** These nine documents lived at the repo root until 2026-08-03. They describe a front-end rebuild that ran from 2026-07-18 to 2026-07-25 and was itself superseded ten days later.

**What replaced it:** on **2026-07-28** the founder ruled the authenticated app rebuilt **from zero**, revoking every design constraint including the ones agreed here. The current design contract is [`../../../design/DESIGN-SYSTEM.md`](../../../design/DESIGN-SYSTEM.md); the current live cursor is [`../../SOURCE-OF-TRUTH.md`](../../SOURCE-OF-TRUTH.md) §0.

| File | What it was |
| --- | --- |
| [`phase-0-audit.md`](./phase-0-audit.md) | Route inventory and the audit that opened the rebuild |
| [`phase-1-architecture.md`](./phase-1-architecture.md) | The three-surface architecture proposal |
| [`phase-3-strategy.md`](./phase-3-strategy.md) | Surfaces, decisions, sequencing |
| [`founder-decisions.md`](./founder-decisions.md) | Six blocking decisions put to the founder |
| [`progress.md`](./progress.md) | Phase 2 completion, the 12-component production pass |
| [`delivery-summary.md`](./delivery-summary.md) | What the phase delivered |
| [`wave-1-2-handoff-status.md`](./wave-1-2-handoff-status.md) | Wave 1-2 completion and continuation points |
| [`wave-1-2-design-completion.md`](./wave-1-2-design-completion.md) | Wave 1-2 design refinement summary |
| [`wave-3-implementation-plan.md`](./wave-3-implementation-plan.md) | Materials and spacing plan, never executed |

## Why it is worth keeping rather than deleting

The Phase 0 audit is the document that first named the real defect: **two complete app shells running at once**, chosen by a hardcoded pathname allowlist, with roughly 68 routes on the retired rail and 7 on the newer one. That finding is what eventually justified the rebuild-from-zero ruling. The route inventory in it is still accurate enough to be useful.

The rest is kept for continuity of the record. Read it as history, cite it as history.
