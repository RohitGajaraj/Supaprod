# PC-35 — The premium build rung: `claude-agent` driver + execution sandbox (post-YC, founder-gated)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Every claim tagged: WORKS TODAY / WIRED-BUT-DORMANT / PLANNED. This packet is the architecture + phase plan; no phase starts without its named founder gate.

## The Conductor ruling (recorded)

Conductor (Melty Labs, conductor.build) is free and licensed for **internal business use** — it stays our dev tool, no licensing cost. Its terms prohibit embedding, white-labeling, offering as a service, and reverse engineering — it can never power a Supaprod feature. The equivalent is built on our seam; the mechanics (parallel agents, isolated workspaces, diff-first review, one watch-place) are not protectable IP. UX grammar we deliberately borrow: state-column board (needs-you / working / in-review / done), diff-first review, notify-on-finish/needs-input, archive-on-merge, per-task isolated context.

## The architectural key fact

The Claude Agent SDK (TS) spawns the Claude Code engine as a **subprocess** — it cannot run inside a Cloudflare Worker. So the sandbox is not just "where tests run": **the sandbox hosts the agent harness itself.** The Worker orchestrates (dispatch/poll/cancel/merge-gate); a Node runner inside the sandbox drives the SDK against a real checkout. The SDK is embeddable under our brand per its terms ("Supaprod Build" — never "Claude Code" user-facing) and runs on our API credits (BYOK or managed).

## Sandbox: Cloudflare Sandbox SDK primary, E2B reserved fallback

- **Cloudflare Sandbox** (recommend): native Worker binding (spawn/exec/kill in-process, no cross-cloud auth); per-mission container = the Conductor-workspace equivalent; exposed ports give real preview URLs (flips `ExecProvider.previewsBuilds` and upgrades the Preview tab for free). Per-active-second billing — sandbox COGS is cents/task; model tokens dominate. Requires wrangler containers + DO bindings (today `wrangler.jsonc` is minimal — this is the infra gate). Newest platform of the options: that risk is hedged by E2B.
- **E2B** (fallback): Firecracker microVMs, ~150ms starts, mature TS SDK over HTTPS (drivable from a Worker), 24h sessions, Apache-2.0 core, self-hostable later.
- Both are already reserved ids in `src/lib/exec/provider.ts` (WIRED-BUT-DORMANT as type members). Modal (Python-first), Daytona (AGPL core), Fly (raw ops burden) — considered, not chosen.

## Driver lifecycle (new honest id `claude-agent`; rename/relabel the single-shot `claude-sdk` to `patch` in the same phase)

1. **dispatch** — create mission + `agent_runs` row, stamp `build_driver='claude-agent'`; create the per-mission sandbox; inject: short-lived GitHub App installation token (scoped to the bound repo), mission-scoped metering token, the BuildSpec JSON. `externalJobId` = sandbox id. Returns fast (the seam's async poll/result contract, unchanged).
2. **checkout** — shallow clone, branch `studio/<mission>` (same namespace as native; `builder_file_claims` path locks still arbitrate; the ≤5/workspace cap holds).
3. **iterate** — the runner drives SDK `query()` with goal + acceptance criteria + guardrails; the agent edits, runs the repo's own test command, self-corrects; bounded by maxTurns + the metering hold. The runner heartbeats to a new `/api/public/hooks/build-agent` endpoint (the `resume-runs` idiom), landing as run steps — the existing plan-chips/terminal/timeline UI renders it **unchanged**.
4. **push + PR** — via the existing `RepoProvider`; stage `studio_changes` rows from the final diff so Changes/hunk curation work identically to native.
5. **poll/cancel** — pg_cron tick calls `driver.poll` (heartbeat rows, sandbox status probe fallback); cancel = sandbox kill + exactly the mission/run/claim writes `nativeBuildDriver.cancel` does.
6. **merge gate** — untouched: CI (GitHub Actions ExecProvider floor) + review-pinned `studio.pr.merge` + trust-arc approval. The moat stays at the two control points: BuildSpec out, merge gate in.

## Metering (BD-5) — our chokepoint, not SDK billing

Inject `ANTHROPIC_BASE_URL` → a thin metering proxy route on our Worker: (a) per-task pre-authorization hold (mandatory before paying users), (b) writes the same cost rows the Cost tab reads, (c) BYOK (workspace key via `resolveProviderAuth`) vs managed credits (our key, marked up) in one branch. Capability-class table (`codegen.economy|standard|frontier` → model id, config-backed) lands in Phase 0 and removes every hard-coded vendor model id.

## Phases + gates

| Phase | Work | Size | Gate |
| --- | --- | --- | --- |
| P0 | Naming honesty (`claude-sdk`→`patch` or label re-scope) + capability-class table + patch-driver dry run on a test repo | S–M | FOUNDER: small real-credit budget |
| P1 | Sandbox spike: wrangler containers/DO bindings, runner image (Node+git+Agent SDK), boot/clone/exec/kill smoke test | M | FOUNDER: CF paid-containers spend |
| P2 | `claude-agent` driver E2E: dispatch→checkout→iterate→PR→poll/cancel; heartbeat hook; zero UI changes needed | L | security review of secret injection |
| P3 | BD-5 metering proxy + pre-auth hold + BYOK branch | M | margin check before paying users |
| P4 | BD-6 driver-choice surface: quiet kebab receipt line + Settings > Build engines (enterprise-labeled); silent chooser v2 (class/scope-aware — NOT the current inverted file-count heuristic) | M | after ≥2 drivers genuinely live |

**Key files:** `src/lib/build/{driver.ts,resolve.server.ts,claude-sdk-driver.server.ts,native.server.ts}`, `src/lib/exec/provider.ts`, `src/lib/studio.functions.ts`, `wrangler.jsonc`, new `src/lib/build/claude-agent.server.ts` + runner package + `/api/public/hooks/build-agent`.
