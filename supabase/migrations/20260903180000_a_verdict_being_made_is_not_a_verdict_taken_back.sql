-- `forecast_resolution_log` was built for ONE writer, the reopen path, and its
-- NOT NULLs still say so. P-42 and A1's 2026-09-03 ruling gave it two more --
-- the forecast auditor and `learning.record`, both filing the verdict they just
-- MADE -- and nobody widened the table to hold that shape.
--
-- Measured on production, 2026-09-03, immediately before this ran: two decisions
-- carry `forecast_resolved_by_agent_slug = 'forecast-auditor'` with
-- `forecast_resolved_at` at 12:00 UTC today, and this table holds ZERO rows.
--
-- The failure is silent BY CONSTRUCTION, which is why it survived a day. The
-- auditor never set `reason`, so every insert raised 23502; `fileResolutionRow`
-- records a failed log write and swallows it deliberately, because the verdict
-- is already committed on `decisions` and failing the settle would be worse.
-- So the write went to a console nobody reads. That half is fixed in code: the
-- reason is now a required argument, so the compiler refuses a caller that
-- forgets one, rather than a comment asking it not to.
--
-- THIS half is the one that needed the table. `reopened_at` is NOT NULL DEFAULT
-- now(), so the moment the auditor's insert started succeeding, every verdict
-- being MADE would have been stamped with the time it was taken BACK. Both
-- writers' comments claim these columns "stay null, which reads correctly: this
-- row is the verdict being made, not unmade." One of them cannot be null. That
-- sentence describes a table that does not exist, and it would have produced a
-- log where every entry looked reopened and none of the reopenings could be
-- found. A history of corrections is worthless if it cannot be told apart from
-- the record it corrects.
--
-- The table is empty (0 rows, 0 reopens, checked against production directly
-- before this ran), so nothing is backfilled and no history is rewritten.

alter table public.forecast_resolution_log
  alter column reopened_at drop not null,
  alter column reopened_at drop default;

-- And the shape becomes enforced rather than described. A row is a verdict or a
-- reopening, and the two are told apart by the pair moving together: a reopening
-- names WHO and WHEN, a verdict names neither. Written as a constraint because
-- the comment that said the same thing is what let this ship.
alter table public.forecast_resolution_log
  drop constraint if exists forecast_resolution_log_reopen_is_whole;

alter table public.forecast_resolution_log
  add constraint forecast_resolution_log_reopen_is_whole
  check ((reopened_by is null) = (reopened_at is null));

comment on column public.forecast_resolution_log.reopened_at is
  'Null on a verdict being made. Set, with reopened_by, only when one is taken back.';
