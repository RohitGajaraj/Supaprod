INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260728234500',
  '20260728234500_messages_metadata_and_mission_id',
  ARRAY[
    'ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT ''{}''::jsonb',
    'ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS mission_id uuid',
    'CREATE INDEX IF NOT EXISTS idx_messages_mission_id ON public.messages (mission_id) WHERE mission_id IS NOT NULL'
  ]::text[]
)
ON CONFLICT (version) DO UPDATE
SET name = EXCLUDED.name,
    statements = EXCLUDED.statements;