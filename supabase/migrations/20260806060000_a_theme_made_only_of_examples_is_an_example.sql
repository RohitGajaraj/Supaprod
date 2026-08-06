-- A THEME MADE ONLY OF EXAMPLES IS AN EXAMPLE, AND NOTHING COULD SAY SO.
--
-- WHAT HAPPENED. Migration 20260805220000 gave `is_sample` to `signals` and to
-- `opportunities`, so a seeded signal and a seeded bet can both say what they
-- are. It did not give it to `themes`, which sit between them: the clusterer
-- reads signals and writes themes, so the twenty seeded signals cluster like any
-- others and the themes they produce carry no mark at all.
--
-- Measured before this ran: 20 sample signals, 257 themes, and 16 of those
-- themes built ENTIRELY from sample signals.
--
-- WHY IT MATTERS MORE THAN THE OTHER TWO. `getFocusNext` is the company brain's
-- recommendation and it now leads the front door. It ranks themes by severity x
-- recency x novelty, takes the top one, spends a model call writing a
-- recommendation about it, and the card above it reads "Ranked against every
-- outcome this workspace has already settled". On a new workspace the only
-- themes that exist are the seeded ones, so the product's single most important
-- claim -- that it learns from YOUR record and guides the next call -- was being
-- demonstrated with invented evidence, in the one place a stranger looks first.
--
-- That is not a labelling nicety. It is the moat claim, made against fiction.
--
-- THE RULE: A THEME IS A SAMPLE ONLY IF EVERY SIGNAL IN IT IS. A theme that has
-- attracted even one real signal is about the user's own product now, whatever
-- it started as -- the clusterer merges into existing themes, so a seeded theme
-- can genuinely grow real evidence. Marking that one as an example would hide a
-- real finding, which is the worse error of the two: the field's own note on
-- `opportunities` says mislabelling a real bet as fiction is worse than leaving
-- one example unmarked, and the same asymmetry holds here.

alter table public.themes
  add column if not exists is_sample boolean not null default false;

comment on column public.themes.is_sample is
  'True when EVERY signal clustered into this theme is a sample. Seeded signals '
  'cluster like any others, so without this the brain ranks themes made of '
  'invented evidence and presents the result as judgment on the user''s own '
  'record. A theme with even one real signal is not a sample: mislabelling real '
  'evidence as fiction is the worse of the two errors.';

-- Backfill: derive from the signals that are already marked.
update public.themes t
set is_sample = true
where exists (select 1 from public.signals s where s.theme_id = t.id and s.is_sample)
  and not exists (select 1 from public.signals s where s.theme_id = t.id and not s.is_sample);

-- The ranking reads themes by workspace and status on every Today load, and now
-- filters on this too. Partial, because the rows that matter are the ones that
-- are NOT samples and that is the overwhelming majority.
create index if not exists themes_live_not_sample_idx
  on public.themes (workspace_id, status)
  where is_sample = false;
