-- A theme stopped, and the record never said why.
--
-- MEASURED ON PRODUCTION, 2026-08-10. There are 87 real themes, excluding the
-- seven seeded "Helio Labs" demo workspaces whose ids match
-- '_0000000-0000-4000-8000-000000000000'. 48 of those sit at status 'new',
-- never triaged at all, and ZERO real themes have ever been dismissed or
-- merged.
--
-- The tempting reading of those numbers is that promotion is too rare and the
-- fix is to promote more. It is not. Promotion is DELIBERATELY the rare case:
-- the model for this station is Sentry's issue stream crossed with Linear's
-- triage inbox, where the operator spends nearly all their time saying "not a
-- pattern" or "same as that one", and only occasionally "make this a bet". A
-- theme that never promotes may be perfectly correctly declined.
--
-- What makes it a defect is that a decline left no sentence behind:
--
--   * themes.status              said WHAT it became   ('dismissed' / 'merged')
--   * themes.dismissed_at_frequency  said HOW BIG it was when it stopped
--   * stage_events               said WHEN, and BY WHOM
--   * nothing at all             said WHY
--
-- So the one thing the brain is supposed to hand back the next time the same
-- complaint forms -- "we looked at this in April and decided it was one loud
-- account, not a pattern" -- could not be handed back, because nobody had ever
-- written it down. A decline was an event. It was never a decision.
--
-- THE SERVER HAS BEEN ACCEPTING THIS SENTENCE AND DISCARDING IT SINCE THE VERB
-- SHIPPED. `setThemeStatus` (src/lib/discovery.functions.ts) has carried
-- `reason: z.string().max(400).optional()` in its input validator since commit
-- 771c2606 and no handler ever read it: a caller could post a carefully worded
-- decline, and the server would parse it, bound it, and drop it on the floor.
-- That is worse than never accepting it, because the surface above cannot tell
-- a stored note from a discarded one.
--
-- WHY A COLUMN ON `themes` RATHER THAN ONLY AN EVENT ROW. Both, in fact, and
-- they answer different questions. `human_gate_events` gets the append-only
-- history (every decline ever made, including ones later withdrawn) because
-- that is what the correction-rate flywheel and the brain read back.
-- `themes.status_reason` holds the judgment that CURRENTLY stands, on the row
-- the ranking already loads, so showing "you declined this, and here is what
-- you said" costs no extra query and cannot drift out of sync with the status
-- it explains. It is written on the way down and CLEARED on the way back to
-- 'new', for the same reason `dismissed_at_frequency` is: a stale sentence left
-- on an un-declined cluster is the record asserting a judgment the operator has
-- since withdrawn.
--
-- DELIBERATELY NOT IN THIS MIGRATION: a CHECK constraint on `themes.status`.
-- The column has never had one, and it currently holds two vocabularies at
-- once -- the triage enum writes new/dismissed/merged/promoted, while real rows
-- also carry active/at_risk/confirmed/investigating from earlier surfaces. Any
-- CHECK narrow enough to be useful would reject rows that already exist, and
-- reconciling those two vocabularies is a separate decision with its own
-- reader-by-reader audit. Widening the record is safe; narrowing it here would
-- not be.
--
-- ADDITIVE AND SAFE: nullable, no default, no backfill, no row rewritten. Every
-- existing theme keeps a NULL here, which is the honest value -- those declines
-- genuinely did not record a reason and this migration must not invent one.

alter table public.themes
  add column if not exists status_reason text;

-- The bound matches THEME_STATUS_REASON_MAX in src/lib/discovery.functions.ts,
-- which is what the input validator clamps to. Kept in both places so the
-- database and the validator agree on where the boundary is, rather than the
-- database rejecting a string zod had just accepted. 400 chars is a sentence or
-- two: this is a note on a judgment, not a document, and a field that invites an
-- essay gets left empty.
alter table public.themes
  drop constraint if exists themes_status_reason_len_check;

alter table public.themes
  add constraint themes_status_reason_len_check
  check (status_reason is null or char_length(status_reason) <= 400);

comment on column public.themes.status_reason is
  'Why this cluster stopped: the operator''s own words when they declined it ("not a pattern") or merged it into an existing bet ("same as that one"). Written on the way down, cleared on the way back to ''new'', so it always explains the status currently on the row. Added 2026-08-10: before it, a decline recorded what happened, how big the cluster was, when, and by whom, but nothing recorded why -- so a dismissed cluster could not be handed back as prior judgment when the same complaint returned louder. The append-only history of every such call, including withdrawn ones, is in human_gate_events (subject_type = ''theme'').';
