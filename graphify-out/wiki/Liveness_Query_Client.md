# Liveness Query Client

> 19 nodes · cohesion 0.16

## Key Concepts

- **ProbeQuery** (11 connections) — `src/lib/liveness/probe.ts`
- **probe.test.ts** (11 connections) — `src/lib/liveness/probe.test.ts`
- **readProbe()** (10 connections) — `src/lib/liveness/probe.ts`
- **applyFilters()** (8 connections) — `src/lib/liveness/probe.ts`
- **LivenessClient** (7 connections) — `src/lib/liveness/probe.ts`
- **.from()** (3 connections) — `src/lib/liveness/probe.ts`
- **ProbeResult** (3 connections) — `src/lib/liveness/probe.ts`
- **resolveProbe()** (3 connections) — `src/lib/liveness/probe.ts`
- **.eq()** (2 connections) — `src/lib/liveness/probe.ts`
- **.gte()** (2 connections) — `src/lib/liveness/probe.ts`
- **.in()** (2 connections) — `src/lib/liveness/probe.ts`
- **.is()** (2 connections) — `src/lib/liveness/probe.ts`
- **.limit()** (2 connections) — `src/lib/liveness/probe.ts`
- **.neq()** (2 connections) — `src/lib/liveness/probe.ts`
- **.not()** (2 connections) — `src/lib/liveness/probe.ts`
- **.order()** (2 connections) — `src/lib/liveness/probe.ts`
- **fakeClient()** (1 connections) — `src/lib/liveness/probe.test.ts`
- **from()** (1 connections) — `src/lib/liveness/probe.test.ts`
- **Recorded** (1 connections) — `src/lib/liveness/probe.test.ts`

## Relationships

- [Integrity Probe Registry](Integrity_Probe_Registry.md) (7 shared connections)
- [Capability Evaluation Framework](Capability_Evaluation_Framework.md) (7 shared connections)
- [Capability Integrity Testing](Capability_Integrity_Testing.md) (3 shared connections)
- [Liveness Reporting Functions](Liveness_Reporting_Functions.md) (1 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (1 shared connections)

## Source Files

- `src/lib/liveness/probe.test.ts`
- `src/lib/liveness/probe.ts`

## Audit Trail

- EXTRACTED: 75 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*