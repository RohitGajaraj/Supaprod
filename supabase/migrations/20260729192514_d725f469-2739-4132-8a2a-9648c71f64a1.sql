INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260730000500', '20260730000500_demo_reset_allowlist'),
  ('20260730010000', '20260730010000_mission_spend_cap_default')
ON CONFLICT (version) DO NOTHING;