-- prd_scaffolds.source: name the agent as a first-class author of a drawing.
--
-- The CHECK allowed only ('manual','speculative'), which was accurate when it was
-- written: a person asked for a drawing, or the system pre-drew one speculatively
-- while that person reviewed a spec. Both words describe a HUMAN's session.
--
-- As of 2026-08-02 the `design.draft` agent tool writes a real scaffold, so there
-- is a third author and no word for it. Filing an agent's drawing as
-- 'speculative' is not merely imprecise, it is wrong in the one direction that
-- matters: 'speculative' means nobody asked for this yet, and two live surfaces
-- render exactly that claim ("pre-staged while you reviewed"). An unattended
-- design run WAS asked for, by the station that dispatched it, so the copy would
-- have told the user the opposite of what happened.
--
-- Additive only: existing rows keep their word and nothing is rewritten.
ALTER TABLE public.prd_scaffolds DROP CONSTRAINT IF EXISTS prd_scaffolds_source_check;
ALTER TABLE public.prd_scaffolds
  ADD CONSTRAINT prd_scaffolds_source_check
  CHECK (source IN ('manual', 'speculative', 'agent'));
