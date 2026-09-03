-- ---------------------------------------------------------------------------
-- A ROW IN A SAMPLE WORKSPACE SAYS SO, WHOEVER WROTE IT.
--
-- THE DEFECT. `seed_sample_workspace` was written 2026-07-05. The `is_sample`
-- columns arrived a month later (20260805220000, 20260806*, 20260819180000,
-- 20260827050000). The seeder was never brought along, so every row it wrote
-- took the `false` default and the row-level "Example" marks this product
-- renders had never once fired. Counted on production 2026-09-03: 498 themes,
-- 1,119 signals, 449 opportunities and 78 prds inside sample workspaces, and
-- ZERO of them marked.
--
-- WHY THIS AND NOT THE OBVIOUS FIX. The obvious fix is to rewrite the seeder's
-- 59 INSERT statements to carry the column, and that was written first
-- (20260909010000, superseded and removed by this migration). Two things are
-- wrong with it. It is a 91 KB CREATE OR REPLACE, which no lane here can apply
-- without reproducing 91 KB of seeded prose by hand into a function that runs
-- at every signup. And more importantly it fixes ONE WRITER. The invariant is
-- not "the seeder remembers"; it is "a row that lives in a sample workspace is
-- an example". Anything else that ever writes into one of these workspaces --
-- seeder v2, a backfill script, an agent, a future seeder nobody has written
-- yet -- has to remember independently, and the whole reason this defect
-- existed for a month is that somebody did not.
--
-- So the rule moves into the database, where it cannot be forgotten. This is
-- the house pattern already: `set_workspace_slug`, `set_workspace_account` and
-- `protect_workspace_billing_columns` are all BEFORE triggers enforcing a
-- column's truth regardless of who is writing.
--
-- IT ONLY EVER SETS THE FLAG TRUE, never false. A row's being an example is a
-- fact about where it was born, and a row moved out of a sample workspace does
-- not stop being invented. Unsetting would also let any UPDATE quietly launder
-- fixture data into a real workspace's record.
--
-- THE COST is one primary-key lookup on `workspaces` per insert into these
-- twelve tables. `workspace_id` is null on plenty of rows and the guard exits
-- before the lookup in that case.
--
-- WHAT MARKING THEM DOES, NAMED AND ACCEPTED (A1, 2026-09-03). Several readers
-- gate on `.eq("is_sample", false)` so the brain does not rank fiction
-- (`derive-insights.server.ts`, `insights.functions.ts`). Marking these rows
-- therefore REMOVES them from the brain's candidate set in the seeded
-- workspaces. That is the guard's own purpose. The workspace the team walks,
-- `helio-labs-harbor`, is not a sample workspace and is untouched.
--
-- REVERSAL, one statement, recorded here because it was asked for:
--   update public.<table> set is_sample = false
--    where workspace_id in (select id from public.workspaces where is_sample);
--   (and `drop trigger mark_sample_rows on public.<table>;` per table)
-- ---------------------------------------------------------------------------

create or replace function public.mark_rows_in_sample_workspaces()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Already marked, or no workspace to ask about: nothing to do, and no lookup.
  if NEW.is_sample is true or NEW.workspace_id is null then
    return NEW;
  end if;

  if exists (
    select 1 from public.workspaces w
     where w.id = NEW.workspace_id and w.is_sample
  ) then
    NEW.is_sample := true;
  end if;

  return NEW;
end;
$$;

comment on function public.mark_rows_in_sample_workspaces() is
  'A row written into a sample workspace is an example. Sets is_sample true and never false.';

do $$
declare t text;
begin
  foreach t in array array[
    'themes', 'signals', 'opportunities', 'prds', 'learnings', 'decisions',
    'agent_runs', 'agent_approvals', 'agent_memory', 'deployments',
    'spine_tracks', 'studio_changesets'
  ]
  loop
    execute format('drop trigger if exists mark_sample_rows on public.%I', t);
    execute format(
      'create trigger mark_sample_rows before insert or update of workspace_id on public.%I
         for each row execute function public.mark_rows_in_sample_workspaces()', t);
  end loop;
end $$;

-- THE ROWS ALREADY WRITTEN. The trigger fixes every future write; these 2,144
-- were written before it existed and are the ones a person sees today.
update public.themes        set is_sample = true where is_sample = false and workspace_id in (select id from public.workspaces where is_sample);
update public.signals       set is_sample = true where is_sample = false and workspace_id in (select id from public.workspaces where is_sample);
update public.opportunities set is_sample = true where is_sample = false and workspace_id in (select id from public.workspaces where is_sample);
update public.prds          set is_sample = true where is_sample = false and workspace_id in (select id from public.workspaces where is_sample);
update public.learnings     set is_sample = true where is_sample = false and workspace_id in (select id from public.workspaces where is_sample);
update public.decisions     set is_sample = true where is_sample = false and workspace_id in (select id from public.workspaces where is_sample);
