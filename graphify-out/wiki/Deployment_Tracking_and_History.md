# Deployment Tracking and History

> 22 nodes · cohesion 0.14

## Key Concepts

- **deployments.functions.ts** (43 connections) — `src/lib/deployments.functions.ts`
- **deployments.ts** (9 connections) — `src/lib/deployments.ts`
- **captureDeploymentsCore()** (7 connections) — `src/lib/deployments.functions.ts`
- **deployments.test.ts** (7 connections) — `src/lib/deployments.test.ts`
- **deploymentRowsFor()** (6 connections) — `src/lib/deployments.ts`
- **listDeployments** (6 connections) — `src/lib/deployments.functions.ts`
- **repoProviderFor()** (5 connections) — `src/lib/connectors/repo-provider.ts`
- **closeOutSpecOnPromote()** (5 connections) — `src/lib/deployments.functions.ts`
- **defaultCheckByDate()** (4 connections) — `src/lib/launch-plan.functions.ts`
- **dedupeLatestDeployments()** (3 connections) — `src/lib/deployments.ts`
- **captureDeployments** (3 connections) — `src/lib/deployments.functions.ts`
- **promoteToProduction** (3 connections) — `src/lib/deployments.functions.ts`
- **specLabel()** (3 connections) — `src/lib/deployments.functions.ts`
- **normalizeDeployStatus()** (3 connections) — `src/lib/deployments.ts`
- **DeploymentRow** (2 connections) — `src/lib/deployments.ts`
- **parseRepo()** (2 connections) — `src/lib/deployments.functions.ts`
- **specsShippedByChangeset()** (2 connections) — `src/lib/deployments.functions.ts`
- **DeployStatus** (1 connections) — `src/lib/deployments.ts`
- **DeployReadOutcome** (1 connections) — `src/lib/deployments.functions.ts`
- **resolveWorkspaceId()** (1 connections) — `src/lib/deployments.functions.ts`
- **SpecForCloseOut** (1 connections) — `src/lib/deployments.functions.ts`
- **zeroCaptureMessage()** (1 connections) — `src/lib/deployments.functions.ts`

## Relationships

- [Changeset Deployment to Production](Changeset_Deployment_to_Production.md) (12 shared connections)
- [React Execution State](React_Execution_State.md) (7 shared connections)
- [Git Provider Integration](Git_Provider_Integration.md) (6 shared connections)
- [Deployment and Shipping Status](Deployment_and_Shipping_Status.md) (4 shared connections)
- [Launch Plan Generation](Launch_Plan_Generation.md) (3 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (3 shared connections)
- [Connection and Auth Management](Connection_and_Auth_Management.md) (2 shared connections)
- [Build Session UI](Build_Session_UI.md) (2 shared connections)
- [Release Documentation Assembly](Release_Documentation_Assembly.md) (2 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (2 shared connections)
- [Vault and OAuth Connections](Vault_and_OAuth_Connections.md) (2 shared connections)
- [GitHub Signal Ingestion](GitHub_Signal_Ingestion.md) (2 shared connections)

## Source Files

- `src/lib/connectors/repo-provider.ts`
- `src/lib/deployments.functions.ts`
- `src/lib/deployments.test.ts`
- `src/lib/deployments.ts`
- `src/lib/launch-plan.functions.ts`

## Audit Trail

- EXTRACTED: 118 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*