CREATE TABLE IF NOT EXISTS public.memory_recall_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.agent_memory(id) ON DELETE CASCADE,
  trace_id uuid,
  user_id uuid NOT NULL,
  workspace_id uuid,
  outcome text NOT NULL DEFAULT 'ignored' CHECK (outcome IN ('used','ignored','contradicted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_recall_log TO authenticated;
GRANT ALL ON public.memory_recall_log TO service_role;
CREATE INDEX IF NOT EXISTS memory_recall_log_trace_idx ON public.memory_recall_log (trace_id);
CREATE INDEX IF NOT EXISTS memory_recall_log_memory_idx ON public.memory_recall_log (memory_id);
ALTER TABLE public.memory_recall_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own memory_recall_log all" ON public.memory_recall_log;
CREATE POLICY "own memory_recall_log all" ON public.memory_recall_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_memory_importance(p_memory_id uuid, p_delta integer)
RETURNS integer LANGUAGE sql AS $$
  UPDATE public.agent_memory
  SET importance = LEAST(5, GREATEST(1, importance + p_delta))
  WHERE id = p_memory_id
  RETURNING importance;
$$;
REVOKE EXECUTE ON FUNCTION public.bump_memory_importance(uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.bump_memory_importance(uuid, integer) TO authenticated;