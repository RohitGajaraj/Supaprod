INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('crew','route'),('investors','route'),('runs','route')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260730020000','reserve_crew_runs_investors_slugs')
ON CONFLICT (version) DO NOTHING;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260729175027','messages_metadata_and_mission_id_repair')
ON CONFLICT (version) DO NOTHING;