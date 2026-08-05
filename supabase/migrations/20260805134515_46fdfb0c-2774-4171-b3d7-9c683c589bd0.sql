-- themes.frequency stops being an assertion and becomes a fact.
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

insert into public.artifact_lineage
  (user_id, workspace_id, parent_kind, parent_id, child_kind, child_id, relation, rationale, created_by_agent)
select s.user_id, s.workspace_id, 'signal', s.id, 'theme', s.theme_id,
       'promoted', 'Backfilled 2026-08-03: signal was clustered into this theme but no edge was ever written',
       'discovery-scout'
  from public.signals s
 where s.theme_id is not null
on conflict (user_id, parent_kind, parent_id, child_kind, child_id, relation) do nothing;

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