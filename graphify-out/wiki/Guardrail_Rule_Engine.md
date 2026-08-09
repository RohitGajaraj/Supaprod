# Guardrail Rule Engine

> 20 nodes · cohesion 0.18

## Key Concepts

- **guardrails.server.ts** (11 connections) — `src/lib/ai/guardrails.server.ts`
- **Egress Secret Guard** (11 connections) — `src/lib/egress_guardrails.ts`
- **evaluateGuardrails()** (10 connections) — `src/lib/ai/guardrails.server.ts`
- **guardrail-floor.ts** (8 connections) — `src/lib/ai/guardrail-floor.ts`
- **GuardrailRule** (7 connections) — `src/lib/ai/guardrails.server.ts`
- **guardrail-floor.test.ts** (6 connections) — `src/lib/ai/guardrail-floor.test.ts`
- **guardrails.server.test.ts** (5 connections) — `src/lib/ai/guardrails.server.test.ts`
- **scanEgressForSecrets()** (5 connections) — `src/lib/egress-guardrails.ts`
- **withFloor()** (4 connections) — `src/lib/ai/guardrail-floor.ts`
- **describeEgressSecrets()** (4 connections) — `src/lib/egress-guardrails.ts`
- **egress-guardrails.test.ts** (4 connections) — `src/lib/egress-guardrails.test.ts`
- **GUARDRAIL_FLOOR** (3 connections) — `src/lib/ai/guardrail-floor.ts`
- **GuardrailResult** (2 connections) — `src/lib/ai/guardrails.server.ts`
- **safeRegex()** (2 connections) — `src/lib/ai/guardrails.server.ts`
- **EGRESS_SECRET_RULES** (2 connections) — `src/lib/egress-guardrails.ts`
- **floorRule()** (1 connections) — `src/lib/ai/guardrail-floor.ts`
- **GuardrailHit** (1 connections) — `src/lib/ai/guardrails.server.ts`
- **rule()** (1 connections) — `src/lib/ai/guardrails.server.test.ts`
- **EgressSecretScan** (1 connections) — `src/lib/egress-guardrails.ts`
- **secretRule()** (1 connections) — `src/lib/egress-guardrails.ts`

## Relationships

- [Model Cache Management](Model_Cache_Management.md) (8 shared connections)
- [Guardrail Workspace Permissions](Guardrail_Workspace_Permissions.md) (5 shared connections)
- [Announcement Management System](Announcement_Management_System.md) (3 shared connections)
- [Opportunity Sharing and Permissions](Opportunity_Sharing_and_Permissions.md) (3 shared connections)

## Source Files

- `src/lib/ai/guardrail-floor.test.ts`
- `src/lib/ai/guardrail-floor.ts`
- `src/lib/ai/guardrails.server.test.ts`
- `src/lib/ai/guardrails.server.ts`
- `src/lib/egress-guardrails.test.ts`
- `src/lib/egress-guardrails.ts`
- `src/lib/egress_guardrails.ts`

## Audit Trail

- EXTRACTED: 89 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*