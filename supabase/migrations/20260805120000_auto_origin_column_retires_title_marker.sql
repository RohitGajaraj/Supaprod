-- Retire the "[auto] " title marker in favour of a real provenance column.
--
-- WHY THIS EXISTS. Auto-originated missions and decisions have been stored with
-- a literal "[auto] " prefix on their TITLE. It was never copy: it is a dedup
-- key, and sensing/trigger.ts says so itself ("The title is the only anchor
-- recoverable from missions (no metadata column), so dedup keys on it").
--
-- Using a display field as a machine key leaked the key to the founder three
-- separate times, most recently through Today's evidence bullet
-- ('From [auto] Investigate the "Alert Fatigue..." cluster'). Each fix was a
-- per-surface strip, and a new surface kept rediscovering the bug: 23 files call
-- stripAutoPrefix correctly and six do not.
--
-- Worse, and the reason a render-time strip was never going to be enough: the
-- raw title is also fed to the AI. decisionEmbeddingText(title, rationale)
-- embeds it, so "[auto]" is a literal token inside the brain's semantic memory
-- and every auto-raised decision shares it, pulling them together in vector
-- space for a reason that has nothing to do with their content. It is also
-- interpolated into Critic and contradiction-auditor prompts, which is how a
-- marker meant for a dedup lookup ends up in freshly generated prose.
--
-- So the marker leaves the data entirely and provenance moves to a column.
--
-- WHAT REPLACES IT.
--   missions.auto_trigger_source   already existed. It is set to 'auto' ONLY on
--                                  auto-PROMOTION and is counted for the daily
--                                  spend cap, so promotion keeps that exact
--                                  meaning and CREATION uses a distinct value,
--                                  'trigger'. Reusing 'auto' at creation would
--                                  have silently broken the cap.
--   decisions.auto_origin          new. decisions had no provenance column at
--                                  all, which is why the prefix was carried in
--                                  its title in the first place.
--
-- The provenance is not lost: the "Auto" chip and the "Raised automatically by
-- the loop" line read the column instead of sniffing the title.
--
-- REVERSIBLE. Nothing is deleted. The marker can be reconstructed for any row
-- from the column it is being moved into.

-- 1. The column decisions never had.
alter table public.decisions
  add column if not exists auto_origin boolean not null default false;

comment on column public.decisions.auto_origin is
  'True when the ambient trigger raised this decision rather than a human. Replaces the retired "[auto] " title prefix; read this, never the title.';

-- 2. Record provenance from the marker BEFORE stripping it, or it is lost.
update public.decisions
   set auto_origin = true
 where title like '[auto] %'
   and auto_origin = false;

-- Missions already have the column. Only fill where it is absent: a row that
-- was auto-PROMOTED must keep 'auto' so the daily-cap count stays correct.
update public.missions
   set auto_trigger_source = 'trigger'
 where title like '[auto] %'
   and auto_trigger_source is null;

-- 3. Now the marker can go. Anchored to the start so a legitimate "[auto]"
--    inside a sentence is never touched.
update public.decisions
   set title = regexp_replace(title, '^\[auto\]\s*', '')
 where title like '[auto] %';

update public.missions
   set title = regexp_replace(title, '^\[auto\]\s*', '')
 where title like '[auto] %';

-- 4. Index the dedup lookup the trigger tick now does. It replaces a
--    title-prefix scan with a column filter on every tick, per workspace.
create index if not exists missions_auto_trigger_source_idx
  on public.missions (workspace_id, auto_trigger_source)
  where auto_trigger_source is not null;
