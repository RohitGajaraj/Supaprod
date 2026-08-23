REQ-012: the exhibited-component verdicts, measured per the REQ-008 bar

A full census of M14 item 5's eleven names ran tonight, read-only, with
consumer counts, job statements, near-miss consumer hunts and git-history
checks behind every verdict below. Two headlines first, because they
correct the memo itself:

M14 CORRECTIONS. Flowchart is NOT gallery-only: it is imported by
meridian/RunMap.tsx:6 and reaches production through PlanGate.tsx:287 ->
AskPlanGate -> AskTurn.tsx:401 - a user hitting a plan gate in Ask renders
one today. run-rows is NOT "used nowhere at all": five in-tree consumers
including AgentInbox on the front door and ToolStream on run detail.
CriticBrief no longer lives in components/today/ at all; it is defined and
mounted inline in the today route (:1219-1228) off real onboarding state.
STATUS.md repeats the run-rows claim and needs the same correction.

THE SIX DELETIONS, each measured dead per REQ-008's bar (no producer, no
near-miss consumer, no named planned surface):

1. Chat - the Q&A-transcript job exists but AskTurn owns it under an
   explicit anti-bubble ruling recorded in its own header (AskTurn.tsx:22-
   24). Chat's form was considered and rejected.
2. DiffTable - no producer of row-level data proposals exists anywhere;
   build diffs go through Monaco CodeDiff, supersession through prose.
3. FineTuneCard - no surface presents agent-proposed numbers for per-field
   override. Reservation recorded: if the founder wants the interaction
   model kept for the first such surface, PARK works with that condition.
4. PromptBar - both live composers (AskPane, AskComposer) were built or
   ruled AFTER it existed and deliberately declined its feature set;
   registry copilot/audio entries are verbs on the existing composer.
5. RecommendationCard - DecisionQueue chose meterless gates, Discover chose
   chips-in-rows; the Approve semantics it reserves are already owned by
   Gate/Approve.
6. SelectionActions - its one natural job was consciously re-housed as
   BulkBar with the ruling recorded in the ledger (claude-log.md:6087).

THE TWO PARKS, conditions written:

- InsightCards - real future job (outcome-labelled trends over customer
  history, the moat narrative), blocked on a backend producing Insight
  objects; seam named: brain-insights.functions.ts feeding PushedInsights'
  slot. Deletes cleanly instead if held to strict registry standards.
- PromotionCard - scope-gate job named in its own header, blocked on a
  product_id column neither agent_memory nor learnings carries; adjacent
  surface when it lands: Brain beside MemoryReviewQueue.

All ten files sit in meridian/, your hand. If you rule the deletions, say
the word and I will take them as a mechanical pass with the gallery Cases
pruned in the same commit - or take them yourself alongside STATUS.md's
correction; either hand closes it.
