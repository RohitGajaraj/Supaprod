INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES
('20260718120000','20260718120000_helio_labs_demo_seed',ARRAY['-- already applied, backfill only']),
('20260720000000','20260720000000_mc_approval_snoozes',ARRAY['-- already applied, backfill only']),
('20260720010000','20260720010000_mc_approval_feedback',ARRAY['-- already applied, backfill only']),
('20260720020000','20260720020000_sample_workspace_seed_v2',ARRAY['-- already applied, backfill only']),
('20260720030000','20260720030000_mc_conversation_folders',ARRAY['-- already applied, backfill only']),
('20260720040000','20260720040000_mc_artifact_versions',ARRAY['-- already applied, backfill only']),
('20260720050000','20260720050000_mc_memory_candidate_conversation',ARRAY['-- already applied, backfill only']),
('20260722211500','20260722211500_demo_accounts_supaprod_domain',ARRAY['-- already applied, backfill only'])
ON CONFLICT (version) DO NOTHING;