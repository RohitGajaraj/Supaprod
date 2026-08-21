# Decisions

> _Created: 2026-08-04 · Last updated: 2026-08-21_

**Why a technical call went the way it did.** Thirteen records (the count read "ten" while the table held twelve; corrected 2026-08-21). Read one when you are about to change something it decided, or when you are tempted to re-litigate a choice somebody already thought through.

A decision record is not a plan. It captures the options that were on the table, what was chosen, and the cost accepted. If you disagree with one, the honest move is to add a new record superseding it, not to quietly build the other way.

---

| Decision | What it settles |
| --- | --- |
| [`tech-stack.md`](./tech-stack.md) | The stack: keep, change, and the open-source posture. Lean permissive; flag copyleft or source-available before it lands. |
| [`tenancy-retrofit.md`](./tenancy-retrofit.md) | The three-key tenancy model: account, workspace, product. **Read before touching any RLS policy.** |
| [`durable-runtime.md`](./durable-runtime.md) | Where long and parallel agent work runs. |
| [`build-sandbox-vendor.md`](./build-sandbox-vendor.md) | Why E2B, why not Cloudflare, and what that costs. |
| [`analytics-vendor-selection.md`](./analytics-vendor-selection.md) | PostHog EU, Sentry EU, Better Stack. The façade rule that keeps leaving Lovable a one-day redeploy. |
| [`memory-on-delete.md`](./memory-on-delete.md) | What happens to memory when a run or session is deleted. A privacy-shaped decision, not a cleanup one. |
| [`lineage-relation-vocabulary.md`](./lineage-relation-vocabulary.md) | **Open question**, not a settled record: whether to collapse the `artifact_lineage.relation` vocabulary. Related trap: two kind vocabularies exist and neither is authoritative, so validating kinds can silently drop a whole lineage chain. |
| [`launch-gates-seat-limits-and-sandbox.md`](./launch-gates-seat-limits-and-sandbox.md) | The two launch gates, with the numbers behind them. |
| [`parallel-development-model.md`](./parallel-development-model.md) | Document-driven parallel development. Historical: the lane worktrees it describes were deleted 2026-08-03. |
| [`free-tier-shape-and-trial.md`](./free-tier-shape-and-trial.md) | Whether Free should be a time-bound trial. **No, not as a replacement:** a 14-day window cannot demonstrate layer 03, because outcomes take weeks to land, so a trial showcases the two copyable layers and expires before the defensible one appears. Recommends a 14-day full-access trial that **degrades into** permanent Free. |
| [`palette-verb-shapes.md`](./palette-verb-shapes.md) | **A palette verb either navigates to the station that owns the job, or acts in place through something mounted globally — never both.** Settles K-37's four silent verbs. The third shape, navigate-then-open-on-arrival, is used nowhere else in the product and is the only one that rotted, because it couples a global dispatcher to a route-specific mount across a navigation boundary. Also: why ACT drifted while JUMP could not, and what the rule yields per station. |
| [`palette-retired-2026-08.md`](./palette-retired-2026-08.md) | **The ⌘K command palette is retired, its data kept, and the gap it covered filed as work.** Reverses two written contracts (`FINAL-ia.md:137` "It ships", `FINAL-shell-ruling.md:452` "the highest-value single item") that were never overturned, so it records the case for keeping it verbatim. **Read before building a command palette here.** Also: why the delete is a one-way door the ratchet will not let you revert. |
| [`naming.md`](./naming.md) | The product-name status and candidate log. The decision itself, Cadence to Supaprod, is [`../pitch/naming-decision-supaprod.md`](../pitch/naming-decision-supaprod.md), with the unmigrated-identifier ledger at [`../operations/rename-cadence-to-supaprod.md`](../operations/rename-cadence-to-supaprod.md). |

---

## Related, but not decision records

- **Build, buy or integrate** any capability: [`../strategy/build-buy-integrate.md`](../strategy/build-buy-integrate.md), the gate you run before building from core.
- **Strategic** decisions, as opposed to technical ones: [`../strategy/session-decisions.md`](../strategy/session-decisions.md).
- **Governance**, which is a founder ruling rather than an ADR: [`../planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md`](../planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md).
- **Architecture contracts**, which state what is true rather than why: [`../../architecture/`](../../architecture/).
