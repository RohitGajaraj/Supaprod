insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260810160000','a_decision_an_agent_made_had_nowhere_to_say_so'),
  ('20260810180000','the_forecast_is_the_part_that_cannot_be_rebuilt'),
  ('20260810190000','a_theme_stopped_and_the_record_never_said_why'),
  ('20260810200000','a_rerun_was_indistinguishable_from_a_first_attempt'),
  ('20260812210000','a_forecast_horizon_passed_and_nothing_was_on_the_other_side')
on conflict (version) do nothing;