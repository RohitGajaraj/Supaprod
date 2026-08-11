insert into supabase_migrations.schema_migrations (version, name) values
  ('20260811060000','the_graph_could_not_say_which_mission'),
  ('20260811090000','seed_and_real_were_told_apart_by_the_shape_of_an_id')
on conflict (version) do nothing;