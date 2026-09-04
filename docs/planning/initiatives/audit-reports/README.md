# Audit reports, 2026-08-14

> _Created: 2026-08-14 · Last updated: 2026-08-14_

The raw output of each audit pass behind [`../functionality-audit-2026-08.md`](../functionality-audit-2026-08.md). The audit is the conclusion; these are the evidence it was drawn from.

**Why they are committed rather than left in a scratchpad.** Founder ruling, 2026-08-14: save each pass the moment it finishes, do not wait for the batch, because a reboot must not mean starting from the beginning. A scratchpad under `/private/tmp` does not survive a restart, so "saved" has to mean committed.

**These are working material and they go stale.** The audit document is kept current as fixes land; these are snapshots of what was true when each pass ran. Where a report and the audit disagree, the audit is right. Several claims in these reports were checked against the production database and turned out to be wrong about live state while right about the defect; those corrections live in the audit, not here.

**Two reports were wrong in a way worth recording**, because it is the reason every load-bearing number in the audit carries its query:

- The agent-tier pass reported the global outward-write gate as closed by default with no way to open it. The gate reads `true` in production. The defect it found was real and sharper than reported: the gate was open and the *application* could not mint a token carrying the scopes.
- My own first reading of the frozen spine blamed credit exhaustion. Tracks in workspaces holding 5,000 credits are frozen identically. Credit exhaustion explains one frozen track out of twenty-six.

## The passes

| Pass | Scope | File |
| --- | --- | --- |
| The long tail | Daily-driver screens, orphans, and the unwired server layer | [`long-tail-and-orphans.md`](./long-tail-and-orphans.md) |
| Admin | Eleven tabs of controls that render, fire, and change nothing | [`admin-surfaces.md`](./admin-surfaces.md) |
| Billing and connectors | What a paying user and a connecting user actually see | [`billing-and-connectors.md`](./billing-and-connectors.md) |
| Seven stations | Discover through Learn, from the user's point of view | [`seven-stations-user-lens.md`](./seven-stations-user-lens.md) |
| Agent surfaces | Agents, crew, approvals, governance, trust | [`agent-and-governance-surfaces.md`](./agent-and-governance-surfaces.md) |

**Three passes died mid-flight on 2026-08-14 and are being re-run.** Four were launched at once, and each spawned children of its own, so the real concurrency was closer to eight while two other lanes were also fanning out. Every one of them returned `Connection lost mid-response`. The founder's cap is two at a time, and the correction this taught is that the cap has to count NESTED spawns, not just the ones launched directly: four became eight without anybody choosing that.

The completed pass survived only because it had already been written to disk when it finished, which is the whole point of the save-as-you-go ruling.

**Two of the three were re-run and landed**, and the table above links them. They sat unlinked for a while, which is its own small lesson: the row that says "pending" is the row nobody goes back to change, so the doc gate had to catch it. Two of the seven-stations findings, Ship's day-one Gate and Build's day-one headline, were fixed in `72417655`.

The eight earlier passes (forecast, ticks and cron, agent-tier access, stubs and dead ends, concurrency and money, core lifecycle, silent failures, learn and brain) were distilled directly into the audit document and its register as they arrived, and are not reproduced here.
