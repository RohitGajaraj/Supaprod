# Changeset Deployment to Production

> 25 nodes · cohesion 0.17

## Key Concepts

- **ci-poll-tick.ts** (32 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **changeset-deploy.server.ts** (16 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **runCiPollTick()** (14 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **promoteChangesetToProductionCore()** (10 connections) — `src/lib/deployments.functions.ts`
- **deployChangesetApp()** (9 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **collectRepoFiles()** (7 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **denoDeployConfigured()** (6 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **generateReleaseNotesCore()** (6 connections) — `src/lib/studio.functions.ts`
- **changeset-deploy.test.ts** (5 connections) — `src/lib/hosting/changeset-deploy.test.ts`
- **isSupaprodManaged()** (4 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **previewUrl()** (4 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **productionUrl()** (4 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **denoOrgSlug()** (3 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **denoToken()** (3 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **deployableFile()** (3 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **deriveAppSlug()** (3 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **ghHeaders()** (3 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **ghHeaders()** (2 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **ChangesetDeployResult** (1 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **TEXT_EXTENSIONS** (1 connections) — `src/lib/hosting/changeset-deploy.server.ts`
- **BRANCH_SYNC_BUDGET** (1 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **ChangesetLite** (1 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **CI_FIX_BUDGET** (1 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **NON_TERMINAL_RUN** (1 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`
- **Route** (1 connections) — `src/routes/api/public/hooks/ci-poll-tick.ts`

## Relationships

- [Deployment Tracking and History](Deployment_Tracking_and_History.md) (12 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (7 shared connections)
- [CI Logs and Preview](CI_Logs_and_Preview.md) (7 shared connections)
- [GitHub Signal Ingestion](GitHub_Signal_Ingestion.md) (3 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (3 shared connections)
- [React Execution State](React_Execution_State.md) (2 shared connections)
- [GitHub Webhook Verification](GitHub_Webhook_Verification.md) (2 shared connections)
- [Evaluation and Regression Testing](Evaluation_and_Regression_Testing.md) (1 shared connections)
- [Model Cache Management](Model_Cache_Management.md) (1 shared connections)
- [Vault and OAuth Connections](Vault_and_OAuth_Connections.md) (1 shared connections)

## Source Files

- `src/lib/deployments.functions.ts`
- `src/lib/hosting/changeset-deploy.server.ts`
- `src/lib/hosting/changeset-deploy.test.ts`
- `src/lib/studio.functions.ts`
- `src/routes/api/public/hooks/ci-poll-tick.ts`

## Audit Trail

- EXTRACTED: 141 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*