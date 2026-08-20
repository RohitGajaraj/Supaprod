-- 20260820072500_the_judge_could_never_file_its_verdict.sql
--
-- Claude lane, 2026-08-20.
--
-- THE EVAL TICK HAS NEVER WRITTEN A ROW, AND THE REASON IS ONE WORD IN A COLUMN
-- DEFINITION.
--
-- WHAT IS BROKEN.
--
--   ai_evals.workspace_id   uuid NOT NULL DEFAULT current_user_default_workspace()
--
-- `current_user_default_workspace()` reads `auth.uid()`. The eval tick writes
-- with `supabaseAdmin`, the service role, which has no authenticated user.
-- Measured on production, with no auth context:
--
--   select auth.uid(), public.current_user_default_workspace();
--     -> null, null
--
-- So the DEFAULT evaluates to NULL, the NOT NULL constraint rejects the row, and
-- **every insert the tick has ever attempted has failed.**
--
-- HOW IT STAYED INVISIBLE FOR SEVEN WEEKS. `eval-tick.ts` destructures only the
-- data from that insert:
--
--   const { data: inserted } = await supabaseAdmin.from("ai_evals").insert({...})
--
-- The error is discarded. A failed insert leaves `inserted` null, the code falls
-- to the stale-reservation reclaim path, that finds nothing either, and the event
-- is recorded as `"reserved by a concurrent tick"` -- a confident diagnosis of a
-- race that never happened. The handler still returns 200, so `withJobRun` files
-- the run as a SUCCESS.
--
-- The evidence of how thoroughly that hid it:
--
--   * `cron.eval-tick` ran **48 times a day, every day**, 2026-07-20 through
--     2026-08-04, then 26 runs on 08-05 and stopped. Roughly 620 runs in the
--     window, all green.
--   * `ai_events` on a sample day inside it (2026-07-28): **180 rows** available
--     to judge. In the last 24 hours: **5,524 judgeable**. There has never been a
--     shortage of work.
--   * `ai_evals` holds **77 rows and not one was written by the tick.** They are
--     11 rows cloned into each of seven Helio Labs demo workspaces by
--     `20260725130000_helio_demo_seed_rich.sql`. Every eval this product has ever
--     held is a fixture.
--
-- THE SIBLING TABLE IS THE PROOF, AND THE REPO ALREADY KNEW.
--
--   ai_events.workspace_id   uuid     NULL  default current_user_default_workspace()
--   ai_evals.workspace_id    uuid NOT NULL  default current_user_default_workspace()
--
-- Same default, and `ai_events` survives only because it is nullable: the NULL
-- lands and the row is written. This exact failure is named in this repo twice
-- already -- `20260619150000_wm_f1_agent_workspace_scope.sql` says the
-- "current_user_default_workspace() DEFAULT bridge ERRORS under service-role",
-- and `20260701190000_ai_events_workspace_default_service_role_safe.sql` was
-- written to fix it for `ai_events`. **`ai_evals` was never given the same
-- treatment**, and it is the one table where the same mistake is fatal rather
-- than merely untidy.
--
-- WHY A TRIGGER AND NOT A NEW DEFAULT.
--
-- A DEFAULT cannot see the row. The truthful workspace for an eval is the
-- workspace of the EVENT it judges, and that is only knowable from `NEW.event_id`
-- once the row exists in flight. Postgres evaluates DEFAULT, then BEFORE INSERT
-- triggers, then constraints, so a BEFORE trigger is the only place that can both
-- read the row and still beat the NOT NULL check.
--
-- WHY IT FALLS BACK TO THE USER, WITH THE NUMBER THAT DECIDED IT. Deriving from
-- the event alone would fix a sixth of the problem. Of 5,622 `ai_events` in the
-- last 24 hours, **939 carry a workspace_id and all 5,622 carry a user_id**. So
-- the event is preferred where it knows, and `ensure_user_default_workspace` --
-- which takes the id as an ARGUMENT rather than reading `auth.uid()`, and is
-- SECURITY DEFINER -- answers for the rest.
--
-- WHY IT ONLY FILLS A NULL. An explicitly supplied workspace is a caller's
-- decision and is left alone. Under an authenticated caller the DEFAULT still
-- resolves first and still wins, so **nothing about the human path changes**;
-- this only rescues the case where the default produced nothing, which is exactly
-- and only the background writer.
--
-- NO BACKFILL. All 77 existing rows are seeded and already carry a workspace.
-- There is nothing to repair, only a future to unblock.

create or replace function public.ai_evals_derive_workspace_id()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if NEW.workspace_id is not null then
    return NEW;
  end if;

  -- The event's own workspace is the truthful answer where it has one.
  if NEW.event_id is not null then
    select e.workspace_id into NEW.workspace_id
      from public.ai_events e
     where e.id = NEW.event_id;
  end if;

  -- Otherwise the judged user's default. Takes the id as an argument, so it does
  -- not care that there is no `auth.uid()`, which is the whole point.
  if NEW.workspace_id is null and NEW.user_id is not null then
    NEW.workspace_id := public.ensure_user_default_workspace(NEW.user_id);
  end if;

  return NEW;
end;
$$;

drop trigger if exists ai_evals_derive_workspace_id on public.ai_evals;

create trigger ai_evals_derive_workspace_id
  before insert on public.ai_evals
  for each row
  execute function public.ai_evals_derive_workspace_id();

comment on function public.ai_evals_derive_workspace_id() is
  'Fills ai_evals.workspace_id when the column DEFAULT produced nothing. That '
  'default is current_user_default_workspace(), which reads auth.uid(), so under '
  'the service role it returns NULL and the NOT NULL constraint rejected every '
  'row the eval tick ever tried to write -- silently, because eval-tick.ts '
  'discards the insert error and reports a concurrency race instead. Added '
  '2026-08-20. Prefers the judged event''s workspace, falls back to the user''s '
  'default via ensure_user_default_workspace(uuid), which takes the id as an '
  'argument rather than reading auth.uid().';

do $$
declare n_trg int;
begin
  select count(*) into n_trg from pg_trigger
   where tgname = 'ai_evals_derive_workspace_id' and not tgisinternal;
  if n_trg <> 1 then
    raise exception 'ai_evals_derive_workspace_id trigger was not created';
  end if;
end $$;
