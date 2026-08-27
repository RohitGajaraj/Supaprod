-- A STOP THAT CANNOT SAY WHY IS NOT SOMETHING A PERSON CAN WATCH.
--
-- ── THE GAP, WHICH THE CODE ALREADY DESCRIBES WITHOUT NAMING IT ────────────
-- `driver.server.ts` sets `last_hold` to a coarse KIND: 'given-up',
-- 'tools-refused', 'station-cannot-finish', 'going-in-circles'. The comment
-- above that write says it plainly:
--
--   "ESCALATE AND GIVE-UP BOTH STOP, and they record a reason rather than a
--    status word. The persisted `last_hold` is the coarse shape so the surface
--    that lists work can render a sentence; the specific one, naming both
--    stations and the missing thing, is the line returned here and it is what
--    the tick's own record of the sweep carries."
--
-- So the specific reason IS computed. It is returned, it goes into the sweep's
-- own job record, and it is never stored on the track. A person opening the work
-- an hour later sees "Nothing more will be tried here on its own" and has no way
-- to reach the sentence that would tell them what to do about it.
--
-- MEASURED, and this is exactly the case that cost this session an evening:
-- `a30238f5` sits at ship on 'given-up'. The actual reason is in its
-- release-verifier's own words, in `agent_runs.output` --
--   "the spec requires <=5% abandonment ... Shipping cannot proceed until the
--    success metric is met"
-- -- which took a join and a read to find, and which turned out to be a defect
-- in the loop rather than a fact about the work (F-115). None of that was
-- reachable from the screen the product tells people to watch.
--
-- R-18's acceptance is that "a person can watch it happen on one screen". A run
-- that stops without saying why is the one moment watching stops working.
--
-- ── WHY A COLUMN AND NOT A JOIN ────────────────────────────────────────────
-- The reason is a fact about the TRACK at the moment it stopped, not about any
-- one run. Reconstructing it later means finding the right run among many,
-- guessing which output was the deciding one, and re-deriving a sentence the
-- driver already wrote. Every surface would have to do that identically, and
-- they would not.
--
-- ── ADDITIVE AND ORDER-SAFE, DELIBERATELY ──────────────────────────────────
-- Nullable with no default and no backfill. Migrations and deploys are two
-- switches with no enforced order (the reason `isPreMigration` exists in
-- `src/lib/read-failure.ts`), so this lands FIRST and sits empty until the code
-- that writes it deploys. A reader on old code never selects it; a reader on new
-- code sees null and says nothing, which is honest for every track that stopped
-- before this existed.
--
-- NOT BACKFILLED, and that is F-109's standing rule: do not backfill a column
-- until the write path that fills it is verified closed. There is also nothing
-- to backfill from that would not be a guess about which run decided a stop.

alter table public.spine_tracks
  add column if not exists last_hold_because text;

comment on column public.spine_tracks.last_hold_because is
  'The driver''s own sentence for why this track stopped, written at the same moment as last_hold. Null means it stopped before this column existed, or it is not stopped. Never a reconstruction: it is the line the driver produced, stored verbatim.';
