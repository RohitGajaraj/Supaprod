insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260814093000','20260814093000_two_money_paths_that_could_run_twice.sql'),
  ('20260814100000','20260814100000_reserve_meridian_slug.sql'),
  ('20260814120000','20260814120000_a_gate_could_be_answered_twice_and_a_run_replayed.sql'),
  ('20260814140000','20260814140000_a_wrong_verdict_nobody_can_correct_is_also_a_false_entry.sql'),
  ('20260814180000','20260814180000_a_cap_advertised_on_two_surfaces_and_enforced_on_none.sql'),
  ('20260814190000','20260814190000_a_meter_that_loses_updates_undercounts_forever.sql')
on conflict (version) do nothing;