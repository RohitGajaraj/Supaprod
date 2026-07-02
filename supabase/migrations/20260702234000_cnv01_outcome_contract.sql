-- CNV-01: the Outcome Contract type, as a dual projection alongside the
-- existing narrative PRD. `body_md` stays the human-facing markdown (Editor/
-- Preview, RAG citation targets, GitHub issue export are all unchanged);
-- `contract` is the typed machine view an agent can consume directly instead
-- of re-parsing prose. Backward compatible: every existing PRD defaults to
-- '{}' (no contract yet) and the UI treats an empty `intent` as "not
-- structured", so nothing that reads `prds` today is affected.
--
-- Clauses (success_metrics / non_goals) are individually supersedable: an
-- edit never overwrites a clause in place, it marks the prior clause
-- superseded and appends the replacement (see supersedeContractClause in
-- discovery.functions.ts), the same standing/superseded idiom FS-02 already
-- uses for `assumptions.status` rather than a new graph-walk mechanism -
-- clause-level history does not need the full decision-supersession graph.

ALTER TABLE public.prds
  ADD COLUMN IF NOT EXISTS contract jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contract_migrated_at timestamptz;
