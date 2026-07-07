-- Backfill schema_migrations for 6 migration files whose changes are already
-- live in the database but whose version rows are missing (drift). Idempotent.
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260705120000', '20260705120000_sample_workspace_seed', ARRAY['-- backfilled: seed_sample_workspace function verified present']),
  ('20260705140000', '20260705140000_sample_seed_corrective', ARRAY['-- backfilled: corrective demo reseed already run']),
  ('20260706140000', '20260706140000_data_cleanup_qa_debris', ARRAY['-- backfilled: QA debris cleanup already run']),
  ('20260706220000', '20260706220000_connector_requests', ARRAY['-- backfilled: connector_requests table verified present']),
  ('20260707021900', '20260707021900_auto_cluster_default_on', ARRAY['-- backfilled: auto_cluster_enabled default verified']),
  ('20260707025500', '20260707025500_signal_reference_urls', ARRAY['-- backfilled: signals.reference_urls column verified present'])
ON CONFLICT (version) DO NOTHING;