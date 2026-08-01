# Stage Events & Cron Ticks

> 83 nodes · cohesion 0.04

## Key Concepts

- **recordStageEvent()** (38 connections) — `src/lib/stage-events.server.ts`
- **stage-events.server.ts** (29 connections) — `src/lib/stage-events.server.ts`
- **ci-poll-tick.ts** (28 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **trigger-tick.ts** (22 connections) — `src/routes/api/public/hooks/trigger-tick.ts`
- **trigger.ts** (19 connections) — `src/lib/sensing/trigger.ts`
- **goals.server.ts** (16 connections) — `src/lib/goals.server.ts`
- **changeset-deploy.server.ts** (16 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **goals.functions.ts** (14 connections) — `src/lib/goals.functions.ts`
- **trigger.test.ts** (14 connections) — `src/lib/sensing/trigger.test.ts`
- **runCiPollTick()** (12 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **runGoalWorkPass()** (8 connections) — `src/lib/goals.server.ts`
- **deployChangesetApp()** (8 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **evaluateTriggers()** (7 connections) — `src/lib/sensing/trigger.ts`
- **github-webhook.ts** (7 connections) — `src/routes/api/public/hooks/github-webhook.ts`
- **collectRepoFiles()** (6 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **changeset-deploy.test.ts** (5 connections) — `src/lib/hosting/changeset-deploy.test.ts`
- **runTriggers()** (5 connections) — `src/routes/api/public/hooks/trigger-tick.ts`
- **GoalRow** (4 connections) — `src/lib/goals.server.ts`
- **denoDeployConfigured()** (4 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **isSupaprodManaged()** (4 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **previewUrl()** (4 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **productionUrl()** (4 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **isAutoMissionTitle()** (4 connections) — `src/lib/sensing/trigger.ts`
- **shouldAutoPromote()** (4 connections) — `src/lib/sensing/trigger.ts`
- **stage-events.test.ts** (4 connections) — `src/lib/stage-events.test.ts`
- *... and 58 more nodes in this community*

## Relationships

- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (18 shared connections)
- [src/lib - studio.functions.ts](src-lib_-_studio.functions.ts.md) (7 shared connections)
- [src/lib - exec/provider.ts](src-lib_-_exec-provider.ts.md) (7 shared connections)
- [src/lib - loops.functions.ts](src-lib_-_loops.functions.ts.md) (5 shared connections)
- [src/lib - loop.server.ts](src-lib_-_loop.server.ts.md) (5 shared connections)
- [Agent Tool Registry](Agent_Tool_Registry.md) (4 shared connections)
- [src/lib - runtime.server.ts](src-lib_-_runtime.server.ts.md) (3 shared connections)
- [src/lib - handoff.server.ts](src-lib_-_handoff.server.ts.md) (3 shared connections)
- [src/lib - ai/verify-green.server.ts](src-lib_-_ai-verify-green.server.ts.md) (3 shared connections)
- [Signal Ingestion & Provider Auth](Signal_Ingestion_%26_Provider_Auth.md) (3 shared connections)
- [src/lib - studio-rollbacks.ts](src-lib_-_studio-rollbacks.ts.md) (3 shared connections)
- [Connectors & Secret Vault](Connectors_%26_Secret_Vault.md) (3 shared connections)

## Source Files

- `src/lib/goals.functions.ts`
- `src/lib/goals.server.test.ts`
- `src/lib/goals.server.ts`
- `src/lib/hosting/changeset-deploy.server.ts`
- `src/lib/hosting/changeset-deploy.test.ts`
- `src/lib/sensing/trigger.test.ts`
- `src/lib/sensing/trigger.ts`
- `src/lib/stage-events.server.ts`
- `src/lib/stage-events.test.ts`
- `src/routes/api/public/hooks/ci-poll-tick.ts`
- `src/routes/api/public/hooks/github-webhook.ts`
- `src/routes/api/public/hooks/trigger-tick.ts`

## Audit Trail

- EXTRACTED: 382 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*