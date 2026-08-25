-- F-62. INTERVENTION WAS STORED IN A SLOT, AND A SLOT IS OVERWRITTEN.
--
-- This is a correction to the F-55 fix, not a new finding about a new thing.
--
-- `stage_events.driven_via` records who asked for a drive that MOVED A STATION.
-- `spine_tracks.last_driven_via` was added beside it precisely because most
-- drives move nothing — the F-55 migration's own comment says a person pressing
-- run on a track that then holds "writes no stage_events row at all", and that
-- is exactly the *unsticking* acceptance criterion 2 forbids.
--
-- MEASURED IN PRODUCTION ON 2026-08-25, and the ratio is the whole finding:
--
--   agent_runs carrying a track_id ................. 2,199
--   stage_events with entity_type='spine_track' ......  127
--
-- So roughly **94% of drives leave no transition row**. The column that exists
-- to catch that 94% is ONE COLUMN, stamped on entry, last-write-wins.
--
-- WHAT THAT COSTS, IN THE ONE CASE IT WAS BUILT FOR. A person presses run on a
-- stalled track at 10:05. The unattended sweep drives the same track at 10:15.
-- `last_driven_via` now reads 'sweep'. **The next sweep tick erases the evidence
-- of the intervention it should disqualify, within minutes**, and what survives
-- is not "does not know" but a surviving positive claim of autonomy — the one
-- direction F-55 was written to fail away from.
--
-- The F-55 migration's own comment states the intent it could not implement:
-- "It is LAST-write-wins on purpose: one foreground press anywhere in a route is
-- enough to disqualify the run." Last-write-wins does not mean that. It means
-- the last write wins, and the sweep always writes last.
--
-- BUILD-QUEUE item 63 states criterion 2's proof as "every transition
-- driven_via='sweep'". By construction that query cannot see 94% of the drives,
-- so it cannot see the interventions either. It is not a strict enough test; it
-- is a test of a different population.
--
-- ── WHAT WAS REJECTED ──────────────────────────────────────────────────────
--
-- A `stage_events` row with `to_stage = from_stage` on every drive. Cheapest by
-- far, reuses the trail, and it breaks four readers, two of them silently:
--
--   1. `readCorrections` reads the newest 50 spine_track rows and counts the
--      BACKWARD ones. Same-station rows are skipped by its `from <= to` test, so
--      the count is not wrong directly — but at 144 drives/day/track a 50-row
--      window is exhausted in under six hours, so **every real correction falls
--      out of the read**. `count` reads 0, `MAX_TRACK_CORRECTIONS` (2) becomes
--      unreachable, and a ping-ponging track has no ceiling but the spend cap.
--   2. The same read's `last` goes null, so `rememberCorrectionFix` — the write
--      that turns a correction hypothesis into a confirmed lesson — stops firing
--      and says nothing about having stopped.
--   3. `stationFiledSinceArrival` reads the newest row with `to_stage = station`
--      as WHEN THE TRACK ARRIVED. An entry row carries `to_stage = station`, so
--      arrival becomes "the start of this tick", nothing counts as filed since,
--      and every resumed station reads `produced-nothing` on its way to
--      `given-up`. **A stall, caused by the fix for criterion 2's proof.**
--      `to_stage` is NOT NULL, so there is no shape of row that dodges this.
--   4. `getTrackActivity` fetches 200 transitions and the transcript draws each
--      as a station move, so the watchable screen — criterion 3 — fills with
--      ~2,000 moves that never happened.
--
-- And it needs an explicit opt-in past `recordStageEvent`'s `from === to` guard,
-- which 50+ call sites rely on. Weakening that is a session owner's call.
--
-- Making `last_driven_via` sticky instead ('press' never downgraded to 'sweep').
-- One line, no migration, and it cannot count, cannot time, and cannot tell the
-- opening press from a mid-run nudge — which is the entire distinction queue 64
-- was built to record. A track pressed once at creation would read disqualified
-- forever.
--
-- Deriving it from `agent_runs`, which already carries `track_id` on 2,199 rows.
-- **A drive that HOLDS dispatches no run**, and the held press is the exact case
-- criterion 2 forbids. The one case that matters is the one case that table
-- cannot see.
--
-- ── WHAT THIS TABLE IS ─────────────────────────────────────────────────────
--
-- One row per DRIVE, appended, whether or not the drive moved anything. The
-- transition trail keeps recording transitions and means exactly what it always
-- meant; this records the neighbouring fact that had no home.
--
-- Criterion 2's proof becomes a query that can see all of it:
--
--   select driven_via, count(*) from public.track_drives
--    where track_id = $1 group by 1;
--
-- Unattended means every row reads 'sweep'. One 'press' row anywhere in the run
-- disqualifies it, and unlike the slot it survives the next tick, names the
-- station it happened at, and says whether the track was held when the person
-- reached for it.
--
-- WHAT THIS CANNOT DO, stated here so the next reader does not make F-55's
-- mistake in a new direction:
--
--   * It says nothing about the 2,199 historic drives. **NO BACKFILL**, on the
--     same law the F-55 migration set: writing 'sweep' across rows that never
--     knew would fabricate the evidence criterion 2 turns on. The table starts
--     empty and the proof is sound only for runs after this is applied AND
--     deployed.
--   * A MISSING ROW READS AS "no drive happened", which is the unsafe direction
--     — the writer fails soft so a logging fault can never break a run. So the
--     log must be cross-checked, not trusted alone: `spine_tracks.last_driven_via`
--     is left in place as an independent second witness of the LAST drive, and
--     if it disagrees with the newest row here, the log lost something and the
--     proof is void. `stage_events` spine_track rows are a second lower bound:
--     fewer drives than transitions is impossible.
--   * It covers two of criterion 2's three clauses — "no unsticking" and "no
--     re-drive by hand". **A direct database edit still leaves no row here**,
--     and nothing in this schema can catch that.
--   * `outcome` IS DELIBERATELY NOT A COLUMN. It is not known at entry, and the
--     entry is the only place this can be written once: `driveTrackOnce` has
--     eight exit paths that write `driven_at`, and the F-55 note explains that
--     adding a ninth field to all eight "is how two columns that must agree
--     drift apart". `entry_hold` is recorded instead — known at entry, costs
--     nothing, and it is the better field for this question anyway, because a
--     press against a non-null hold IS unsticking, in one column.

