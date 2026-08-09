# Supabase Auth & Analytics

> 148 nodes · cohesion 0.03

## Key Concepts

- **supabase/client.server.ts** (102 connections) — `src/integrations/supabase/client.server.ts`
- **supabaseAdmin** (96 connections) — `src/integrations/supabase/client.server.ts`
- **observability/index.ts** (65 connections) — `src/lib/observability/index.ts`
- **-_auth.server.ts** (44 connections) — `src/routes/api/public/hooks/-_auth.server.ts`
- **withJobRun()** (43 connections) — `src/lib/observability/jobs.ts`
- **requireHookCaller()** (42 connections) — `src/routes/api/public/hooks/-_auth.server.ts`
- **observability.functions.ts** (24 connections) — `src/lib/observability.functions.ts`
- **errors.ts** (23 connections) — `src/lib/observability/errors.ts`
- **outcome-tick.ts** (21 connections) — `src/routes/api/public/hooks/outcome-tick.ts`
- **researcher-tick.ts** (20 connections) — `src/routes/api/public/hooks/researcher-tick.ts`
- **cluster-tick.ts** (19 connections) — `src/routes/api/public/hooks/cluster-tick.ts`
- **recordErrorEvent()** (15 connections) — `src/lib/observability/errors.ts`
- **derive-tick.ts** (15 connections) — `src/routes/api/public/hooks/derive-tick.ts`
- **auth.functions.ts** (14 connections) — `src/lib/observability/auth.functions.ts`
- **eval-tick.ts** (14 connections) — `src/routes/api/public/hooks/eval-tick.ts`
- **track()** (13 connections) — `src/lib/observability/analytics.ts`
- **gates.ts** (13 connections) — `src/lib/observability/gates.ts`
- **fanout-reconcile-tick.ts** (13 connections) — `src/routes/api/public/hooks/fanout-reconcile-tick.ts`
- **liveness-tick.ts** (13 connections) — `src/routes/api/public/hooks/liveness-tick.ts`
- **competitor-tick.ts** (12 connections) — `src/routes/api/public/hooks/competitor-tick.ts`
- **event-reactor-tick.ts** (12 connections) — `src/routes/api/public/hooks/event-reactor-tick.ts`
- **track-tick.ts** (12 connections) — `src/routes/api/public/hooks/track-tick.ts`
- **analytics.ts** (11 connections) — `src/lib/observability/analytics.ts`
- **readObservabilityConfig()** (11 connections) — `src/lib/observability/config.ts`
- **jobs.ts** (11 connections) — `src/lib/observability/jobs.ts`
- *... and 123 more nodes in this community*

## Relationships

- [Vault and OAuth Connections](Vault_and_OAuth_Connections.md) (45 shared connections)
- [Model Cache Management](Model_Cache_Management.md) (20 shared connections)
- [Autoquery and Diffing](Autoquery_and_Diffing.md) (18 shared connections)
- [Entity Embedding Service](Entity_Embedding_Service.md) (15 shared connections)
- [Credit Attribution and Billing](Credit_Attribution_and_Billing.md) (8 shared connections)
- [Workspace Rule Distillation](Workspace_Rule_Distillation.md) (8 shared connections)
- [Mission Gate Classification](Mission_Gate_Classification.md) (8 shared connections)
- [Ingest Guardrails Rate-limiting](Ingest_Guardrails_Rate-limiting.md) (8 shared connections)
- [Changeset Deployment to Production](Changeset_Deployment_to_Production.md) (7 shared connections)
- [Product Analytics Ingestion](Product_Analytics_Ingestion.md) (6 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (6 shared connections)
- [Landing Page Components](Landing_Page_Components.md) (6 shared connections)

## Source Files

- `src/integrations/supabase/client.server.ts`
- `src/lib/observability.functions.ts`
- `src/lib/observability/analytics.ts`
- `src/lib/observability/auth.functions.ts`
- `src/lib/observability/config.ts`
- `src/lib/observability/errors.test.ts`
- `src/lib/observability/errors.ts`
- `src/lib/observability/gates.test.ts`
- `src/lib/observability/gates.ts`
- `src/lib/observability/index.ts`
- `src/lib/observability/jobs.ts`
- `src/lib/observability/uptime.ts`
- `src/lib/routines.server.ts`
- `src/routes/api/public/hooks/-_auth.server.ts`
- `src/routes/api/public/hooks/-eval-tick.test.ts`
- `src/routes/api/public/hooks/admin-expiry-tick.ts`
- `src/routes/api/public/hooks/approvals-tick.ts`
- `src/routes/api/public/hooks/assumption-watch-tick.ts`
- `src/routes/api/public/hooks/calibrate-tick.ts`
- `src/routes/api/public/hooks/cluster-tick.ts`

## Audit Trail

- EXTRACTED: 1056 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*