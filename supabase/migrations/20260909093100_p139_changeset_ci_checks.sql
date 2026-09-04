-- P-139: the release document names the check that passed.
--
-- The first release's document said "No test evidence. Nothing records which
-- tests ran for this release, so this document does not claim any did." at
-- exactly the moment GitHub's own status rollup, read by studio.pr.merge
-- itself right before the merge, held one check -- lint and test, SUCCESS --
-- and the merge gate had already refused to raise over anything else. The
-- evidence existed at the one moment this product was looking straight at
-- it, and nothing wrote it down.
--
-- JSONB, matching build_detail's own reasoning (P-128b): most merges never
-- carry a rollup worth a column of its own, and this is a record OF what
-- GitHub said rather than a thing this product queries on. NULL means "never
-- captured" (every changeset merged before this column existed); an empty
-- `checks` array means "captured, and the rollup was genuinely empty" -- two
-- different facts the release document is not entitled to collapse into one
-- sentence. Shape: {headSha, at, checks: [{name, conclusion}]}.

ALTER TABLE public.studio_changesets
  ADD COLUMN IF NOT EXISTS ci_checks jsonb;

COMMENT ON COLUMN public.studio_changesets.ci_checks IS
  'What GitHub''s status rollup said at studio.pr.merge, pinned at that moment: {headSha, at, checks: [{name, conclusion}]}. headSha is the head the checks ran on -- the PR head, never the merge commit, which does not exist yet when the rollup is read. NULL means never captured (merged before this column existed); an empty checks array means the rollup was genuinely empty (P-139).';

-- Backfill the one live release named in this packet's own Why: track
-- ae547426-aa32-4bcc-a9fc-86fa360211de (Supaprod/relay-homeowner-app PR #5),
-- the account's first merge. 428bb048b5363b672f65d6d6fa08c29ec5b67b48 is the
-- PR HEAD the rollup ran against (corrected 2026-09-04 by A1's own GitHub
-- read: the merge commit did not exist yet at 05:54:36 UTC, so it cannot be
-- the sha a check passed on); the check itself -- "lint and test", SUCCESS at
-- 05:54:36 UTC -- is A2's own live read of GitHub's rollup at the moment
-- this packet was filed.
UPDATE public.studio_changesets
SET ci_checks = jsonb_build_object(
  'headSha', '428bb048b5363b672f65d6d6fa08c29ec5b67b48',
  'at', '2026-09-04T05:54:36Z',
  'checks', jsonb_build_array(
    jsonb_build_object('name', 'lint and test', 'conclusion', 'success')
  )
)
WHERE id = 'ae547426-aa32-4bcc-a9fc-86fa360211de';
