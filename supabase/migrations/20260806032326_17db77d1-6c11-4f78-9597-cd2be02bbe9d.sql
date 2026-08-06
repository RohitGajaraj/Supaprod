insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260805160000','cron_fleet_targets_production_with_deadlines'),
  ('20260805220000','seeded_rows_can_say_they_are_examples'),
  ('20260806020000','thirteen_of_sixteen_people_were_told_there_was_no_admin'),
  ('20260806040000','the_builder_was_sent_to_work_without_its_loop'),
  ('20260806060000','a_theme_made_only_of_examples_is_an_example')
on conflict (version) do nothing;