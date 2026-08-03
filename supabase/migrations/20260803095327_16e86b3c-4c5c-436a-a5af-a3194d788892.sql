INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260802170000','theme_growth_and_conditional_decline'),
  ('20260802180000','changeset_code_review'),
  ('20260802190000','agent_memory_workspace_visibility'),
  ('20260802191000','reflections_workspace_visibility'),
  ('20260802200000','enforce_seat_limit_on_membership'),
  ('20260802210000','prd_scaffolds_agent_source'),
  ('20260802220000','liveness_tick_cron'),
  ('20260802230000','workspace_autonomy_policy'),
  ('20260802240000','landing_session_claims'),
  ('20260802260000','artifact_lineage_canonicalise'),
  ('20260802270000','workspace_claim'),
  ('20260802280000','entity_embeddings'),
  ('20260803000000','add_embedding_model_tracking'),
  ('20260803000100','add_judgment_match_rpcs')
ON CONFLICT (version) DO NOTHING;