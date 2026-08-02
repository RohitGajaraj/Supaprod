alter table public.agent_runs
  add column if not exists track_id uuid references public.spine_tracks(id) on delete set null;

create index if not exists idx_agent_runs_track on public.agent_runs(track_id, created_at)
  where track_id is not null;

comment on column public.agent_runs.track_id is
  'The piece of work this run belongs to, when the driver started it. NULL for runs a person started by hand. Only Build opens a mission, so this is the only link the other six stations have.';

alter table public.spine_tracks
  add column if not exists theme_id uuid references public.themes(id) on delete set null;

create unique index if not exists uq_spine_tracks_theme
  on public.spine_tracks(theme_id) where theme_id is not null;

comment on column public.spine_tracks.theme_id is
  'The cluster of evidence this work came from, when the platform started it rather than a person. UNIQUE where present: one cluster becomes work at most once, enforced by the database because checking in code is a read-then-write race two overlapping ticks would both win.';

insert into supabase_migrations.schema_migrations (version)
values ('20260801130000'),('20260801133000'),('20260801150000'),('20260801170000'),('20260801190000'),('20260801220000'),('20260801230000'),('20260802010000'),('20260802020000')
on conflict (version) do nothing;