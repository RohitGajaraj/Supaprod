# Canny Integration Service

> 135 nodes · cohesion 0.04

## Key Concepts

- **writeSignals()** (35 connections) — `src/lib/sources/sink.server.ts`
- **resolveProviderAuth()** (31 connections) — `src/lib/connectors/resolve.server.ts`
- **sink.server.ts** (29 connections) — `src/lib/sources/sink.server.ts`
- **pull-ingestors.server.ts** (27 connections) — `src/lib/connectors/providers/pull-ingestors.server.ts`
- **index.server.ts** (26 connections) — `src/lib/connectors/providers/index.server.ts`
- **sources/kinds.ts** (25 connections) — `src/lib/sources/kinds.ts`
- **tokenBearer()** (23 connections) — `src/lib/connectors/providers/bearer.server.ts`
- **SignalCandidate** (21 connections) — `src/lib/sources/kinds.ts`
- **productboard-ingest.server.ts** (19 connections) — `src/lib/connectors/providers/productboard-ingest.server.ts`
- **canny-ingest.server.ts** (18 connections) — `src/lib/connectors/providers/canny-ingest.server.ts`
- **intercom-ingest.server.ts** (18 connections) — `src/lib/connectors/providers/intercom-ingest.server.ts`
- **bearer.server.ts** (17 connections) — `src/lib/connectors/providers/bearer.server.ts`
- **hubspot-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/hubspot-ingest.server.ts`
- **salesforce-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/salesforce-ingest.server.ts`
- **slack-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/slack-ingest.server.ts`
- **stripe-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/stripe-ingest.server.ts`
- **zendesk-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/zendesk-ingest.server.ts`
- **gmail-ingest.server.ts** (15 connections) — `src/lib/connectors/providers/gmail-ingest.server.ts`
- **types.server.ts** (15 connections) — `src/lib/connectors/providers/types.server.ts`
- **intercom.server.ts** (13 connections) — `src/lib/connectors/providers/intercom.server.ts`
- **outlook-mail-ingest.server.ts** (13 connections) — `src/lib/connectors/providers/outlook-mail-ingest.server.ts`
- **slack.server.ts** (13 connections) — `src/lib/connectors/providers/slack.server.ts`
- **ConnectorAdapter** (13 connections) — `src/lib/connectors/providers/types.server.ts`
- **canny.server.ts** (10 connections) — `src/lib/connectors/providers/canny.server.ts`
- **productboard.server.ts** (10 connections) — `src/lib/connectors/providers/productboard.server.ts`
- *... and 110 more nodes in this community*

## Relationships

- [Vault and OAuth Connections](Vault_and_OAuth_Connections.md) (40 shared connections)
- [Ingest Guardrails Rate-limiting](Ingest_Guardrails_Rate-limiting.md) (10 shared connections)
- [Slack Digest Notifications](Slack_Digest_Notifications.md) (8 shared connections)
- [GitHub Signal Ingestion](GitHub_Signal_Ingestion.md) (6 shared connections)
- [Artifact Lineage View](Artifact_Lineage_View.md) (6 shared connections)
- [Connection and Auth Management](Connection_and_Auth_Management.md) (5 shared connections)
- [MCP Client Server](MCP_Client_Server.md) (5 shared connections)
- [Autoquery and Diffing](Autoquery_and_Diffing.md) (5 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (4 shared connections)
- [Loop Management System](Loop_Management_System.md) (3 shared connections)
- [Entity Embedding Service](Entity_Embedding_Service.md) (3 shared connections)
- [Builder Mission Dispatch](Builder_Mission_Dispatch.md) (3 shared connections)

## Source Files

- `src/lib/connectors/providers/bearer.server.ts`
- `src/lib/connectors/providers/canny-ingest.server.ts`
- `src/lib/connectors/providers/canny-ingest.test.ts`
- `src/lib/connectors/providers/canny.server.ts`
- `src/lib/connectors/providers/github.server.ts`
- `src/lib/connectors/providers/gmail-ingest.server.ts`
- `src/lib/connectors/providers/hubspot-ingest.server.ts`
- `src/lib/connectors/providers/hubspot-ingest.test.ts`
- `src/lib/connectors/providers/hubspot.server.ts`
- `src/lib/connectors/providers/index.server.ts`
- `src/lib/connectors/providers/intercom-ingest.server.ts`
- `src/lib/connectors/providers/intercom-ingest.test.ts`
- `src/lib/connectors/providers/intercom.server.ts`
- `src/lib/connectors/providers/outlook-mail-ingest.server.ts`
- `src/lib/connectors/providers/productboard-ingest.server.ts`
- `src/lib/connectors/providers/productboard-ingest.test.ts`
- `src/lib/connectors/providers/productboard.server.ts`
- `src/lib/connectors/providers/pull-ingestors.server.ts`
- `src/lib/connectors/providers/salesforce-ingest.server.ts`
- `src/lib/connectors/providers/salesforce-ingest.test.ts`

## Audit Trail

- EXTRACTED: 756 (96%)
- INFERRED: 30 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*