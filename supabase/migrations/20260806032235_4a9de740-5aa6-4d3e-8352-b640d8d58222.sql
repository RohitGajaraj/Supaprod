alter table public.themes
  add column if not exists is_sample boolean not null default false;

comment on column public.themes.is_sample is
  'True when EVERY signal clustered into this theme is a sample. Seeded signals '
  'cluster like any others, so without this the brain ranks themes made of '
  'invented evidence and presents the result as judgment on the user''s own '
  'record. A theme with even one real signal is not a sample: mislabelling real '
  'evidence as fiction is the worse of the two errors.';

update public.themes t
set is_sample = true
where exists (select 1 from public.signals s where s.theme_id = t.id and s.is_sample)
  and not exists (select 1 from public.signals s where s.theme_id = t.id and not s.is_sample);

create index if not exists themes_live_not_sample_idx
  on public.themes (workspace_id, status)
  where is_sample = false;