# Connectors & Secret Vault

> 118 nodes · cohesion 0.04

## Key Concepts

- **github.server.ts** (66 connections) — `src/lib/connectors/providers/github.server.ts`
- **connectors/registry.ts** (45 connections) — `src/lib/connectors/registry.ts`
- **CONNECTOR_REGISTRY** (33 connections) — `src/lib/connectors/registry.ts`
- **crypto.server.ts** (28 connections) — `src/lib/connectors/crypto.server.ts`
- **encryptSecret()** (26 connections) — `src/lib/connectors/crypto.server.ts`
- **readConnectState()** (22 connections) — `src/lib/connectors/providers/github.server.ts`
- **ProviderId** (22 connections) — `src/lib/connectors/registry.ts`
- **first-ingest.server.ts** (22 connections) — `src/lib/onboarding/first-ingest.server.ts`
- **resolveGitHub()** (20 connections) — `src/lib/connectors/providers/github.server.ts`
- **kickFirstIngest()** (17 connections) — `src/lib/onboarding/first-ingest.server.ts`
- **intercom/callback.ts** (16 connections) — `src/routes/api/public/connect/intercom/callback.ts`
- **figma/callback.ts** (13 connections) — `src/routes/api/public/connect/figma/callback.ts`
- **google_docs/callback.ts** (13 connections) — `src/routes/api/public/connect/google_docs/callback.ts`
- **hubspot/callback.ts** (13 connections) — `src/routes/api/public/connect/hubspot/callback.ts`
- **jira/callback.ts** (13 connections) — `src/routes/api/public/connect/jira/callback.ts`
- **linear/callback.ts** (13 connections) — `src/routes/api/public/connect/linear/callback.ts`
- **salesforce/callback.ts** (13 connections) — `src/routes/api/public/connect/salesforce/callback.ts`
- **stripe/callback.ts** (13 connections) — `src/routes/api/public/connect/stripe/callback.ts`
- **zendesk/callback.ts** (13 connections) — `src/routes/api/public/connect/zendesk/callback.ts`
- **notion/callback.ts** (12 connections) — `src/routes/api/public/connect/notion/callback.ts`
- **productboard/callback.ts** (12 connections) — `src/routes/api/public/connect/productboard/callback.ts`
- **slack/callback.ts** (12 connections) — `src/routes/api/public/connect/slack/callback.ts`
- **ConnectionStrip.tsx** (11 connections) — `src/components/engine-room/ConnectionStrip.tsx`
- **gmail/callback.ts** (11 connections) — `src/routes/api/public/connect/gmail/callback.ts`
- **google_calendar/callback.ts** (11 connections) — `src/routes/api/public/connect/google_calendar/callback.ts`
- *... and 93 more nodes in this community*

## Relationships

- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (43 shared connections)
- [Signal Ingestion & Provider Auth](Signal_Ingestion_%26_Provider_Auth.md) (27 shared connections)
- [Connections & Bindings UI](Connections_%26_Bindings_UI.md) (23 shared connections)
- [src/lib - suite-resolve.server.ts](src-lib_-_suite-resolve.server.ts.md) (19 shared connections)
- [src/components - button.tsx](src-components_-_button.tsx.md) (7 shared connections)
- [src/lib - github-ingest.server.ts](src-lib_-_github-ingest.server.ts.md) (6 shared connections)
- [Agent Tool Registry](Agent_Tool_Registry.md) (5 shared connections)
- [src/lib - embed.server.ts](src-lib_-_embed.server.ts.md) (5 shared connections)
- [src/lib - catalog.ts](src-lib_-_catalog.ts.md) (5 shared connections)
- [src/lib - studio.functions.ts](src-lib_-_studio.functions.ts.md) (4 shared connections)
- [Discover & Decide Surfaces](Discover_%26_Decide_Surfaces.md) (3 shared connections)
- [src/lib - studio-rollbacks.ts](src-lib_-_studio-rollbacks.ts.md) (3 shared connections)

## Source Files

- `src/components/connections/ProviderLogo.tsx`
- `src/components/engine-room/ConnectionStrip.tsx`
- `src/lib/ai/tools/registry.server.ts`
- `src/lib/byokeys-vault.server.ts`
- `src/lib/connect-trust.test.ts`
- `src/lib/connect-trust.ts`
- `src/lib/connectors/crypto.server.ts`
- `src/lib/connectors/providers/github.server.ts`
- `src/lib/connectors/providers/pull-ingestors.server.ts`
- `src/lib/connectors/registry.ts`
- `src/lib/onboarding/first-ingest.server.ts`
- `src/routes/api/public/connect/figma/callback.ts`
- `src/routes/api/public/connect/github/callback.ts`
- `src/routes/api/public/connect/gmail/callback.ts`
- `src/routes/api/public/connect/google_calendar/callback.ts`
- `src/routes/api/public/connect/google_docs/callback.ts`
- `src/routes/api/public/connect/google_tasks/callback.ts`
- `src/routes/api/public/connect/hubspot/callback.ts`
- `src/routes/api/public/connect/intercom/callback.ts`
- `src/routes/api/public/connect/jira/callback.ts`

## Audit Trail

- EXTRACTED: 716 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*