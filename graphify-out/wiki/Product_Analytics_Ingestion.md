# Product Analytics Ingestion

> 22 nodes · cohesion 0.13

## Key Concepts

- **product-analytics.functions.ts** (16 connections) — `src/lib/product-analytics.functions.ts`
- **ProductAnalyticsPanel.tsx** (10 connections) — `src/components/product/ProductAnalyticsPanel.tsx`
- **analytics-ingest.server.ts** (8 connections) — `src/lib/analytics-ingest.server.ts`
- **ice-adjust.server.ts** (6 connections) — `src/lib/ice-adjust.server.ts`
- **ingestPostHogAnalytics()** (4 connections) — `src/lib/analytics-ingest.server.ts`
- **ice-adjust.server.test.ts** (4 connections) — `src/lib/ice-adjust.server.test.ts`
- **ProductAnalyticsPanel()** (3 connections) — `src/components/product/ProductAnalyticsPanel.tsx`
- **autoAdjustIce()** (3 connections) — `src/lib/ice-adjust.server.ts`
- **when()** (2 connections) — `src/components/product/ProductAnalyticsPanel.tsx`
- **insertSpikeSignals()** (2 connections) — `src/lib/analytics-ingest.server.ts`
- **autoAdjustIceForOpportunity** (2 connections) — `src/lib/product-analytics.functions.ts`
- **getProductAnalytics** (2 connections) — `src/lib/product-analytics.functions.ts`
- **linkOpportunityEvent** (2 connections) — `src/lib/product-analytics.functions.ts`
- **runAnalyticsIngest** (2 connections) — `src/lib/product-analytics.functions.ts`
- **HogQLResponse** (1 connections) — `src/lib/analytics-ingest.server.ts`
- **IngestResult** (1 connections) — `src/lib/analytics-ingest.server.ts`
- **AdjustResult** (1 connections) — `src/lib/ice-adjust.server.ts`
- **mockAdmin()** (1 connections) — `src/lib/ice-adjust.server.test.ts`
- **mockSupabase()** (1 connections) — `src/lib/ice-adjust.server.test.ts`
- **CohortRow** (1 connections) — `src/lib/product-analytics.functions.ts`
- **IceAdjRow** (1 connections) — `src/lib/product-analytics.functions.ts`
- **ProductAnalyticsData** (1 connections) — `src/lib/product-analytics.functions.ts`

## Relationships

- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (6 shared connections)
- [Artifact Lineage View](Artifact_Lineage_View.md) (2 shared connections)
- [Ingest Guardrails Rate-limiting](Ingest_Guardrails_Rate-limiting.md) (2 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (2 shared connections)
- [Graph Slider Component](Graph_Slider_Component.md) (1 shared connections)
- [Chart and Call Components](Chart_and_Call_Components.md) (1 shared connections)

## Source Files

- `src/components/product/ProductAnalyticsPanel.tsx`
- `src/lib/analytics-ingest.server.ts`
- `src/lib/ice-adjust.server.test.ts`
- `src/lib/ice-adjust.server.ts`
- `src/lib/product-analytics.functions.ts`

## Audit Trail

- EXTRACTED: 74 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*