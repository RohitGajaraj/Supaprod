insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260803190000','theme_frequency_is_derived'),
  ('20260803191000','guardrails_are_workspace_policy'),
  ('20260805120000','auto_origin_column_retires_title_marker'),
  ('20260805130000','role_aware_writes_on_governance_tables'),
  ('20260805140000','reflection_recall_is_not_anon_readable')
on conflict (version) do nothing;