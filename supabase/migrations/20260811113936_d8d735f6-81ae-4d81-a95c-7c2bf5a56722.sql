INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('track-record','route')
ON CONFLICT (slug) DO NOTHING;

insert into supabase_migrations.schema_migrations (version, name)
values ('20260811120001', 'reserve_track_record_slug')
on conflict (version) do nothing;