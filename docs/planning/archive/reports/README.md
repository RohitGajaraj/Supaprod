# Session reports and audits, archived

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Historical record. None of this is a plan, a status, or a rule.** These 30 documents sat loose at the top of `docs/planning/` until 2026-08-03. Every one of them was an **orphan**: nothing in the repo linked to any of them, including the SSOT, the register in SOURCE-OF-TRUTH.md, `docs/README.md` and `AGENTS.md`.

That is what makes them safe to move and worth keeping. They are the write-ups sessions produced as they finished a piece of work, useful as evidence of what was checked and when, and misleading if read as current.

**For anything current:** [`../../SOURCE-OF-TRUTH.md`](../../SOURCE-OF-TRUTH.md) §0 for the live cursor, [`../../SOURCE-OF-TRUTH.md`](../../SOURCE-OF-TRUTH.md) for per-feature status, [`../../known-issues.md`](../../known-issues.md) for open bugs.

Dates were stripped from the filenames on archiving, per the repo's naming rule: the date belongs in the file header, so it is learned on open rather than guessed from a name.

## Design audits, July 2026

| File | What it recorded |
| --- | --- |
| [`design-audit-round-1.md`](./design-audit-round-1.md) | First design-system audit, 2026-07-16 |
| [`design-audit-round-2.md`](./design-audit-round-2.md) | Second pass, 2026-07-17 |
| [`design-audit-action-tracker.md`](./design-audit-action-tracker.md) | The action list those two produced |
| [`component-qa-audit.md`](./component-qa-audit.md) | Component-level QA, 2026-07-17 |
| [`vercel-dissection-study.md`](./vercel-dissection-study.md) | Vercel homepage teardown that fed the Tempo era |
| [`ultra-premium-status.md`](./ultra-premium-status.md) · [`ultra-premium-mandate-completion.md`](./ultra-premium-mandate-completion.md) · [`mandate-completion.md`](./mandate-completion.md) | The "ultra premium" mandate and its closure |

**All of this predates 2026-07-28**, when the front end was rebuilt from zero and every design constraint in these files was revoked. Read them as history. The current contract is [`../../../design/DESIGN-SYSTEM.md`](../../../design/DESIGN-SYSTEM.md).

## The July waves and the redesign dispatch

| File | What it recorded |
| --- | --- |
| [`wave-1-2-completion-report.md`](./wave-1-2-completion-report.md) · [`wave-1-2-migration-summary.md`](./wave-1-2-migration-summary.md) · [`wave-1-2-phase-6-report.md`](./wave-1-2-phase-6-report.md) | Wave 1-2, 2026-07-25 |
| [`wave-2-execution-plan.md`](./wave-2-execution-plan.md) · [`wave-2-progress.md`](./wave-2-progress.md) · [`wave-2-completion-spec.md`](./wave-2-completion-spec.md) · [`wave-2-session-summary.md`](./wave-2-session-summary.md) · [`wave-2-session-2-summary.md`](./wave-2-session-2-summary.md) | Wave 2 |
| [`wave-3-phase-2-completion.md`](./wave-3-phase-2-completion.md) | Wave 3, which never finished |
| [`redesign-dispatch-and-execution-plan.md`](./redesign-dispatch-and-execution-plan.md) | The 2026-07-28 dispatch plan |

**Worth one lesson.** The redesign dispatch authored 28 mockups and 13 work-order packets, and **only 2 of 11 lanes ever ran**. The failure was dispatch, not design. Anyone planning a large parallel push should read that before writing another packet: produce code, not more documents.

## Testing and coverage

[`test-delivery.md`](./test-delivery.md) · [`test-coverage-report.md`](./test-coverage-report.md) · [`test-coverage-completion-summary.md`](./test-coverage-completion-summary.md) · [`test-coverage-audit-improvements.md`](./test-coverage-audit-improvements.md) · [`manual-testing-plan.md`](./manual-testing-plan.md) · [`testing-verification.md`](./testing-verification.md)

Coverage numbers in these are long superseded. Current conventions live in [`../../../testing/`](../../../testing/).

## Security and code audits

[`security-remediation-summary.md`](./security-remediation-summary.md) · [`code-audit-results.md`](./code-audit-results.md) · [`tier-3-audit-report.md`](./tier-3-audit-report.md)

Live security material is in [`../../../security/`](../../../security/) and [`operations/security/audit-findings-july.md`](../../../operations/security/audit-findings-july.md).

## The parallel-lane loop

[`active-claims-live.md`](./active-claims-live.md) · [`standing-rule-pick-and-close.md`](./standing-rule-pick-and-close.md) · [`lifecycle-gap-map.md`](./lifecycle-gap-map.md)

The overnight autonomous build loop these describe, with its atomic claim ledger, ranked register and `lane.sh` pick-order, **no longer runs**. Work is now directed per session. The mechanics survive in [`../../../operations/parallel-build.md`](../../../operations/parallel-build.md) if that pattern is ever revived.
