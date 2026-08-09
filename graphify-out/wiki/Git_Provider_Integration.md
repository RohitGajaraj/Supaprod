# Git Provider Integration

> 30 nodes · cohesion 0.15

## Key Concepts

- **repo-provider.ts** (18 connections) — `src/lib/connectors/repo-provider.ts`
- **GitLabRepoProvider** (17 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **github-repo.server.ts** (14 connections) — `src/lib/connectors/providers/github-repo.server.ts`
- **gitlab-repo.server.ts** (14 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **encodeProject()** (11 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **CommitResult** (9 connections) — `src/lib/connectors/repo-provider.ts`
- **DeploymentEntry** (7 connections) — `src/lib/connectors/repo-provider.ts`
- **.readChecks()** (5 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **BranchRef** (5 connections) — `src/lib/connectors/repo-provider.ts`
- **ChangeRequest** (5 connections) — `src/lib/connectors/repo-provider.ts`
- **CiState** (5 connections) — `src/lib/connectors/repo-provider.ts`
- **FileContent** (5 connections) — `src/lib/connectors/repo-provider.ts`
- **TreeEntry** (5 connections) — `src/lib/connectors/repo-provider.ts`
- **.bootstrapRepo()** (4 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.commitFiles()** (4 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.createBranch()** (4 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.mergeChangeRequest()** (4 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.openChangeRequest()** (4 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.readDeployments()** (4 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.readFile()** (4 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.readTree()** (4 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.searchCode()** (3 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **overallConclusion()** (2 connections) — `src/lib/connectors/providers/github-repo.server.ts`
- **.constructor()** (2 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- **.createRepo()** (2 connections) — `src/lib/connectors/providers/gitlab-repo.server.ts`
- *... and 5 more nodes in this community*

## Relationships

- [GitHub Repository Provider](GitHub_Repository_Provider.md) (27 shared connections)
- [Deployment Tracking and History](Deployment_Tracking_and_History.md) (6 shared connections)
- [Repository Provider Interface](Repository_Provider_Interface.md) (4 shared connections)
- [GitHub Repository Integration](GitHub_Repository_Integration.md) (1 shared connections)
- [Connection and Auth Management](Connection_and_Auth_Management.md) (1 shared connections)

## Source Files

- `src/lib/connectors/providers/github-repo.server.ts`
- `src/lib/connectors/providers/gitlab-repo.server.ts`
- `src/lib/connectors/repo-provider.ts`

## Audit Trail

- EXTRACTED: 169 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*