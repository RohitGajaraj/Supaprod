# Operations

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**How to run this thing.** Thirty documents grouped by the question you arrived with. Everything here is a procedure or a policy, never a plan and never a status.

For the rules a change must satisfy, read [`../../AGENTS.md`](../archive/agent-operating-manual.md). For where the project stands, [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §0.

---

## Start of session

| File | What it answers |
| --- | --- |
| [`session-handoff.md`](./session-handoff.md) | What the last session did and left open. **Read this second, after the SSOT cursor.** Tracked and durable, because `.remember/remember.md` empties itself on read. |
| [`memory.md`](./memory.md) | How auto-memory and the project-local `.remember/` work, and why the handoff must be written to both places. |
| [`deploy-verification.md`](./deploy-verification.md) | **A deploy is verified by the SERVING bundle, never by the publish status.** The 2026-08-25 race that shipped a stale build behind a completed publish, and the marker-string chunk-scan that catches it (F-59). |
| [`../../coordination/README.md`](../../coordination/README.md) | **The overnight two-lane run: the protocol and BOTH paste-ready prompts, in one file.** Lives outside `docs/` because its `requests/`, `answers/` and `units/` fill with message files during a run, and docs-doctor fails any doc under `docs/` that nothing links to. |

## Working with agents and tools

| File | What it answers |
| --- | --- |
| [`skills.md`](./skills.md) | How to choose a skill, and the anti-patterns. |
| [`subagents.md`](./subagents.md) | When to dispatch a subagent, and which. |
| [`kiro-queue.md`](./kiro-queue.md) | **The two-agent build split.** Kiro builds on `main` with no database or MCP; Claude verifies on its lane with both. 79 items, each carrying what to build, why it matters, and its acceptance criteria. Kiro takes the lowest-numbered `TODO`; only Claude may write `VERIFIED`. |
| [`agent-kickoff-prompts.md`](./agent-kickoff-prompts.md) | **Copy-paste prompts for starting a two-agent build session.** The Kiro prompt, the Claude prompt, the sync commands, the batching cadence, and which model to run each group on. Start here when kicking off. |
| [`ledger/`](./ledger/README.md) | **How the two agents talk.** One append-only log per agent, each with exactly one writer, so they cannot conflict. An item's status is derived from the latest entry naming it rather than stored in a field both would have to edit. |
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

**Start here if the demo has to work in front of somebody:** [`github-and-demo-account-setup.md`](./github-and-demo-account-setup.md) — which account to demo from and why (`demo@`/`demo2@` are **suspended**; six of the seven `@supaprod.ai` accounts have **no integrations at all**), the four-step GitHub App path, and the workspace binding that is easy to miss and is why the live loop was pointed at a repo nobody uses.

[`connector-setup.md`](./connector-setup.md) is the front door, with per-provider detail in [`connectors/`](./connectors/README.md) (GitHub, Slack, Linear, Intercom, Salesforce, Google, Microsoft). Two specific playbooks: [`signal-fabric-connector-setup.md`](./signal-fabric-connector-setup.md) and [`signal-fabric-live-test-playbook.md`](./signal-fabric-live-test-playbook.md). OAuth for calendars: [`archive/calendar-oauth-credentials-retired.md`](./archive/calendar-oauth-credentials-retired.md).

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

## Testing and security

Both were separate top-level folders until 2026-08-04. They are operational concerns, so they live here now and this folder answers the whole "how do we run it well" question in one place.

| Folder | What it holds |
| --- | --- |
| [`testing/`](./testing/README.md) | How tests are written here, the gates, the enforcement tests that bind a convention, and the one known coverage gap. |
| [`security/`](./security/README.md) | Audit findings, remediation state, and the XSS implementation guide. |

## Historical, kept for the record

| File | Status |
| --- | --- |
| [`rename-cadence-to-supaprod.md`](./rename-cadence-to-supaprod.md) | **Still useful.** The ledger of internal identifiers deliberately left unmigrated, so `agent_slug='builder'` and the `cadence` DB column read correctly rather than as brand leakage. |
| [`autonomous-build-loop.md`](./autonomous-build-loop.md) | **Retired 2026-08-03, description only.** The unattended overnight loop. Its skills (`overnight-build-0`, `overnight-build-1`), its `/overnight-build` command and its two lane worktrees were **deleted** on founder instruction: *"we do not need overnight build skill at all now."* Nothing can start it. Kept because the loop's discipline (never commit a red tree, never commit on main, skip-and-queue a blocked item) is worth reading. |
| [`parallel-build.md`](./parallel-build.md) | **Retired 2026-08-03, description only.** The lane mechanics and the atomic claim ledger at `~/.cadence-parallel`. Reviving this means rebuilding the worktrees; do not assume the commands still work. |
| [`security/audit-findings-july.md`](./security/audit-findings-july.md) | Superseded by [`../security/`](./security/README.md), which owns audit state now. |
| [`archive/session-handoff-2026-08-05-evening.md`](./archive/session-handoff-2026-08-05-evening.md) | **A single evening's handoff, rotated out of the live one.** Archived because a dated filename marks a record of one event, not a living doc. [`session-handoff.md`](./session-handoff.md) is the live pair-half and carries the current cursor; this is the snapshot it replaced. Read it only when a question reaches past what the live one still says. |
| [`DECIDE-RECORD-IMPLEMENTATION.md`](./DECIDE-RECORD-IMPLEMENTATION.md) | The work spec for the Decide-station blocker — why `decision.record` was unreachable and what was changed. Moved here from `docs/` root on 2026-08-26; root holds four files only. The fix itself is recorded in [`../AUDIT.md`](../AUDIT.md). |
| [`VERIFY-MISSION-GATE-FIX.md`](./VERIFY-MISSION-GATE-FIX.md) | The verification plan for the `signals.log` fix that unblocked the first station. |
| [`deploy-and-observe.md`](./deploy-and-observe.md) | The deploy-then-watch checklist for the mission gate. Moved off `docs/` root on 2026-08-26; root holds four files only. |
| [`deployment-record-decide-fix.md`](./deployment-record-decide-fix.md) | What was deployed when the Decide-station fix went out. Moved off root and undated in the same pass. |
| [`session-handoff-decide-blocker.md`](./session-handoff-decide-blocker.md) | The handoff written when the Decide-station blocker was fixed. Undated and linked on 2026-08-26 — the canonical rolling handoff is [`session-handoff.md`](./session-handoff.md), and a dated duplicate beside it is rot the doc gate catches. |
| [`S0-001-DEPLOYMENT-CHECKLIST.md`](./S0-001-DEPLOYMENT-CHECKLIST.md) | The S0 deployment checklist. Linked on 2026-08-26 to clear the doc gate; written by a concurrent session. |
- [Round 8 status](./status-round-8.md) — the live Round 8 readiness board (moved from repo root 2026-08-25 for placement only; content untouched, author's to edit)
- [Round 8 results](./round-8-results.md) — moved from repo root 2026-08-25 for placement only; content untouched, author's to edit
- [Phase 3: visible agency](./phase-3-visible-agency.md) — moved from `docs/` root 2026-08-25 for placement only; content untouched, author's to edit
- [Buildlog](./buildlog.md) — **The build record** — what changed, why, what is next. One entry per logical unit, newest first

- [Mission gate status](./mission-gate-status.md) — Mission gate status (moved from repo root 2026-08-25 for placement only; content untouched)

- [Start here mission gate](./start-here-mission-gate.md) — Mission gate entry note (moved from repo root 2026-08-25 for placement only; content untouched)

- [Mission gate observation](./mission-gate-observation.md) — Mission gate observation (moved from `docs/` root 2026-08-25 for placement only; content untouched)
- [Mission gate deployment readiness](./mission-gate-deployment-readiness.md) — moved from repo root 2026-08-25 for placement only; content untouched

- [Phase 1-2 complete](./PHASE-1-2-COMPLETE.md) — a concurrent session's audit and product-truth summary. Linked 2026-08-26 to clear the doc gate; content is its author's to edit
- [Phase 3 test harness](./PHASE-3-TEST-HARNESS.md) — that session's checklist for running the acceptance query against a deployment. Same provenance, same rule
- [Current status](./current-status.md) — a concurrent session's status note. **Renamed from a dated filename 2026-08-26** to clear the doc gate; content untouched and its author's to edit. Note the one-board rule: live status belongs in [`docs/planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md), and this page should fold into it rather than becoming a second board
- [Session S0 record](./session-s0-record.md) — a concurrent session's own record of that day. Linked 2026-08-26 to clear the doc gate; content is its author's to edit. The rolling pair-half is [`session-handoff.md`](./session-handoff.md), and a dated file beside it is a snapshot, not a second cursor
- [Status session S0 continuance](./status-session-s0-continuance.md) — same provenance and same rule. **Renamed from a filename dated a day ahead of when it landed**, which is worth knowing before reading its claims as current
- [Blocker: Supabase credentials](./blocker-supabase-credentials.md) — a concurrent session's diagnosis that a missing `SUPABASE_SERVICE_ROLE_KEY` is the single blocker. **Its observation is real and its root cause is not supported by the data — see F-100.** Renamed from a dated filename to clear the doc gate; the analysis is its author's to edit
- [Phases 1-4 complete](./PHASES-1-4-COMPLETE.md) — a concurrent session's framework summary. Same provenance and same rule as the rows above: content is its author's to edit. **Read its blocker claim against the record.** It concludes *"the blocker is environmental (missing credential), not logical"*, which is F-106 — and F-106 was **WITHDRAWN**: the GitHub App authenticates fine, the 401s came from a workspace with no binding falling back to a repo the App cannot see (F-110, F-111). The measured blocker is the merge, not a credential (F-124)
- [Mission gate proof live](./MISSION-GATE-PROOF-LIVE.md) — the same session's claim that both acceptance criteria were demonstrated. **Same caution, and a sharper one:** R-18's second criterion is *"no human touching it mid-run"*, and two findings since have shown how easily a run looks unattended when it was not — F-79 (a person decided an approval, and `agent_approvals.decided_by` is NULL so the row cannot name them) and F-112 (a press leaves no approval row at all, and 19 of 106 tracks carry one). The queries that settle it are in [`CLAUDE.md`](../../CLAUDE.md) and [`OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md) §2
- [Runbook: credential to mission completion](./CREDENTIAL-TO-MISSION-COMPLETION-RUNBOOK.md) — the same session's 30-minute plan, premised entirely on *"`SUPABASE_SERVICE_ROLE_KEY` not set anywhere"*. **That premise is F-100, and F-100 is FALSE as a root cause**: `signals.log` wrote seven signals into the same workspace spanning the failure window on both sides, the sweep reaches the database through `supabaseAdmin` whose factory throws outright when that variable is absent, and the affected tracks held `out-of-time` rather than any credential hold. **This session is also explicitly forbidden to request or use a service-role key**, which bypasses RLS. Kept for its sequencing, which is still readable; do not execute step one
