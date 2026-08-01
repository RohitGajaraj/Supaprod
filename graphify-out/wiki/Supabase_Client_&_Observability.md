# Supabase Client & Observability

> 139 nodes · cohesion 0.04

## Key Concepts

- **supabase/client.server.ts** (95 connections) — `src/integrations/supabase/client.server.ts`
- **supabaseAdmin** (89 connections) — `src/integrations/supabase/client.server.ts`
- **observability/index.ts** (53 connections) — `src/lib/observability/index.ts`
- **-_auth.server.ts** (41 connections) — `src/routes/api/public/hooks/-_auth.server.ts`
- **withJobRun()** (39 connections) — `src/lib/observability/jobs.ts`
- **requireHookCaller()** (39 connections) — `src/routes/api/public/hooks/-_auth.server.ts`
- **sense-tick.ts** (25 connections) — `src/routes/api/public/hooks/sense-tick.ts`
- **outcome-tick.ts** (21 connections) — `src/routes/api/public/hooks/outcome-tick.ts`
- **researcher-tick.ts** (20 connections) — `src/routes/api/public/hooks/researcher-tick.ts`
- **house-rules-tick.ts** (18 connections) — `src/routes/api/public/hooks/house-rules-tick.ts`
- **self-improve-tick.ts** (17 connections) — `src/routes/api/public/hooks/self-improve-tick.ts`
- **errors.ts** (16 connections) — `src/lib/observability/errors.ts`
- **derive-tick.ts** (15 connections) — `src/routes/api/public/hooks/derive-tick.ts`
- **credit-tick.ts** (14 connections) — `src/routes/api/public/hooks/credit-tick.ts`
- **eval-tick.ts** (14 connections) — `src/routes/api/public/hooks/eval-tick.ts`
- **cluster-tick.ts** (13 connections) — `src/routes/api/public/hooks/cluster-tick.ts`
- **competitor-tick.ts** (12 connections) — `src/routes/api/public/hooks/competitor-tick.ts`
- **event-reactor-tick.ts** (12 connections) — `src/routes/api/public/hooks/event-reactor-tick.ts`
- **approvals-tick.ts** (11 connections) — `src/routes/api/public/hooks/approvals-tick.ts`
- **fanout-reconcile-tick.ts** (11 connections) — `src/routes/api/public/hooks/fanout-reconcile-tick.ts`
- **goal-tick.ts** (11 connections) — `src/routes/api/public/hooks/goal-tick.ts`
- **loop-tick.ts** (11 connections) — `src/routes/api/public/hooks/loop-tick.ts`
- **prompt-optimize-tick.ts** (11 connections) — `src/routes/api/public/hooks/prompt-optimize-tick.ts`
- **steward-tick.ts** (11 connections) — `src/routes/api/public/hooks/steward-tick.ts`
- **track()** (10 connections) — `src/lib/observability/analytics.ts`
- *... and 114 more nodes in this community*

## Relationships

- [Connectors & Secret Vault](Connectors_%26_Secret_Vault.md) (43 shared connections)
- [Scout & Snapshot Pipeline](Scout_%26_Snapshot_Pipeline.md) (18 shared connections)
- [Stage Events & Cron Ticks](Stage_Events_%26_Cron_Ticks.md) (18 shared connections)
- [src/lib - runtime.server.ts](src-lib_-_runtime.server.ts.md) (14 shared connections)
- [Signal Ingestion & Provider Auth](Signal_Ingestion_%26_Provider_Auth.md) (9 shared connections)
- [src/lib - product-analytics.functions.ts](src-lib_-_product-analytics.functions.ts.md) (8 shared connections)
- [src/lib - resume-runs.ts](src-lib_-_resume-runs.ts.md) (8 shared connections)
- [src/lib - loops.functions.ts](src-lib_-_loops.functions.ts.md) (8 shared connections)
- [src/lib - normalize.ts](src-lib_-_normalize.ts.md) (8 shared connections)
- [src/components - index.tsx](src-components_-_index.tsx.md) (7 shared connections)
- [src/lib - retro-tick.ts](src-lib_-_retro-tick.ts.md) (6 shared connections)
- [src/lib - handoff.server.ts](src-lib_-_handoff.server.ts.md) (5 shared connections)

## Source Files

- `src/integrations/supabase/client.server.ts`
- `src/lib/observability/analytics.ts`
- `src/lib/observability/config.ts`
- `src/lib/observability/errors.test.ts`
- `src/lib/observability/errors.ts`
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
- `src/routes/api/public/hooks/competitor-tick.ts`
- `src/routes/api/public/hooks/credit-tick.ts`
- `src/routes/api/public/hooks/delegate-poll-tick.ts`
- `src/routes/api/public/hooks/derive-tick.ts`

## Audit Trail

- EXTRACTED: 958 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*