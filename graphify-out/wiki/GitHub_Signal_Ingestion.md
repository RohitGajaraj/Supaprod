# GitHub Signal Ingestion

> 20 nodes · cohesion 0.17

## Key Concepts

- **resolveGitHub()** (22 connections) — `src/lib/connectors/providers/github.server.ts`
- **github-ingest.server.ts** (20 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **ingestGithubSignals()** (11 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **ghFetch()** (6 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **fetchStarSignals()** (4 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **starMilestone()** (4 connections) — `src/lib/connectors/providers/github-signals.ts`
- **fetchIssueSignals()** (3 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **fetchPushSignals()** (3 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **fetchReleaseSignals()** (3 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **fetchTrafficSignals()** (3 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **github-signals.ts** (3 connections) — `src/lib/connectors/providers/github-signals.ts`
- **requireGithub()** (2 connections) — `src/lib/ai/tools/registry.server.ts`
- **actorLabelFor()** (2 connections) — `src/lib/connectors/providers/github.server.ts`
- **bearerOf()** (2 connections) — `src/lib/connectors/providers/github.server.ts`
- **normalizeGithubRepo()** (2 connections) — `src/lib/connectors/providers/github.server.ts`
- **github-signals.test.ts** (2 connections) — `src/lib/connectors/providers/github-signals.test.ts`
- **landedShaForChangeset()** (2 connections) — `src/lib/deployments.functions.ts`
- **GH_HEADERS** (1 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **GhSignal** (1 connections) — `src/lib/connectors/providers/github-ingest.server.ts`
- **IngestResult** (1 connections) — `src/lib/connectors/providers/github-ingest.server.ts`

## Relationships

- [Vault and OAuth Connections](Vault_and_OAuth_Connections.md) (8 shared connections)
- [Canny Integration Service](Canny_Integration_Service.md) (6 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (3 shared connections)
- [Changeset Deployment to Production](Changeset_Deployment_to_Production.md) (3 shared connections)
- [Evaluation and Regression Testing](Evaluation_and_Regression_Testing.md) (2 shared connections)
- [Ingest Guardrails Rate-limiting](Ingest_Guardrails_Rate-limiting.md) (2 shared connections)
- [Deployment Tracking and History](Deployment_Tracking_and_History.md) (2 shared connections)
- [Artifact Lineage View](Artifact_Lineage_View.md) (1 shared connections)
- [Connection and Auth Management](Connection_and_Auth_Management.md) (1 shared connections)
- [Compounding and Learning Panels](Compounding_and_Learning_Panels.md) (1 shared connections)
- [React Execution State](React_Execution_State.md) (1 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (1 shared connections)

## Source Files

- `src/lib/ai/tools/registry.server.ts`
- `src/lib/connectors/providers/github-ingest.server.ts`
- `src/lib/connectors/providers/github-signals.test.ts`
- `src/lib/connectors/providers/github-signals.ts`
- `src/lib/connectors/providers/github.server.ts`
- `src/lib/deployments.functions.ts`

## Audit Trail

- EXTRACTED: 97 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*