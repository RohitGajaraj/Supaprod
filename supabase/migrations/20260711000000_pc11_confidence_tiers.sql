-- PC-11: confidence-gated execution, generalized. Adds a shared
-- confidence tier column to the first writer that has a real, cheap
-- self-assessment signal (a playbook proposal's sample size, see
-- src/lib/confidence.ts + learning-compound.server.ts). No column added
-- to prds here: agents only ever CREATE prds today (see the PC-10 row's
-- capture-on-write finding), never revise one, and prd.draft's insert
-- lives in the pinned CHOKEPOINT tool registry this lane cannot edit.

ALTER TABLE playbook_proposals
  ADD COLUMN IF NOT EXISTS confidence TEXT NOT NULL DEFAULT 'medium'
  CHECK (confidence IN ('high', 'medium', 'low'));
