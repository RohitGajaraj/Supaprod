DO $$
DECLARE
  pending text[];
BEGIN
  WITH local(version, stem, suffix) AS (
    VALUES
      ('20260725120000', '20260725120000_investor_demo_accounts', 'investor_demo_accounts'),
      ('20260725130000', '20260725130000_helio_demo_seed_rich', 'helio_demo_seed_rich'),
      ('20260725140000', '20260725140000_clone_helio_to_investor_workspaces', 'clone_helio_to_investor_workspaces'),
      ('20260725160000', '20260725160000_daily_briefs_workspace_scoped_unique', 'daily_briefs_workspace_scoped_unique'),
      ('20260725180000', '20260725180000_project_slugs_for_readable_urls', 'project_slugs_for_readable_urls'),
      ('20260725200000', '20260725200000_workspace_slugs_and_reserved_names', 'workspace_slugs_and_reserved_names'),
      ('20260728234500', '20260728234500_messages_metadata_and_mission_id', 'messages_metadata_and_mission_id'),
      ('20260729175027', '20260729175027_c1f98398-eeb4-41be-932c-78559aba86c0', 'c1f98398-eeb4-41be-932c-78559aba86c0'),
      ('20260729175152', '20260729175152_f36b043e-fbac-41b2-bc32-a1a86877e9a9', 'f36b043e-fbac-41b2-bc32-a1a86877e9a9'),
      ('20260729175213', '20260729175213_3e3b922a-6369-4461-9985-435f3b493ee4', '3e3b922a-6369-4461-9985-435f3b493ee4'),
      ('20260729175259', '20260729175259_ea3882cd-2a30-4f31-8a26-cc5c72ca7df3', 'ea3882cd-2a30-4f31-8a26-cc5c72ca7df3')
  )
  SELECT array_agg(stem ORDER BY version)
    INTO pending
  FROM local l
  WHERE NOT EXISTS (
    SELECT 1
    FROM supabase_migrations.schema_migrations sm
    WHERE sm.version::text = l.version
       OR sm.name = l.stem
       OR sm.name = l.suffix
  );

  IF pending IS NOT NULL THEN
    RAISE EXCEPTION 'Pending latest migrations remain: %', array_to_string(pending, ', ');
  END IF;
END $$;