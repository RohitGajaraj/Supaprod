INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260707163000', '20260707163000_ma2_add_model_id_to_user_api_keys', ARRAY[]::text[]),
  ('20260707190000', '20260707190000_stage_events_foundations', ARRAY[]::text[]),
  ('20260707195000', '20260707195000_sw6_fresh_workspace_guards', ARRAY[]::text[]),
  ('20260707200000', '20260707200000_sw6_error_events', ARRAY[]::text[]),
  ('20260707202000', '20260707202000_sw6_cron_truth', ARRAY[]::text[]),
  ('20260707203000', '20260707203000_sw6_auto_sense_default_on', ARRAY[]::text[]),
  ('20260707210000', '20260707210000_seam2_build_spine', ARRAY[]::text[]),
  ('20260707213000', '20260707213000_sw4_goal_mode', ARRAY[]::text[]),
  ('20260707230000', '20260707230000_sw4_trust_ramp', ARRAY[]::text[]),
  ('20260708091000', '20260708091000_seam3_insight_push', ARRAY[]::text[]),
  ('20260708093000', '20260708093000_seam3_playbook_proposals', ARRAY[]::text[]),
  ('20260708100000', '20260708100000_seed_agent_roster_on_signup', ARRAY[]::text[]),
  ('20260708120000', '20260708120000_stage_events_signal_entity', ARRAY[]::text[]),
  ('20260708140000', '20260708140000_sw6_ai_budget_ledger_guard', ARRAY[]::text[]),
  ('20260708150000', '20260708150000_sw4_loop_mode', ARRAY[]::text[]),
  ('20260708153000', '20260708153000_sw6_ai_budget_ledger_columns', ARRAY[]::text[]),
  ('20260708170000', '20260708170000_sw4_design_station', ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;