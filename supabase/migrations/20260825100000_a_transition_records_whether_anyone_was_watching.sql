-- F-55 / queue 63. Nothing on the record distinguished an unattended run from a
-- hand-driven one — which is acceptance criterion 2 in its entirety.
--
-- `driveTrackOnce` hardcoded `actor: 'system'` on the stage event and did not
-- know its own caller. Its two callers are the sweep (`track-tick`, service
-- role, nobody watching) and `driveTrackNow` (a person pressing a control).
-- Both wrote the identical row.
--
-- HOW IT WAS FOUND: by making the mistake. On 2026-08-25 at 09:32 a session
-- wrote up track `48eee889`'s Build walk as unattended — "no human touched the
-- run" — on the strength of `SELECT from_stage, to_stage, actor, at FROM
-- stage_events`, every row of which reads `actor: system`. Another session had
-- driven it by hand on the watched path. The query was correct and answered a
-- neighbouring question.
--
-- Third time in a week that a column which NEARLY answers the question was read
-- as though it did: `driven_at` in the wrong timezone (X-07), `station` as a
-- record of a journey (X-08), and `actor` as a record of attendance.
--
-- WHY NOT `actor`. Production holds agent slugs, 'system' and 'human' across
-- 2,000+ rows with many readers; it answers WHO DID THIS, not WAS ANYONE THERE.
-- Overloading it would have made every existing reader subtly wrong.
--
-- NO BACKFILL, DELIBERATELY. Every historic row honestly does not know, and
-- writing 'sweep' across them would fabricate exactly the evidence criterion 2
-- turns on. NULL means "recorded before this column existed" and must stay
-- readable as that, so a query proving autonomy has to say `driven_via = 'sweep'`
-- and can never be satisfied by a row that predates the question.
--
-- Nullable for the same reason, rather than NOT NULL DEFAULT 'sweep': a default
-- would answer for rows nobody asked, which is the R-22 hazard pointing the
-- other way — here the unsafe reading is the one that CLAIMS autonomy.

alter table public.stage_events
  add column if not exists driven_via text;

alter table public.stage_events
  drop constraint if exists stage_events_driven_via_check;

alter table public.stage_events
  add constraint stage_events_driven_via_check
  check (driven_via is null or driven_via in ('sweep', 'foreground'));

comment on column public.stage_events.driven_via is
  'F-55. How this transition was driven: sweep = the unattended cron, foreground = a person pressing the control on a watched run. NULL means recorded before this column existed and must never be read as either. Acceptance criterion 2 is SELECT ... WHERE driven_via IS DISTINCT FROM ''sweep''.';

-- The same fact on the track, so "was this run untouched" is answerable without
-- reassembling every transition. It is LAST-write-wins on purpose: one
-- foreground press anywhere in a route is enough to disqualify the run, and the
-- transitions keep the per-step detail.
alter table public.spine_tracks
  add column if not exists last_driven_via text;

alter table public.spine_tracks
  drop constraint if exists spine_tracks_last_driven_via_check;

alter table public.spine_tracks
  add constraint spine_tracks_last_driven_via_check
  check (last_driven_via is null or last_driven_via in ('sweep', 'foreground'));

comment on column public.spine_tracks.last_driven_via is
  'F-55. How this track was last driven. NULL before this column existed. The per-transition history is stage_events.driven_via.';
