-- Backfill schema_migrations ledger for 21 already-live migration files.
-- Schema objects verified present in the DB; only the ledger rows are missing,
-- which trips the build-time drift check. This records them as applied.
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260711030000', 'rpt32_human_gate_events', ARRAY['-- backfilled: schema already applied']::text[]),
  ('20260711160000', 'rpt28_memory_write_review_gate', ARRAY['-- backfilled']::text[]),
  ('20260711170000', 'self_improve_proposals', ARRAY['-- backfilled']::text[]),
  ('20260711180000', 'self_improve_tick_cron', ARRAY['-- backfilled']::text[]),
  ('20260711183000', 'pc10_roadmap_rewind', ARRAY['-- backfilled']::text[]),
  ('20260712010000', 'rpt39_house_rules_source_runs', ARRAY['-- backfilled']::text[]),
  ('20260712010100', 'rpt39_retro_tick_cron', ARRAY['-- backfilled']::text[]),
  ('20260712020000', 'rpt47_opportunity_brief_link', ARRAY['-- backfilled']::text[]),
  ('20260712120000', 'rpt50_ai_enrichment', ARRAY['-- backfilled']::text[]),
  ('20260712140000', 'rpt50_apply', ARRAY['-- backfilled']::text[]),
  ('20260712160000', 'rpt50_settings', ARRAY['-- backfilled']::text[]),
  ('20260713010000', 'g_price_a1_refund_rpc', ARRAY['-- backfilled']::text[]),
  ('20260713020000', 'g_price_c2_byok_fee_accrual', ARRAY['-- backfilled']::text[]),
  ('20260713030000', 'g_price_d2_bounded_overage', ARRAY['-- backfilled']::text[]),
  ('20260715100000', 'landing_waitlist_and_events', ARRAY['-- backfilled']::text[]),
  ('20260716050000', 'fanout_fair_batch_selection_rpc', ARRAY['-- backfilled']::text[]),
  ('20260716074602', 'pc30_capability_changes', ARRAY['-- backfilled']::text[]),
  ('20260716083000', 'pc36_ask_scope_source_id', ARRAY['-- backfilled']::text[]),
  ('20260716120000', 'pc36_agent_approvals_realtime', ARRAY['-- backfilled']::text[]),
  ('20260717000000', 'pc30_house_rules_agent_scope', ARRAY['-- backfilled']::text[]),
  ('20260717010000', 'pc30_skill_toggle', ARRAY['-- backfilled']::text[])
ON CONFLICT (version) DO NOTHING;