create table if not exists public.track_drives (
  id          uuid primary key default gen_random_uuid(),

  track_id    uuid not null references public.spine_tracks (id) on delete cascade,

  -- Where the drive FOUND the work, not where it left it. Read `stage_events`
  -- for where it went; a drive that went nowhere is the case this table exists
  -- for and it has no destination to record.
  station     text not null,

  -- NOT NULL AND NO DEFAULT, which is not a contradiction of the F-55 ruling
  -- that made `stage_events.driven_via` nullable. That column was added to a
  -- table holding 2,893 rows that honestly did not know. **This table is created
  -- empty**, every row comes from one call site whose `via` parameter is
  -- required, and so there is no row that cannot answer. A DEFAULT would invent
  -- an answer for a caller that never asked — that is the hazard F-55 named, and
  -- there is none here. A writer that omits the value errors instead of claiming
  -- autonomy.
  --
  -- 'foreground' is NOT accepted. It exists on `stage_events` only to keep rows
  -- written before queue 64's press/continuation split readable. Nothing before
  -- the split can be in a table created after it.
  driven_via  text not null check (driven_via in ('sweep', 'press', 'continuation')),

  -- The hold the track was sitting on when this drive arrived, or NULL when it
  -- was not held. **This is what makes an intervention legible as one.** A
  -- 'press' row with `entry_hold = 'station-cannot-finish'` is a person reaching
  -- for a stalled track, which is the sentence acceptance criterion 2 forbids,
  -- and no join is needed to read it.
  entry_hold  text,

  at          timestamptz not null default now()
);

