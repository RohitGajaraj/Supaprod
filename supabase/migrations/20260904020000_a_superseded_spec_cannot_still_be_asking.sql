-- ── A SUPERSEDED SPEC CANNOT STILL BE ASKING (P-57b) ───────────────────────
--
-- P-57 closed the door: a second brief-path spec on a track now returns the
-- first instead of minting a twin. It does nothing about the twins already
-- filed, and each of them is still holding a design gate open, so the approvals
-- heading P-56 just made honest is counting the same spec twice.
--
-- Measured on production 2026-09-04, immediately before this ran:
--   9 tracks carry more than one live spec at Define, 21 live specs between them
--   12 of those are the older twin, and ALL TWELVE hold design_gate_status='pending'
--    9 specs are ALREADY superseded and STILL hold a pending gate
--
-- The second line is the one that decides the shape of this migration. Nine
-- specs were superseded properly, by whatever path supersedes them, and their
-- gates stayed open regardless. So this is not a backlog left by the twin
-- defect; supersession has never closed a gate, and a sweep would leave the
-- tenth to reappear tomorrow. It is written as an invariant first and a
-- backfill second.
--
-- FOUNDER'S RULING, 2026-09-04 00:09, relayed by A1: on one track at one
-- station the newest live spec stands, the older live ones are superseded, and
-- a superseded spec's pending design gate closes with it.
--
-- ── WHY A TRIGGER RATHER THAN THE SUPERSEDE PATH ──────────────────────────
--
-- A trigger, because there is not exactly one supersede path. The nine specs
-- above prove it: they were superseded by something, and if a single code path
-- owned it, fixing that path would have been the cheaper and more visible fix.
-- Making it a rule of the TABLE means it holds for the path that wrote those
-- nine, for the path P-57 just guarded, and for whatever writes the next one.
-- This repo has spent a month on rules written as prose in the one code path
-- somebody remembered.
--
-- ── WHY A NEW VALUE AND NOT 'rejected' ────────────────────────────────────
--
-- The column allows 'pending', 'approved', 'rejected'. Closing these as
-- 'rejected' would put "Design rejected" on the Ship page's sign-off block for
-- twenty-one specs no person ever looked at, which is a fabricated human
-- judgment -- the exact defect that file's own header says it exists to
-- prevent. 'superseded' says the true thing: the gate was never answered, it
-- stopped applying.
--
-- `design_decided_at` is deliberately LEFT NULL. It is the timestamp of a
-- person's decision, the Ship page pairs it with the status to render a
-- sign-off, and nobody decided this.

alter table public.prds
  drop constraint if exists prds_design_gate_status_check;

alter table public.prds
  add constraint prds_design_gate_status_check
  check (design_gate_status = any (array['pending','approved','rejected','superseded']));

comment on column public.prds.design_gate_status is
  'pending / approved / rejected are a person''s. superseded means the spec stopped applying and the gate closed with it: never a human judgment, and design_decided_at stays null.';

-- The invariant. Only ever pending -> superseded: a gate a person ANSWERED
-- keeps their answer, because superseding the spec does not un-approve a design
-- somebody signed off on, and the Ship page reads that answer as a receipt.
create or replace function public.close_design_gate_with_superseded_spec()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.artifact_kind <> 'prd' or NEW.station <> 'define' then
    return NEW;
  end if;
  if NEW.superseded_at is null or OLD.superseded_at is not null then
    return NEW;
  end if;

  update public.prds
     set design_gate_status = 'superseded'
   where id = NEW.artifact_id
     and design_gate_status = 'pending';

  return NEW;
end;
$$;

drop trigger if exists close_design_gate_on_supersede on public.spine_track_members;

create trigger close_design_gate_on_supersede
  after update of superseded_at on public.spine_track_members
  for each row
  execute function public.close_design_gate_with_superseded_spec();

-- ── BACKFILL, IN TWO PARTS, AND THE IDS IT TOUCHED ────────────────────────
--
-- Part one: the 9 specs already superseded whose gates never closed. These need
-- no ruling; they are what the invariant above would have done at the time.
--   148d5737 33b4c0f7 378d26ea 5f7793b8 74730708 dc3eaff7 dd0a33e8 ebca33b5 f4c7e1d4
update public.prds p
   set design_gate_status = 'superseded'
  from public.spine_track_members m
 where m.artifact_id = p.id
   and m.artifact_kind = 'prd'
   and m.station = 'define'
   and m.superseded_at is not null
   and p.design_gate_status = 'pending';

-- Part two: the 12 older live twins. THIS is the part carrying the founder's
-- ruling, and it supersedes the MEMBER row; the trigger above then closes each
-- gate, so the backfill exercises the invariant rather than working around it.
-- Newest per track stands, ties broken on the id so the choice is deterministic
-- and re-runnable rather than dependent on row order.
--   superseded: 08546dce 2679bd48 30401e77 64fa0caf 9e8a5077 a881b18c
--               b12b9031 b401ccd4 b4dbe7b5 c43494c3 cd514619 df43f6bc
--   left standing: 266f61b1 3a5c53d4 55688633 5e387140 9277a817 b06bf29d
--                  b61974e2 e1c00cf8 f2aa82f1
with ranked as (
  select m.track_id, m.artifact_id,
         row_number() over (
           partition by m.track_id
           order by m.created_at desc, m.artifact_id desc
         ) rn
    from public.spine_track_members m
   where m.artifact_kind = 'prd'
     and m.station = 'define'
     and m.superseded_at is null
),
losers as (
  select artifact_id, track_id
    from ranked
   where rn > 1
     and track_id in (select track_id from ranked group by track_id having count(*) > 1)
)
update public.spine_track_members m
   set superseded_at = now()
  from losers l
 where m.artifact_id = l.artifact_id
   and m.track_id = l.track_id
   and m.artifact_kind = 'prd'
   and m.station = 'define'
   and m.superseded_at is null;
