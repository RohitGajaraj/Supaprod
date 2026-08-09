# Vault and OAuth Connections

> 139 nodes · cohesion 0.03

## Key Concepts

- **github.server.ts** (66 connections) — `src/lib/connectors/providers/github.server.ts`
- **connectors/registry.ts** (45 connections) — `src/lib/connectors/registry.ts`
- **resolve.server.ts** (45 connections) — `src/lib/connectors/resolve.server.ts`
- **CONNECTOR_REGISTRY** (33 connections) — `src/lib/connectors/registry.ts`
- **crypto.server.ts** (28 connections) — `src/lib/connectors/crypto.server.ts`
- **encryptSecret()** (26 connections) — `src/lib/connectors/crypto.server.ts`
- **readConnectState()** (22 connections) — `src/lib/connectors/providers/github.server.ts`
- **ProviderId** (22 connections) — `src/lib/connectors/registry.ts`
- **first-ingest.server.ts** (22 connections) — `src/lib/onboarding/first-ingest.server.ts`
- **suite-resolve.server.ts** (19 connections) — `src/lib/connectors/providers/suite-resolve.server.ts`
- **calendar-connections.functions.ts** (18 connections) — `src/lib/calendar-connections.functions.ts`
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
- **oauth-refresh.server.ts** (11 connections) — `src/lib/connectors/oauth-refresh.server.ts`
- *... and 114 more nodes in this community*

## Relationships

- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (45 shared connections)
- [Canny Integration Service](Canny_Integration_Service.md) (40 shared connections)
- [Connection and Auth Management](Connection_and_Auth_Management.md) (19 shared connections)
- [UI Component Library](UI_Component_Library.md) (18 shared connections)
- [Trust and Repo Modals](Trust_and_Repo_Modals.md) (8 shared connections)
- [GitHub Signal Ingestion](GitHub_Signal_Ingestion.md) (8 shared connections)
- [Onboarding and Beliefs](Onboarding_and_Beliefs.md) (6 shared connections)
- [Entity Embedding Service](Entity_Embedding_Service.md) (5 shared connections)
- [Evaluation and Regression Testing](Evaluation_and_Regression_Testing.md) (5 shared connections)
- [Connector Catalog Metadata](Connector_Catalog_Metadata.md) (5 shared connections)
- [Payment and Membership](Payment_and_Membership.md) (4 shared connections)
- [Usage and Billing Metrics](Usage_and_Billing_Metrics.md) (3 shared connections)

## Source Files

- `src/lib/byokeys-vault.server.ts`
- `src/lib/calendar-connections.functions.ts`
- `src/lib/connect-trust.test.ts`
- `src/lib/connect-trust.ts`
- `src/lib/connectors/crypto.server.ts`
- `src/lib/connectors/oauth-refresh.server.ts`
- `src/lib/connectors/providers/github.server.ts`
- `src/lib/connectors/providers/pull-ingestors.server.ts`
- `src/lib/connectors/providers/suite-resolve.server.ts`
- `src/lib/connectors/registry.ts`
- `src/lib/connectors/resolve.server.ts`
- `src/lib/connectors/resolve.test.ts`
- `src/lib/onboarding/first-ingest.server.ts`
- `src/routes/api/public/connect/figma/callback.ts`
- `src/routes/api/public/connect/github/callback.ts`
- `src/routes/api/public/connect/gmail/callback.ts`
- `src/routes/api/public/connect/google_calendar/callback.ts`
- `src/routes/api/public/connect/google_docs/callback.ts`
- `src/routes/api/public/connect/google_tasks/callback.ts`
- `src/routes/api/public/connect/hubspot/callback.ts`

## Audit Trail

- EXTRACTED: 839 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*