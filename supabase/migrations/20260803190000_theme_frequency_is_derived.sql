-- themes.frequency stops being an assertion and becomes a fact.
--
-- FOUND BY WALKING THE LIVE PRODUCT on 2026-08-03. Discover showed a cluster
-- reading "40 signals from 0 separate sources", its "What backs this" panel was
-- absent, and promoting it produced the receipt "carrying 0 signals of evidence".
-- Decide then ranked that same bet #5 and told the user "backed by 40 signals",
-- and the Critic reasoned off it out loud ("High-volume support burden is
-- validated"). Measured on the Helio Labs workspace:
--
--   themes claim (sum of frequency) : 179
--   signals that actually exist     :  21
--   signal -> theme lineage edges   :   0
--
-- and the drift ran BOTH ways: one theme stored 40 against 0 real rows, another
-- stored 9 against 19. So this was never a display bug. `frequency` is the number
-- that sets the Discover ranking, the "watch this week" designation
-- (ranking.ts: corroboration >= 3), the Decide ICE ordering, and the corroboration
-- clause the Critic is handed. In a product whose claim is "proof, not assertion",
-- the proof counter was the one thing nothing audited.
--
-- WHY A TRIGGER AND NOT A READ-TIME COUNT. A count computed in listThemes fixes
-- one caller. Six read it (two surfaces, the ranking module, the designation rule,
-- the promote path, the Critic's prompt), and the next reader would inherit the
-- same trap. A trigger makes the column correct by construction for every reader
-- that exists and every one that comes later, at the only place the truth changes:
-- when a signal's theme_id moves. There is no second source left to drift from.
--
-- WHAT THIS DELIBERATELY DOES NOT DO: invent evidence. Reconciling drops most
-- demo themes to their real count, which is mostly zero, because the seeded
-- evidence never existed. Writing 158 plausible customer quotes to make the demo
-- look better would put fabricated records in the very ledger this product asks
-- customers to trust. The founder decides whether to seed genuine demo signals;
-- this migration only stops the number lying.

-- 1. THE SINGLE WRITER. Recompute one theme's frequency from the rows themselves.
--    SECURITY DEFINER because it runs inside a trigger on behalf of whoever moved
--    the signal, and must see every sibling row in the theme to count correctly,
--    not only the subset that caller's RLS admits. It reads and writes nothing but
--    the count, and takes the theme id from the trigger row, never from user input.
create or replace function public.recount_theme_frequency(p_theme_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.themes t
     set frequency = (select count(*) from public.signals s where s.theme_id = p_theme_id)
   where t.id = p_theme_id;
$$;

revoke execute on function public.recount_theme_frequency(uuid) from public, anon;

-- 2. THE TRIGGER. Fires on the three ways a theme's membership can change. UPDATE
--    is scoped `of theme_id` so ordinary signal edits (sentiment, tags, embedding
--    backfill) do not pay for a recount. Both OLD and NEW themes are recounted on
--    an update, because moving a signal changes two totals, and the losing side of
--    the atomic claim in cluster.server.ts is exactly where the old drift came from.
create or replace function public.signals_sync_theme_frequency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.theme_id is not null then perform public.recount_theme_frequency(old.theme_id); end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.theme_id is distinct from new.theme_id and old.theme_id is not null then
    perform public.recount_theme_frequency(old.theme_id);
  end if;

  if new.theme_id is not null then perform public.recount_theme_frequency(new.theme_id); end if;
  return new;
end $$;

drop trigger if exists signals_theme_frequency on public.signals;
create trigger signals_theme_frequency
  after insert or delete or update of theme_id on public.signals
  for each row execute function public.signals_sync_theme_frequency();

-- 3. RECONCILE WHAT IS ALREADY WRONG. Every theme, every workspace, once.
do $$
declare drifted int;
begin
  select count(*) into drifted
    from public.themes t
   where coalesce(t.frequency, 0)
         <> (select count(*) from public.signals s where s.theme_id = t.id);

  update public.themes t
     set frequency = (select count(*) from public.signals s where s.theme_id = t.id)
   where coalesce(t.frequency, 0)
         <> (select count(*) from public.signals s where s.theme_id = t.id);

  raise notice 'reconciled % themes whose stored frequency disagreed with their signals', drifted;
end $$;

-- 4. BACKFILL THE LINEAGE EDGES THAT WERE NEVER WRITTEN. Every theme measured
--    above had zero signal -> theme edges, including the one holding 19 real
--    signals, which is why the Brain graph renders nodes and no edges. The edge is
--    what makes the record walkable; without it "where did this come from" has no
--    answer even when the data is right there.
insert into public.artifact_lineage
  (user_id, workspace_id, parent_kind, parent_id, child_kind, child_id, relation, rationale, created_by_agent)
select s.user_id, s.workspace_id, 'signal', s.id, 'theme', s.theme_id,
       'promoted', 'Backfilled 2026-08-03: signal was clustered into this theme but no edge was ever written',
       'discovery-scout'
  from public.signals s
 where s.theme_id is not null
on conflict (user_id, parent_kind, parent_id, child_kind, child_id, relation) do nothing;

-- 5. GUARD. If any theme still disagrees with its own evidence, the trigger or the
--    reconcile is wrong and this must not be reported as applied.
do $$
declare n int;
begin
  select count(*) into n
    from public.themes t
   where coalesce(t.frequency, 0)
         <> (select count(*) from public.signals s where s.theme_id = t.id);
  if n <> 0 then
    raise exception '% themes still claim a frequency their signals do not support', n;
  end if;
end $$;
