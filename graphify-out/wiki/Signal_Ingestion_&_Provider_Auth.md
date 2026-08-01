# Signal Ingestion & Provider Auth

> 150 nodes · cohesion 0.03

## Key Concepts

- **resolve.server.ts** (45 connections) — `src/lib/connectors/resolve.server.ts`
- **writeSignals()** (32 connections) — `src/lib/sources/sink.server.ts`
- **resolveProviderAuth()** (30 connections) — `src/lib/connectors/resolve.server.ts`
- **pull-ingestors.server.ts** (27 connections) — `src/lib/connectors/providers/pull-ingestors.server.ts`
- **index.server.ts** (26 connections) — `src/lib/connectors/providers/index.server.ts`
- **sink.server.ts** (26 connections) — `src/lib/sources/sink.server.ts`
- **tokenBearer()** (23 connections) — `src/lib/connectors/providers/bearer.server.ts`
- **slack-digest.server.ts** (23 connections) — `src/lib/connectors/slack-digest.server.ts`
- **sources/kinds.ts** (23 connections) — `src/lib/sources/kinds.ts`
- **productboard-ingest.server.ts** (19 connections) — `src/lib/connectors/providers/productboard-ingest.server.ts`
- **emit.server.ts** (19 connections) — `src/lib/scout/emit.server.ts`
- **SignalCandidate** (19 connections) — `src/lib/sources/kinds.ts`
- **canny-ingest.server.ts** (18 connections) — `src/lib/connectors/providers/canny-ingest.server.ts`
- **intercom-ingest.server.ts** (18 connections) — `src/lib/connectors/providers/intercom-ingest.server.ts`
- **bearer.server.ts** (17 connections) — `src/lib/connectors/providers/bearer.server.ts`
- **hubspot-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/hubspot-ingest.server.ts`
- **salesforce-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/salesforce-ingest.server.ts`
- **slack-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/slack-ingest.server.ts`
- **stripe-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/stripe-ingest.server.ts`
- **zendesk-ingest.server.ts** (17 connections) — `src/lib/connectors/providers/zendesk-ingest.server.ts`
- **types.server.ts** (15 connections) — `src/lib/connectors/providers/types.server.ts`
- **intercom.server.ts** (13 connections) — `src/lib/connectors/providers/intercom.server.ts`
- **outlook-mail-ingest.server.ts** (13 connections) — `src/lib/connectors/providers/outlook-mail-ingest.server.ts`
- **slack.server.ts** (13 connections) — `src/lib/connectors/providers/slack.server.ts`
- **ConnectorAdapter** (13 connections) — `src/lib/connectors/providers/types.server.ts`
- *... and 125 more nodes in this community*

## Relationships

- [Connectors & Secret Vault](Connectors_%26_Secret_Vault.md) (27 shared connections)
- [src/lib - suite-resolve.server.ts](src-lib_-_suite-resolve.server.ts.md) (16 shared connections)
- [Scout & Snapshot Pipeline](Scout_%26_Snapshot_Pipeline.md) (12 shared connections)
- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (9 shared connections)
- [src/lib - stakeholder-pack.functions.ts](src-lib_-_stakeholder-pack.functions.ts.md) (8 shared connections)
- [src/lib - ingest.server.ts](src-lib_-_ingest.server.ts.md) (7 shared connections)
- [src/lib - prepare.ts](src-lib_-_prepare.ts.md) (7 shared connections)
- [src/lib - stakeholder-update.functions.ts](src-lib_-_stakeholder-update.functions.ts.md) (6 shared connections)
- [src/lib - github-ingest.server.ts](src-lib_-_github-ingest.server.ts.md) (5 shared connections)
- [Connections & Bindings UI](Connections_%26_Bindings_UI.md) (4 shared connections)
- [src/lib - entitlements.ts](src-lib_-_entitlements.ts.md) (4 shared connections)
- [src/lib - product-binding.functions.ts](src-lib_-_product-binding.functions.ts.md) (3 shared connections)

## Source Files

- `src/lib/connectors/providers/bearer.server.ts`
- `src/lib/connectors/providers/canny-ingest.server.ts`
- `src/lib/connectors/providers/canny-ingest.test.ts`
- `src/lib/connectors/providers/canny.server.ts`
- `src/lib/connectors/providers/github.server.ts`
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
- `src/lib/connectors/providers/salesforce.server.ts`

## Audit Trail

- EXTRACTED: 860 (97%)
- INFERRED: 29 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*