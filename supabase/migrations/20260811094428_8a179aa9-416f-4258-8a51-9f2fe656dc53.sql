insert into public.artifact_lineage (
  user_id,
  workspace_id,
  parent_kind,
  parent_id,
  child_kind,
  child_id,
  relation,
  rationale,
  created_by_agent
)
select
  d.user_id,
  d.workspace_id,
  'mission',
  d.mission_id,
  'decision',
  d.id,
  'decided',
  'The mission this call was filed against',
  'backfill'
from public.decisions d
join public.missions m on m.id = d.mission_id
where d.mission_id is not null
  and d.user_id is not null
on conflict (user_id, parent_kind, parent_id, child_kind, child_id, relation)
do nothing;