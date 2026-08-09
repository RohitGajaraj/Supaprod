# Insight Classification and Throttling

> 27 nodes · cohesion 0.15

## Key Concepts

- **push-insights.ts** (21 connections) — `src/lib/brain/push-insights.ts`
- **push-insights.server.ts** (17 connections) — `src/lib/brain/push-insights.server.ts`
- **push-insights.test.ts** (14 connections) — `src/lib/brain/push-insights.test.ts`
- **outcomeSupportFromCounts()** (8 connections) — `src/components/discover/ranking.ts`
- **classifyPushCandidates()** (7 connections) — `src/lib/brain/push-insights.ts`
- **runInsightPush()** (7 connections) — `src/lib/brain/push-insights.server.ts`
- **detectBetContradictions()** (6 connections) — `src/lib/brain/push-insights.ts`
- **detectCalibrationMisses()** (5 connections) — `src/lib/brain/push-insights.ts`
- **applyPushThrottle()** (4 connections) — `src/lib/brain/push-insights.ts`
- **detectGroundShifts()** (4 connections) — `src/lib/brain/push-insights.ts`
- **truncate()** (4 connections) — `src/lib/brain/push-insights.ts`
- **CalibrationMissInput** (3 connections) — `src/lib/brain/push-insights.ts`
- **DAILY_PUSH_CAP** (3 connections) — `src/lib/brain/push-insights.ts`
- **LearningInput** (3 connections) — `src/lib/brain/push-insights.ts`
- **NEGATIVE_VERDICTS** (3 connections) — `src/lib/brain/push-insights.ts`
- **parseMs()** (3 connections) — `src/lib/brain/push-insights.ts`
- **LiveDecisionInput** (2 connections) — `src/lib/brain/push-insights.ts`
- **PushCandidate** (2 connections) — `src/lib/brain/push-insights.ts`
- **BestBetInput** (1 connections) — `src/lib/brain/push-insights.ts`
- **ClassifyInput** (1 connections) — `src/lib/brain/push-insights.ts`
- **PushAction** (1 connections) — `src/lib/brain/push-insights.ts`
- **PushActionKind** (1 connections) — `src/lib/brain/push-insights.ts`
- **PushKind** (1 connections) — `src/lib/brain/push-insights.ts`
- **DecisionRow** (1 connections) — `src/lib/brain/push-insights.server.ts`
- **decision()** (1 connections) — `src/lib/brain/push-insights.test.ts`
- *... and 2 more nodes in this community*

## Relationships

- [Opportunity Ranking and Verdicts](Opportunity_Ranking_and_Verdicts.md) (6 shared connections)
- [Brain Analysis Logic](Brain_Analysis_Logic.md) (5 shared connections)
- [Artifact Lineage View](Artifact_Lineage_View.md) (2 shared connections)
- [Public Decision Sharing](Public_Decision_Sharing.md) (2 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (2 shared connections)
- [Compounding and Learning Panels](Compounding_and_Learning_Panels.md) (1 shared connections)
- [Outcome Settlement Review](Outcome_Settlement_Review.md) (1 shared connections)

## Source Files

- `src/components/discover/ranking.ts`
- `src/lib/brain/push-insights.server.ts`
- `src/lib/brain/push-insights.test.ts`
- `src/lib/brain/push-insights.ts`

## Audit Trail

- EXTRACTED: 125 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*