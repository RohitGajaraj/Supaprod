# Evaluation Runner Suite

> 6 nodes · cohesion 0.47

## Key Concepts

- **eval-runner.server.ts** (9 connections) — `src/lib/ai/eval-runner.server.ts`
- **runEvalSuite()** (6 connections) — `src/lib/ai/eval-runner.server.ts`
- **buildJudgePrompt()** (2 connections) — `src/lib/ai/eval-runner.server.ts`
- **parseJudge()** (2 connections) — `src/lib/ai/eval-runner.server.ts`
- **Case** (1 connections) — `src/lib/ai/eval-runner.server.ts`
- **Suite** (1 connections) — `src/lib/ai/eval-runner.server.ts`

## Relationships

- [Model Cache Management](Model_Cache_Management.md) (3 shared connections)
- [Eval Calibration Coverage](Eval_Calibration_Coverage.md) (2 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (2 shared connections)

## Source Files

- `src/lib/ai/eval-runner.server.ts`

## Audit Trail

- EXTRACTED: 21 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*