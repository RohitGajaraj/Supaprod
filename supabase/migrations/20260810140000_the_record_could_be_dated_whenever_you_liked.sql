-- The record could be dated whenever you liked.
--
-- WHAT THE LANDING PAGE CLAIMS, AND WHAT THE SCHEMA ENFORCED. Receipts.tsx
-- says the record "cannot be backfilled, bought, or bolted on". Audited
-- 2026-08-10 against the live database, the first third of that sentence was
-- false, and false in a way one query demonstrates:
--
--   * `created_at` on decisions, learnings, prds and artifact_lineage is a
--     plain column: default now(), is_generated NEVER, is_updatable YES. A
--     DEFAULT applies only when the column is OMITTED, so any client that
--     supplies a timestamp sets it to whatever it likes.
--   * No immutability trigger existed on any of them. The only triggers on
--     these tables are reactor fanouts.
--   * The RLS UPDATE policies permit the owning user to rewrite their own
--     rows, with no column guard, so an existing row's date could be moved
--     after the fact.
--   * 93 decisions in production already carry a `created_at` EARLIER than
--     the workspace that contains them.
--
-- So the record could be written into the past and re-dated afterwards, by
-- the same person whose judgment it is supposed to evidence. A ledger whose
-- dates its own subject controls is not evidence of anything.
--
-- WHAT WAS ALREADY TRUE, and why this migration is small. `ledger_seals` is
-- genuinely append-only: RLS grants it SELECT and INSERT only, so UPDATE and
-- DELETE are denied outright, and it holds a SHA-256 chain with per-record
-- links that can pinpoint WHICH receipt changed rather than merely that
-- something did. It is live, with 18 real seals across 4 real users. The seal
-- was never the weak half. The rows it seals were.
--
-- THE FIX. `created_at` on the four ledger tables becomes immutable to
-- application callers, and is stamped by the database rather than accepted
-- from the client:
--
--   * On INSERT from a non-service_role caller, `created_at` is FORCED to
--     now(). A supplied value is ignored rather than rejected, because
--     refusing would break inserts that harmlessly echo the column back and
--     the goal is an honest timestamp, not a lecture.
--   * On UPDATE from a non-service_role caller, any attempt to change
--     `created_at` is refused with an error. Silently reverting it would let
--     a caller believe it had moved.
--
-- WHY service_role IS EXEMPT AND THAT IS NOT A HOLE. Seed migrations
-- deliberately backdate demo data, and a platform-level backfill is a real
-- operation. service_role is the platform, not the user. The claim being
-- protected is that the USER cannot rewrite their own history, which is the
-- claim that matters: a ledger is evidence against the person it describes.
-- Platform writes remain visible in the seal chain exactly like any other.
--
-- BLAST RADIUS: measured, and it is zero for application code. No file in
-- src/lib or src/routes sets `created_at` on an insert, update or upsert; the
-- 267 textual matches in src/ are TypeScript field declarations on read
-- models. The only writers that supply it are seed migrations, which run as
-- service_role and are exempt.
--
-- WHAT THIS DOES NOT MAKE TRUE. This does not make the record
-- un-backfillable in the absolute sense, and the copy should not say so. A
-- platform operator can still write history, and that is unavoidable in any
-- hosted product. What it makes true is the narrower, defensible claim: the
-- record is sealed, its dates are the database's rather than the author's,
-- and any later change is detectable against a seal the author cannot
-- rewrite. Tamper-evidence, not tamper-proofing. The landing copy needs to
-- narrow to match, and that is a founder call tracked separately.

create or replace function public.enforce_created_at_immutable()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- The platform may write history; the subject of the record may not.
  if coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    -- Stamped by the database, never accepted from the caller.
    NEW.created_at := now();
    return NEW;
  end if;

  if TG_OP = 'UPDATE' and NEW.created_at is distinct from OLD.created_at then
    raise exception
      'created_at is immutable on %: the record''s date is the database''s, not the author''s',
      TG_TABLE_NAME
      using errcode = 'check_violation';
  end if;

  return NEW;
end; $function$;

comment on function public.enforce_created_at_immutable() is
  'Ledger integrity: stamps created_at on INSERT and refuses to change it on UPDATE, for any caller that is not service_role. Added 2026-08-10 after an audit found created_at was client-settable and re-writable on every ledger table, with 93 decisions already dated before their own workspace.';

-- The four tables the Trust Ledger walks. `ledger_seals` is deliberately not
-- here: RLS already denies it UPDATE and DELETE, so its rows cannot be
-- re-dated at all, which is a stronger guarantee than this trigger provides.
drop trigger if exists trg_decisions_created_at_immutable on public.decisions;
create trigger trg_decisions_created_at_immutable
  before insert or update on public.decisions
  for each row execute function public.enforce_created_at_immutable();

drop trigger if exists trg_learnings_created_at_immutable on public.learnings;
create trigger trg_learnings_created_at_immutable
  before insert or update on public.learnings
  for each row execute function public.enforce_created_at_immutable();

drop trigger if exists trg_prds_created_at_immutable on public.prds;
create trigger trg_prds_created_at_immutable
  before insert or update on public.prds
  for each row execute function public.enforce_created_at_immutable();

drop trigger if exists trg_artifact_lineage_created_at_immutable on public.artifact_lineage;
create trigger trg_artifact_lineage_created_at_immutable
  before insert or update on public.artifact_lineage
  for each row execute function public.enforce_created_at_immutable();