comment on table public.track_drives is
  'F-62. One row per drive of a spine track, appended on entry to driveTrackOnce '
  'whether or not the drive moves a station. Exists because ~94% of drives move '
  'nothing (2,199 agent_runs carry a track_id against 127 spine_track '
  'stage_events rows), so the transition trail cannot see them, and '
  'spine_tracks.last_driven_via — the column added to catch them — is one slot '
  'overwritten by the next sweep tick within minutes. Acceptance criterion 2 is '
  'SELECT driven_via, count(*) FROM track_drives WHERE track_id = $1 GROUP BY 1: '
  'unattended means every row reads ''sweep''. Never backfilled; a run predating '
  'this table is not provable by it. Added 2026-08-25.';

comment on column public.track_drives.station is
  'The station the drive found the track at. A drive that moved nothing has no '
  'destination to record, and that drive is the reason this table exists.';

comment on column public.track_drives.driven_via is
  'sweep = the unattended cron, press = a person acting on a watched run, '
  'continuation = the client walking on from a window-closed leg of that press. '
  'NOT NULL with no default: this table was created empty, so unlike '
  'stage_events.driven_via there is no row that honestly does not know.';

comment on column public.track_drives.entry_hold is
  'spine_tracks.last_hold as it stood when this drive arrived; NULL means the '
  'track was not held. A press against a non-null hold is unsticking, which is '
  'what criterion 2 forbids, readable without a join.';

-- The only read shape: this track's drives, newest first.
create index if not exists track_drives_track_at_idx
  on public.track_drives (track_id, at desc);

-- APPEND-ONLY FROM THE APP'S SEAT: select and insert, no UPDATE or DELETE
-- policy, matching the posture stage_events and cost_incidents already take.
-- The watched path writes with the signed-in user's client, so the insert
-- policy is required; the sweep writes with the service role, which bypasses
-- RLS entirely.
--
-- Reachable exactly when its track is, on `spine_track_members`' precedent —
-- no second ownership rule to keep in step with the first, and no denormalised
-- workspace_id that can disagree with the track's.
--
-- THIS PROTECTS TENANCY, NOT THE AUDITOR, and the difference is worth stating.
-- A workspace owner already holds `FOR ALL` on `spine_tracks` under "own tracks
-- all", so nothing here makes them unable to lie about their own product.
-- Withholding UPDATE and DELETE costs nothing and removes the easiest way to do
-- it by accident.
alter table public.track_drives enable row level security;

grant select, insert on public.track_drives to authenticated;
grant all on public.track_drives to service_role;

drop policy if exists "own track drives read" on public.track_drives;
create policy "own track drives read" on public.track_drives for select
  using (
    exists (select 1 from public.spine_tracks t
             where t.id = track_drives.track_id and t.user_id = auth.uid())
  );

drop policy if exists "own track drives insert" on public.track_drives;
create policy "own track drives insert" on public.track_drives for insert
  with check (
    exists (select 1 from public.spine_tracks t
             where t.id = track_drives.track_id and t.user_id = auth.uid())
  );

do $$
declare n_tbl int; n_pol int; n_rows int;
begin
  select count(*) into n_tbl from information_schema.tables
   where table_schema = 'public' and table_name = 'track_drives';
  if n_tbl <> 1 then raise exception 'track_drives was not created'; end if;

  select count(*) into n_pol from pg_policies
   where schemaname = 'public' and tablename = 'track_drives';
  if n_pol <> 2 then raise exception 'track_drives should have exactly 2 RLS policies, found %', n_pol; end if;

  -- The no-backfill law, asserted rather than trusted: a table that starts with
  -- rows in it would be claiming knowledge of drives nobody recorded.
  select count(*) into n_rows from public.track_drives;
  if n_rows <> 0 then raise exception 'track_drives must start empty, found % rows', n_rows; end if;
end $$;
