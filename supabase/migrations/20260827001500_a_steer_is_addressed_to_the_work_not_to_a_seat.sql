-- 20260827001500_a_steer_is_addressed_to_the_work_not_to_a_seat.sql
--
-- S0, 2026-08-27. Requested by S1 from `lane/run` after driving the real UI.
--
-- WHAT IS BROKEN. Every track-scoped steer is refused in production. S1 typed
-- one into the run composer on track `a30238f5` and the insert came back:
--
--   null value in column "to_agent_slug" of relation "agent_messages"
--   violates not-null constraint
--
-- `steerTrack` (`track.functions.ts:2093-2099`) inserts exactly
-- `{user_id, workspace_id, track_id, kind, payload}`. It names no recipient,
-- and it is right not to: 20260820032000 established that **a track is the
-- address, not an agent**, and several seats run at Discover, so there is no
-- single seat a steer is "to". The composer rendered the database error
-- verbatim, which is honest and useless.
--
-- THIS IS THE SECOND MANDATORY COLUMN, NOT THE FIRST. `mission_id` was the
-- first and was already relaxed against production. **That change was applied
-- without a migration file, so this repo's history never recorded it** — a
-- database rebuilt from `supabase/migrations/` alone would still carry
-- `mission_id NOT NULL` and would break steer again on first run. The
-- statement below is therefore written idempotently and lands the fix twice on
-- purpose: a no-op against production, and the missing history everywhere else.
--
-- IT IS THE LAST ONE. Read off `information_schema.columns` on 2026-08-27:
-- `user_id` and `workspace_id` are NOT NULL and both are supplied by
-- `steerTrack`; `kind` defaults to `'handoff'` and `payload` to `'{}'`; every
-- remaining column is already nullable. After this, nothing else can refuse the
-- insert.
--
-- NO BACKFILL, and the numbers say why. Measured immediately before writing:
--
--   select kind, count(*), count(to_agent_slug), count(track_id) ...
--     handoff  139  139  0
--     kickoff   14   14  0
--     steer      3    3  0
--
-- All 156 rows already carry a slug, so relaxing the column cannot alter one of
-- them. **Not a single track-scoped row exists** — which is the measurement
-- that matters: it is not that track steers are rare, it is that none has ever
-- been written, because the constraint refused all of them.
--
-- THE READ PATH NEEDS NO CHANGE. `loop.server.ts:1315-1337` selects only `id`
-- and `payload`, filtered on mission-or-track plus `kind` plus
-- `consumed_by_run_id is null`. It never mentions `to_agent_slug`.
--
-- WHY A CHECK ARRIVES IN THE SAME BREATH. Until today `mission_id NOT NULL` was
-- what guaranteed a message was addressed to *something*. Relaxing it removed
-- that guarantee silently, and 20260820032000 asserted the invariant
-- ("addressed to neither a mission nor a track") only as a one-off count at
-- migration time — so nothing has enforced it since. Both address columns are
-- now nullable, so the invariant is stated as a constraint instead of a hope.
-- It is deliberately NOT keyed to `kind`: `claim` and `broadcast` are
-- teammate-to-everyone by design (SPEC-AGENT-COMMS §3), so a rule demanding a
-- recipient per kind would block the next two types before they are written.

alter table public.agent_messages
  alter column mission_id drop not null;

alter table public.agent_messages
  alter column to_agent_slug drop not null;

comment on column public.agent_messages.to_agent_slug is
  'The seat this message is addressed to, when there is one. Nullable since '
  '2026-08-27: a steer is addressed to the work rather than to a seat, and '
  'several seats run at Discover, so there is no single recipient to name. '
  'Handoff and kickoff still set it; steer, claim and broadcast do not.';

alter table public.agent_messages
  drop constraint if exists agent_messages_addressed_to_something;

alter table public.agent_messages
  add constraint agent_messages_addressed_to_something
  check (mission_id is not null or track_id is not null)
  not valid;

alter table public.agent_messages
  validate constraint agent_messages_addressed_to_something;

do $$
declare
  n_mission_nn int;
  n_slug_nn    int;
  n_nowhere    int;
begin
  select count(*) into n_mission_nn from information_schema.columns
   where table_schema = 'public' and table_name = 'agent_messages'
     and column_name = 'mission_id' and is_nullable = 'NO';
  if n_mission_nn <> 0 then
    raise exception 'agent_messages.mission_id is still NOT NULL';
  end if;

  select count(*) into n_slug_nn from information_schema.columns
   where table_schema = 'public' and table_name = 'agent_messages'
     and column_name = 'to_agent_slug' and is_nullable = 'NO';
  if n_slug_nn <> 0 then
    raise exception 'agent_messages.to_agent_slug is still NOT NULL — the steer stays refused';
  end if;

  select count(*) into n_nowhere from public.agent_messages
   where mission_id is null and track_id is null;
  if n_nowhere <> 0 then
    raise exception '% agent_messages are addressed to nothing at all', n_nowhere;
  end if;
end $$;
