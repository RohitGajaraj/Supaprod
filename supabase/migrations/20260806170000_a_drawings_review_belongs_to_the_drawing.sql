-- A DRAWING'S REVIEW BELONGS TO THE DRAWING.
--
-- The Critic's design lens runs on a scaffold's markup (runScaffoldDesignCritic,
-- src/lib/design-scaffold.functions.ts) and its ruling had nowhere of its own to
-- live, so it was being written into `prds.critic_review` under a
-- `scaffold_design` key. That column is the SPEC red-team's, and it is read
-- WHOLE by five surfaces: CriticBadge on /plan/spec/$id treats any truthy value
-- as "the Critic has ruled" -- it removes the "Ask the Critic" button and then
-- reads `review.risks.length`, a TypeError on an object that only ever carried a
-- drawing's findings -- /ask prints "The Critic says {verdict}. {summary}", and
-- the approvals queue builds its evidence line from it.
--
-- Measured 2026-08-06 against production: 81 specs, 77 with `critic_review IS
-- NULL`, and all 4 specs that have a `prd_scaffolds` row are among those 77. So
-- the first "Ask the Critic" click on /design would have broken that same spec's
-- page. `prd_scaffolds` is one row per spec, overwritten in place by a redraw,
-- which is also what lets the app tell a ruling about the CURRENT drawing from a
-- ruling about markup that no longer exists: `reviewed_at` against `updated_at`,
-- now on the same row.
--
-- Additive and idempotent. The column is nullable with no default, so every
-- existing row reads as "no ruling on file", which is true of all four of them.

alter table public.prd_scaffolds
  add column if not exists critic_review jsonb;

comment on column public.prd_scaffolds.critic_review is
  'The Critic design lens ruling on THIS markup: {verdict, findings, reviewed_at}. Stored flat -- the column belongs to the drawing and shares with nobody. A ruling whose reviewed_at predates this row''s updated_at is about markup that no longer exists and is dropped on read.';

-- REPAIR, and it is a move rather than a delete. Any ruling an earlier build
-- filed under `prds.critic_review -> 'scaffold_design'` is lifted onto the
-- drawing it was always about, and only then taken out of the spec's column.
-- Ordered so a failure between the two leaves the ruling duplicated rather than
-- lost. Expected to touch 0 rows today; written because it must not depend on
-- that staying true between now and whenever this is applied.
--
-- `jsonb_exists(col, key)` AND NOT `col ? key`. They are the same test; only the
-- spelling differs. A bare `?` is a bind-parameter placeholder to several
-- Postgres drivers, so the `?` spelling is the one that can turn "apply this
-- migration" into an argument with whatever tool is applying it. The function
-- spelling cannot be misread by anything.

update public.prd_scaffolds s
set critic_review = p.critic_review -> 'scaffold_design'
from public.prds p
where p.id = s.prd_id
  and jsonb_exists(p.critic_review, 'scaffold_design')
  and s.critic_review is null;

-- Then out of the spec's column. A column whose only remaining content was the
-- drawing's key goes back to NULL rather than to `{}`: CriticBadge branches on
-- truthiness, and `{}` is truthy, so `{}` would leave the "Ask the Critic"
-- button deleted by a data side-effect -- the exact loss this migration exists
-- to undo. `verdict` is the key every real runCritic write sets.

update public.prds
set critic_review = case
      when jsonb_exists(critic_review - 'scaffold_design', 'verdict')
        then critic_review - 'scaffold_design'
      else null
    end
where jsonb_exists(critic_review, 'scaffold_design');
