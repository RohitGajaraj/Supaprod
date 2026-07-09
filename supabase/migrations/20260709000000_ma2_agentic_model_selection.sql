-- MA-2: Add agentic_model column to profiles for "active model for all agentic runs"
-- This lets users pin ONE model for all automatic/agentic runs (agent loop, autoReflect, researcher-tick, etc).
-- When set, this model overrides the default/auto routing for agentic operations.
-- When null, falls back to the best available model per AGENT_MODEL_PRIORITY / capability routing.

ALTER TABLE public.profiles
  ADD COLUMN agentic_model text;

-- Create an index for efficient lookups
CREATE INDEX idx_profiles_agentic_model ON public.profiles(id, agentic_model);

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.agentic_model IS
  'User-pinned model for all automatic/agentic runs (agent loop, autoReflect, researcher-tick, etc). Format: "provider/model-id" (e.g., "qwen/qwen-max"). If null, uses best available model per capability routing.';
