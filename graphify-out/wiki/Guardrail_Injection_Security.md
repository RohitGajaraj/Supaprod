# Guardrail Injection Security

> 39 nodes · cohesion 0.10

## Key Concepts

- **Injection Classifier** (31 connections) — `src/lib/injection_classifier.ts`
- **guardrails-injection.server.ts** (16 connections) — `src/lib/ai/guardrails-injection.server.ts`
- **assessAndQuarantine()** (16 connections) — `src/lib/injection-classifier.ts`
- **retriever.server.ts** (15 connections) — `src/lib/rag/retriever.server.ts`
- **classifyInjection()** (11 connections) — `src/lib/injection-classifier.ts`
- **guardrails-injection.functions.ts** (10 connections) — `src/lib/guardrails-injection.functions.ts`
- **quarantineUntrusted()** (9 connections) — `src/lib/ai/guardrails-injection.server.ts`
- **assessCorpusInjection()** (9 connections) — `src/lib/injection-classifier.ts`
- **quarantineUntrustedCorpus()** (8 connections) — `src/lib/ai/guardrails-injection.server.ts`
- **injection-classifier.test.ts** (7 connections) — `src/lib/injection-classifier.test.ts`
- **formatContextBlock()** (6 connections) — `src/lib/rag/retriever.server.ts`
- **guardrails-injection.server.test.ts** (5 connections) — `src/lib/ai/guardrails-injection.server.test.ts`
- **quarantineText()** (5 connections) — `src/lib/injection-classifier.ts`
- **FLAG_THRESHOLD** (3 connections) — `src/lib/injection-classifier.ts`
- **InjectionVerdict** (3 connections) — `src/lib/injection-classifier.ts`
- **QUARANTINE_THRESHOLD** (3 connections) — `src/lib/injection-classifier.ts`
- **STRUCTURAL_SIGNALS** (3 connections) — `src/lib/injection-classifier.ts`
- **RetrievedChunk** (3 connections) — `src/lib/rag/retriever.server.ts`
- **CorpusUntrustedAssessment** (2 connections) — `src/lib/ai/guardrails-injection.server.ts`
- **UntrustedAssessment** (2 connections) — `src/lib/ai/guardrails-injection.server.ts`
- **assessInjectionSample** (2 connections) — `src/lib/guardrails-injection.functions.ts`
- **InjectionSampleResult** (2 connections) — `src/lib/guardrails-injection.functions.ts`
- **coerce()** (2 connections) — `src/lib/injection-classifier.ts`
- **normalizeForScan()** (2 connections) — `src/lib/injection-classifier.ts`
- **severityFor()** (2 connections) — `src/lib/injection-classifier.ts`
- *... and 14 more nodes in this community*

## Relationships

- [Model Cache Management](Model_Cache_Management.md) (6 shared connections)
- [Nightly Retro Digest Generation](Nightly_Retro_Digest_Generation.md) (5 shared connections)
- [Teardown Receipt UI](Teardown_Receipt_UI.md) (3 shared connections)
- [Mission Creation and Dispatch](Mission_Creation_and_Dispatch.md) (3 shared connections)
- [Budgets and Alerts Panel](Budgets_and_Alerts_Panel.md) (3 shared connections)
- [Design Memory Panel](Design_Memory_Panel.md) (3 shared connections)
- [Ingest Guardrails Rate-limiting](Ingest_Guardrails_Rate-limiting.md) (3 shared connections)
- [Prompt Optimization Logic](Prompt_Optimization_Logic.md) (3 shared connections)
- [Self-Improvement Panel](Self-Improvement_Panel.md) (3 shared connections)
- [Draft Request Provider](Draft_Request_Provider.md) (3 shared connections)
- [Workspace Rule Distillation](Workspace_Rule_Distillation.md) (3 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (2 shared connections)

## Source Files

- `src/lib/ai/guardrails-injection.server.test.ts`
- `src/lib/ai/guardrails-injection.server.ts`
- `src/lib/guardrails-injection.functions.ts`
- `src/lib/injection-classifier.test.ts`
- `src/lib/injection-classifier.ts`
- `src/lib/injection_classifier.ts`
- `src/lib/rag/retriever.server.ts`

## Audit Trail

- EXTRACTED: 191 (99%)
- INFERRED: 2 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*