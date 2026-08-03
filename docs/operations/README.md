# Operations

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**How to run this thing.** Twenty-nine documents grouped by the question you arrived with. Everything here is a procedure or a policy, never a plan and never a status.

For the rules a change must satisfy, read [`../../AGENTS.md`](../../AGENTS.md). For where the project stands, [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §0.

---

## Start of session

| File | What it answers |
| --- | --- |
| [`session-handoff.md`](./session-handoff.md) | What the last session did and left open. **Read this second, after the SSOT cursor.** Tracked and durable, because `.remember/remember.md` empties itself on read. |
| [`memory.md`](./memory.md) | How auto-memory and the project-local `.remember/` work, and why the handoff must be written to both places. |

## Working with agents and tools

| File | What it answers |
| --- | --- |
| [`skills.md`](./skills.md) | How to choose a skill, and the anti-patterns. |
| [`subagents.md`](./subagents.md) | When to dispatch a subagent, and which. |
| [`tools.md`](./tools.md) | Read, Edit, Write, Bash conventions. |
| [`hooks.md`](./hooks.md) | What the hooks enforce and how to install them. Run `bash ../../scripts/install-git-hooks.sh` in every fresh clone; the hooks live in untracked `.git/hooks`. |
| [`permissions.md`](./permissions.md) | The permission model. |
| [`lovable-knowledge.md`](./lovable-knowledge.md) | The tracked mirror of Lovable's project Knowledge field, which is the only instruction set its agent reads. **Change the field and that file in the same sitting.** It drifted six weeks unnoticed because it is not in git by default. |

## Git and shipping

| File | What it answers |
| --- | --- |
| [`commits.md`](./commits.md) | Commit and push discipline. Every git interaction carries a one-line WHY. |
| [`git-recovery-and-orphan-guard.md`](./git-recovery-and-orphan-guard.md) | Read this **before** touching a broken worktree. On 2026-07-27, a `git init` recovery plus a force-push replaced `origin/main` with a zero-parent history and orphaned 4,124 commits. The correct fix is `git worktree repair`. |
| [`migration-check.md`](./migration-check.md) | Migration safety, which is hook-enforced. |

## Demos and credentials

| File | What it answers |
| --- | --- |
| [`demo-credentials.md`](./demo-credentials.md) | The logins. **Rehearse on `harbor@`, never on an account you plan to send out**, because approving a gate is a write and it empties the queue the demo is built around. The file marks which passwords are verified; treat an unverified row as unknown. |
| [`founder-demo-script.md`](./founder-demo-script.md) | The walkthrough. |

## Connectors and integrations

[`connector-setup.md`](./connector-setup.md) is the front door, with per-provider detail in [`connectors/`](./connectors/README.md) (GitHub, Slack, Linear, Intercom, Salesforce, Google, Microsoft). Two specific playbooks: [`signal-fabric-connector-setup.md`](./signal-fabric-connector-setup.md) and [`signal-fabric-live-test-playbook.md`](./signal-fabric-live-test-playbook.md). OAuth for calendars: [`calendar-oauth-setup-runbook.md`](./calendar-oauth-setup-runbook.md).

## Runbooks, for when something is wrong

| File | Use when |
| --- | --- |
| [`alerting-runbook.md`](./alerting-runbook.md) | An alert fired. |
| [`fnd-runtime-restart-playbook.md`](./fnd-runtime-restart-playbook.md) | The runtime needs restarting. |
| [`auth-backend-migration-runbook.md`](./auth-backend-migration-runbook.md) | Auth backend work. |
| [`observability.md`](./observability.md) | Telemetry and failure detection. |

## Go-live and spend

| File | What it answers |
| --- | --- |
| [`credit-engine-go-live.md`](./credit-engine-go-live.md) | The credit engine flip. Founder-owned; metering has been off since it was armed with zero balances and blocked all AI. |
| [`procurement-inventory.md`](./procurement-inventory.md) | Every paid dependency with cost, source and a when-to-buy. The single shopping list at launch time. |
| [`domain-and-email-setup.md`](./domain-and-email-setup.md) | Domains and email infrastructure. |
| [`openhands-activation.md`](./openhands-activation.md) | The OpenHands build driver. |

## Historical, kept for the record

| File | Status |
| --- | --- |
| [`rename-cadence-to-supaprod.md`](./rename-cadence-to-supaprod.md) | **Still useful.** The ledger of internal identifiers deliberately left unmigrated, so `agent_slug='builder'` and the `cadence` DB column read correctly rather than as brand leakage. |
| [`autonomous-build-loop.md`](./autonomous-build-loop.md) | **Dormant.** The unattended overnight loop. Not the current mode of work; sessions are directed individually. Do not start it without an explicit instruction. |
| [`parallel-build.md`](./parallel-build.md) | **Dormant.** The lane mechanics and atomic claim ledger that the loop above used. Verify it still works before trusting it. |
| [`security-audit-findings.md`](./security-audit-findings.md) | Superseded by [`../security/`](../security/README.md), which owns audit state now. |
